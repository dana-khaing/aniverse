import { userAccessActionSchema, userSearchSchema } from "@/lib/admin-users";
import { getAdminClient } from "@/lib/supabase/admin";
import { authorizeAdministrator } from "@/lib/supabase/authorization";

export async function GET(request: Request) {
  const access = await authorizeAdministrator();
  if (!access.ok) return access.response;
  const url = new URL(request.url);
  const parsed = userSearchSchema.safeParse({
    query: url.searchParams.get("query") ?? "",
    cursor: url.searchParams.get("cursor") ?? "1",
    limit: url.searchParams.get("limit") ?? "20",
  });
  if (!parsed.success)
    return Response.json({ error: "Invalid user search" }, { status: 400 });

  const admin = getAdminClient();
  const { data: authPage, error: authError } = await admin.auth.admin.listUsers(
    {
      page: parsed.data.cursor,
      perPage: parsed.data.limit,
    },
  );
  if (authError)
    return Response.json(
      { error: "Users could not be loaded" },
      { status: 500 },
    );

  const normalizedQuery = parsed.data.query.toLocaleLowerCase();
  const authUsers = authPage.users.filter((user) => {
    if (!normalizedQuery) return true;
    const metadataName =
      typeof user.user_metadata.display_name === "string"
        ? user.user_metadata.display_name
        : "";
    return [user.email ?? "", metadataName]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
  const ids = authUsers.map((user) => user.id);
  const [{ data: profiles }, { data: roles }, { data: controls }] = ids.length
    ? await Promise.all([
        admin
          .from("profiles")
          .select("id,display_name,username,avatar_path,created_at")
          .in("id", ids),
        admin
          .from("user_roles")
          .select("user_id,role,granted_at")
          .in("user_id", ids),
        admin
          .from("user_account_controls")
          .select("user_id,suspended_at,suspension_reason,updated_at")
          .in("user_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  const controlById = new Map(
    (controls ?? []).map((control) => [control.user_id, control]),
  );
  const users = authUsers.map((user) => {
    const profile = profileById.get(user.id);
    const control = controlById.get(user.id);
    return {
      id: user.id,
      email: user.email ?? "Email unavailable",
      displayName:
        profile?.display_name ??
        (typeof user.user_metadata.display_name === "string"
          ? user.user_metadata.display_name
          : null) ??
        profile?.username ??
        "AniVerse member",
      username: profile?.username ?? null,
      avatarPath: profile?.avatar_path ?? null,
      createdAt: profile?.created_at ?? user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      roles: (roles ?? [])
        .filter((role) => role.user_id === user.id)
        .map((role) => role.role),
      suspendedAt: control?.suspended_at ?? null,
      suspensionReason: control?.suspension_reason ?? null,
    };
  });
  return Response.json(
    {
      users,
      page: parsed.data.cursor,
      hasMore: authPage.users.length === parsed.data.limit,
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PATCH(request: Request) {
  const access = await authorizeAdministrator(request);
  if (!access.ok) return access.response;
  const actor = access.user;
  const parsed = userAccessActionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid access change" },
      { status: 400 },
    );

  const admin = getAdminClient();
  const { action, userId, role, reason } = parsed.data;
  const changesSuspension = action === "suspend" || action === "restore";
  if (changesSuspension) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: action === "suspend" ? "876000h" : "none",
    });
    if (authError)
      return Response.json(
        { error: "Authentication access could not be updated" },
        { status: 502 },
      );
  }

  const { error } = await admin.rpc("manage_user_access", {
    p_actor_id: actor.id,
    p_user_id: userId,
    p_action: action,
    p_reason: reason,
    p_role: role ?? null,
  });
  if (error) {
    if (changesSuspension)
      await admin.auth.admin.updateUserById(userId, {
        ban_duration: action === "suspend" ? "none" : "876000h",
      });
    return Response.json(
      { error: error.message || "Access change could not be saved" },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
