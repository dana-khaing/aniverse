import { z } from "zod";

export const auditFilterSchema = z.object({
  action: z.string().trim().max(120).optional(),
  entityType: z.string().trim().max(120).optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export function auditSummary(entry: {
  action: string;
  entity_type: string;
  entity_id: string | null;
}) {
  return `${entry.action.replaceAll(".", " ")} · ${entry.entity_type}${entry.entity_id ? ` ${entry.entity_id.slice(0, 8)}` : ""}`;
}
