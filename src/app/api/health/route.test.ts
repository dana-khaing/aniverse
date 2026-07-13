import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("health diagnostics", () => {
  it("reports service and integration readiness without secrets", async () => {
    const response = GET();
    const payload = await response.json();

    expect(payload.status).toBe("ok");
    expect(payload.service).toBe("aniverse");
    expect(payload.integrations).toEqual({
      supabase: false,
      resend: false,
      sentry: false,
      mux: false,
    });
    expect(JSON.stringify(payload)).not.toContain("TOKEN");
  });
});
