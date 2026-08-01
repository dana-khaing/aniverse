import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const accountDefinitions = [
  { name: "viewer-a", prefix: "ANIVERSE_RLS_VIEWER_A", role: null },
  { name: "viewer-b", prefix: "ANIVERSE_RLS_VIEWER_B", role: null },
  { name: "creator", prefix: "ANIVERSE_RLS_CREATOR", role: "creator" },
  { name: "moderator", prefix: "ANIVERSE_RLS_MODERATOR", role: "moderator" },
  { name: "admin", prefix: "ANIVERSE_RLS_ADMIN", role: "admin" },
];
const compatibility = {
  ANIVERSE_RLS_VIEWER_A_EMAIL: "ANIVERSE_RLS_USER_A_EMAIL",
  ANIVERSE_RLS_VIEWER_A_PASSWORD: "ANIVERSE_RLS_USER_A_PASSWORD",
  ANIVERSE_RLS_VIEWER_B_EMAIL: "ANIVERSE_RLS_USER_B_EMAIL",
  ANIVERSE_RLS_VIEWER_B_PASSWORD: "ANIVERSE_RLS_USER_B_PASSWORD",
};
const env = (name) => process.env[name] || process.env[compatibility[name]];
const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"].concat(
  accountDefinitions.flatMap(({ prefix }) => [`${prefix}_EMAIL`, `${prefix}_PASSWORD`]),
);
const missing = required.filter((name) => !env(name));
const reportPath = process.env.ANIVERSE_RLS_REPORT_PATH;

async function emit(report) {
  const output = `${JSON.stringify(report, null, 2)}\n`;
  console.log(output.trim());
  if (reportPath) {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, output, { mode: 0o600 });
  }
}

if (process.argv.includes("--check-config")) {
  await emit({
    status: missing.length ? "incomplete" : "ready",
    accounts: accountDefinitions.map(({ name, role, prefix }) => ({
      name,
      expectedRole: role ?? "viewer",
      configured: Boolean(env(`${prefix}_EMAIL`) && env(`${prefix}_PASSWORD`)),
    })),
    missing,
  });
  process.exit(missing.length ? 2 : 0);
}

if (missing.length) {
  console.error(`Live RLS verification is missing: ${missing.join(", ")}`);
  await emit({
    status: "incomplete",
    checks: [],
    checkCount: 0,
    accountCount: accountDefinitions.length,
    cleanup: "not-started",
    verifiedAt: new Date().toISOString(),
    missing,
  });
  process.exit(2);
}

const options = {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
};
const makeClient = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, options);
const accounts = accountDefinitions.map((definition) => ({
  ...definition,
  client: makeClient(),
  fixtureId: randomUUID(),
  partyId: randomUUID(),
}));
const anonymous = makeClient();
const checks = [];
let artworkPath;

function assert(condition, name) {
  if (!condition) throw new Error(name);
  checks.push({ name, status: "passed" });
}

async function signIn(account) {
  const { data, error } = await account.client.auth.signInWithPassword({
    email: env(`${account.prefix}_EMAIL`),
    password: env(`${account.prefix}_PASSWORD`),
  });
  if (error || !data.user) throw new Error(`${account.name} could not sign in`);
  account.userId = data.user.id;
}

async function cleanup() {
  const creator = accounts.find(({ name }) => name === "creator");
  const results = await Promise.allSettled(
    accounts.flatMap((account) => [
      account.client.from("custom_lists").delete().eq("id", account.fixtureId),
      account.client.from("watch_party_members").delete().eq("party_id", account.partyId),
      account.client.from("watch_parties").delete().eq("id", account.partyId),
      account.client.auth.signOut(),
    ]).concat(
      artworkPath && creator
        ? [creator.client.storage.from("title-artwork").remove([artworkPath])]
        : [],
    ),
  );
  return results.every(
    (result) => result.status === "fulfilled" && !result.value?.error,
  );
}

