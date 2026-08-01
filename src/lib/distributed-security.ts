import "server-only";

import { createHash } from "node:crypto";
import { consumeRateLimit } from "@/lib/security";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function consumeDistributedRateLimit(
  scope: string,
  subject: string,
  capacity = 30,
  refillPerSecond = 0.5,
) {
  const keyHash = createHash("sha256")
    .update(`${scope}:${subject}`)
    .digest("hex");
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return consumeRateLimit(keyHash, capacity, refillPerSecond);
  const { data, error } = await getAdminClient().rpc("consume_api_rate_limit", {
    p_key_hash: keyHash,
    p_capacity: capacity,
    p_refill_per_second: refillPerSecond,
  });
  if (error) throw new Error("Distributed rate-limit enforcement failed");
  return data === true;
}
