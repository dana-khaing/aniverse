import "server-only";

import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";
import { createClient } from "./server";

export const staffRoles = ["moderator", "admin"] as const;
export type StaffRole = (typeof staffRoles)[number];

type AccessResult =
  | { ok: true; user: User; roles: StaffRole[] }
  | { ok: false; response: Response };

export function includesRequiredRole(
  assigned: readonly string[],
  required: readonly StaffRole[],
) {
  return required.some((role) => assigned.includes(role));
}

export async function authorizeRoles(
  required: readonly StaffRole[],
): Promise<AccessResult> {
  if (!isSupabaseConfigured())
    return {
      ok: false,
      response: Response.json(
        { error: "Cloud authorization is unavailable" },
        { status: 503 },
      ),
    };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      ok: false,
      response: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", [...required]);
  const roles = (data ?? [])
    .map(({ role }) => String(role))
    .filter((role): role is StaffRole =>
      staffRoles.includes(role as StaffRole),
    );

  if (error || !includesRequiredRole(roles, required))
    return {
      ok: false,
      response: Response.json(
        {
          error: required.length === 1
            ? "Administrator access required"
            : "Staff access required",
        },
        { status: 403 },
      ),
    };

  return { ok: true, user, roles };
}

export const authorizeAdministrator = () => authorizeRoles(["admin"]);
export const authorizeStaff = () => authorizeRoles(staffRoles);