let failure;
try {
  await Promise.all(accounts.map(signIn));
  assert(
    new Set(accounts.map(({ userId }) => userId)).size === accounts.length,
    "all verification identities are distinct",
  );

  const publicCatalog = await anonymous.from("titles").select("id").limit(1);
  assert(!publicCatalog.error, "anonymous users can read the public catalog");

  const suffix = Date.now().toString(36);
  const created = await Promise.all(
    accounts.map((account) =>
      account.client
        .from("custom_lists")
        .insert({
          id: account.fixtureId,
          user_id: account.userId,
          name: `RLS ${account.name} ${suffix}`,
        })
        .select("id")
        .single(),
    ),
  );
  assert(created.every(({ error }) => !error), "every account can create owned data");

  for (const actor of accounts) {
    const visible = await actor.client
      .from("custom_lists")
      .select("id")
      .in("id", accounts.map(({ fixtureId }) => fixtureId));
    assert(
      !visible.error &&
        visible.data?.length === 1 &&
        visible.data[0].id === actor.fixtureId,
      `${actor.name} reads only owned private data`,
    );
  }

  const crossUpdate = await accounts[0].client
    .from("custom_lists")
    .update({ name: "blocked cross-account update" })
    .eq("id", accounts[1].fixtureId)
    .select("id");
  assert(
    !crossUpdate.error && crossUpdate.data?.length === 0,
    "cross-account private updates are blocked",
  );

  for (const account of accounts) {
    const roles = await account.client
      .from("user_roles")
      .select("user_id,role");
    assert(
      !roles.error && roles.data.every(({ user_id }) => user_id === account.userId),
      `${account.name} cannot inspect other account roles`,
    );
    if (account.role) {
      assert(
        roles.data.some(({ role }) => role === account.role),
        `${account.name} has the expected ${account.role} role`,
      );
    }
  }

  const escalation = await accounts[0].client.from("user_roles").insert({
    user_id: accounts[0].userId,
    role: "admin",
  });
  assert(Boolean(escalation.error), "client-side role escalation is rejected");

  const partyOwner = accounts[0];
  const partyIntruder = accounts[1];
  const party = await partyOwner.client.from("watch_parties").insert({
    id: partyOwner.partyId,
    host_id: partyOwner.userId,
    name: `RLS party ${suffix}`,
  });
  assert(!party.error, "an account can create its own watch party");
  const membership = await partyOwner.client.from("watch_party_members").insert({
    party_id: partyOwner.partyId,
    user_id: partyOwner.userId,
    role: "host",
  });
  assert(!membership.error, "a party host can create an owned membership");
  const hiddenParty = await partyIntruder.client
    .from("watch_parties")
    .select("id")
    .eq("id", partyOwner.partyId);
  assert(
    !hiddenParty.error && hiddenParty.data.length === 0,
    "non-members cannot read private watch-party state",
  );

  const creator = accounts.find(({ name }) => name === "creator");
  if (!creator) throw new Error("creator verification account is missing");
  const creatorMemberships = await creator.client
    .from("creator_team_memberships")
    .select("user_id,team_id,role");
  assert(
    !creatorMemberships.error &&
      creatorMemberships.data.every(({ user_id }) => user_id === creator.userId),
    "creator-team membership visibility is scoped to the signed-in creator",
  );

  artworkPath = `${creator.userId}/rls-${randomUUID()}.png`;
  const artwork = await creator.client.storage
    .from("title-artwork")
    .upload(artworkPath, new Uint8Array([137, 80, 78, 71]), {
      contentType: "image/png",
      upsert: false,
    });
  assert(!artwork.error, "creator can upload an owned artwork fixture");
  await partyIntruder.client.storage
    .from("title-artwork")
    .remove([artworkPath]);
  const retainedArtwork = await creator.client.storage
    .from("title-artwork")
    .download(artworkPath);
  assert(
    !retainedArtwork.error && retainedArtwork.data,
    "another account cannot delete creator-owned storage objects",
  );
} catch (error) {
  failure = error instanceof Error ? error.message : "Live RLS verification failed";
} finally {
  const cleanupPassed = await cleanup();
  if (!cleanupPassed && !failure) failure = "fixture cleanup failed";
  await emit({
    status: failure ? "failed" : "passed",
    checks,
    checkCount: checks.length,
    accountCount: accounts.length,
    cleanup: cleanupPassed ? "passed" : "failed",
    verifiedAt: new Date().toISOString(),
    ...(failure ? { failure } : {}),
  });
  if (failure) process.exitCode = 1;
}
