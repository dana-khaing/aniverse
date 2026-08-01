import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => false,
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));

import { consumeDistributedRateLimit } from "./distributed-security";
import { resetSecurityState } from "./security";

describe("distributed security fallback", () => {
  beforeEach(resetSecurityState);

  it("keeps local development usable while enforcing capacity", async () => {
    await expect(consumeDistributedRateLimit("search", "visitor", 2, 0.001)).resolves.toBe(true);
    await expect(consumeDistributedRateLimit("search", "visitor", 2, 0.001)).resolves.toBe(true);
    await expect(consumeDistributedRateLimit("search", "visitor", 2, 0.001)).resolves.toBe(false);
  });

  it("isolates namespaces before hashing subjects", async () => {
    await expect(consumeDistributedRateLimit("search", "same", 1, 0.001)).resolves.toBe(true);
    await expect(consumeDistributedRateLimit("report", "same", 1, 0.001)).resolves.toBe(true);
  });
});
