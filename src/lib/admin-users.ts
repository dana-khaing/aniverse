import { z } from "zod";

export const managedRoleSchema = z.enum([
  "viewer",
  "creator",
  "moderator",
  "admin",
]);

export const userAccessActionSchema = z
  .object({
    userId: z.uuid(),
    action: z.enum(["grant_role", "revoke_role", "suspend", "restore"]),
    role: managedRoleSchema.optional(),
    reason: z.string().trim().min(10).max(500),
  })
  .superRefine((value, context) => {
    const changesRole =
      value.action === "grant_role" || value.action === "revoke_role";
    if (changesRole && !value.role)
      context.addIssue({
        code: "custom",
        path: ["role"],
        message: "Choose a role",
      });
    if (!changesRole && value.role)
      context.addIssue({
        code: "custom",
        path: ["role"],
        message: "Account actions do not accept a role",
      });
    if (value.action === "revoke_role" && value.role === "viewer")
      context.addIssue({
        code: "custom",
        path: ["role"],
        message: "The viewer role is required",
      });
  });

export const userSearchSchema = z.object({
  query: z.string().trim().max(80).default(""),
  cursor: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ManagedRole = z.infer<typeof managedRoleSchema>;
export type UserAccessAction = z.infer<typeof userAccessActionSchema>;

export function accessActionLabel(action: UserAccessAction["action"]) {
  return {
    grant_role: "Role granted",
    revoke_role: "Role revoked",
    suspend: "Account suspended",
    restore: "Account restored",
  }[action];
}
