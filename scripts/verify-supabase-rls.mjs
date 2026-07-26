import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "ANIVERSE_RLS_USER_A_EMAIL",
  "ANIVERSE_RLS_USER_A_PASSWORD",
  "ANIVERSE_RLS_USER_B_EMAIL",
  "ANIVERSE_RLS_USER_B_PASSWORD",
];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(
    `Live RLS verification needs these environment variables: ${missing.join(", ")}`,
  );
  process.exit(2);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const options = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};
const userA = createClient(url, key, options);
const userB = createClient(url, key, options);
const checks = [];
const fixtureIds = { a: randomUUID(), b: randomUUID() };

function assert(condition, message) {
  if (!condition) throw new Error(message);
  checks.push(message);
}

async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) throw new Error("A verification account could not sign in");
  return data.user;
}

async function query(client, table, columns = "*") {
  const result = await client.from(table).select(columns);
  if (result.error) throw new Error(`${table} query failed: ${result.error.message}`);
  return result.data ?? [];
}

async function cleanup() {
  await Promise.allSettled([
    userA.from("custom_lists").delete().eq("id", fixtureIds.a),
    userB.from("custom_lists").delete().eq("id", fixtureIds.b),
    userA.auth.signOut(),
    userB.auth.signOut(),
  ]);
}

try {
  const [identityA, identityB] = await Promise.all([
    signIn(
      userA,
      process.env.ANIVERSE_RLS_USER_A_EMAIL,
      process.env.ANIVERSE_RLS_USER_A_PASSWORD,
    ),
    signIn(
      userB,
      process.env.ANIVERSE_RLS_USER_B_EMAIL,
      process.env.ANIVERSE_RLS_USER_B_PASSWORD,
    ),
  ]);
  assert(identityA.id !== identityB.id, "verification identities are distinct");

  const suffix = Date.now().toString(36);
  const [createdA, createdB] = await Promise.all([
    userA
      .from("custom_lists")
      .insert({
        id: fixtureIds.a,
        user_id: identityA.id,
        name: `RLS A ${suffix}`,
      })
      .select("id")
      .single(),
    userB
      .from("custom_lists")
      .insert({
        id: fixtureIds.b,
        user_id: identityB.id,
        name: `RLS B ${suffix}`,
      })
      .select("id")
      .single(),
  ]);
  assert(!createdA.error && !createdB.error, "each user can create an owned list");

  const [aReadsA, aReadsB, bReadsA, bReadsB] = await Promise.all([
    userA.from("custom_lists").select("id,user_id").eq("id", fixtureIds.a),
    userA.from("custom_lists").select("id,user_id").eq("id", fixtureIds.b),
    userB.from("custom_lists").select("id,user_id").eq("id", fixtureIds.a),
    userB.from("custom_lists").select("id,user_id").eq("id", fixtureIds.b),
  ]);
  assert(aReadsA.data?.length === 1, "user A can read their list");
  assert(aReadsB.data?.length === 0, "user A cannot read user B list");
  assert(bReadsA.data?.length === 0, "user B cannot read user A list");
  assert(bReadsB.data?.length === 1, "user B can read their list");

  const crossUpdate = await userA
    .from("custom_lists")
    .update({ name: "RLS cross-account update" })
    .eq("id", fixtureIds.b)
    .select("id");
  assert(
    !crossUpdate.error && crossUpdate.data?.length === 0,
    "cross-account list updates are blocked",
  );

  const [rolesA, rolesB] = await Promise.all([
    query(userA, "user_roles", "user_id,role"),
    query(userB, "user_roles", "user_id,role"),
  ]);
  assert(
    rolesA.every((role) => role.user_id === identityA.id),
    "user A cannot read user B roles",
  );
  assert(
    rolesB.every((role) => role.user_id === identityB.id),
    "user B cannot read user A roles",
  );

  const escalation = await userA.from("user_roles").insert({
    user_id: identityA.id,
    role: "admin",
  });
  assert(Boolean(escalation.error), "client-side admin role escalation is rejected");

  console.log(
    JSON.stringify(
      { status: "passed", checks: checks.length, verifiedAt: new Date().toISOString() },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Live RLS verification failed");
  process.exitCode = 1;
} finally {
  await cleanup();
}
