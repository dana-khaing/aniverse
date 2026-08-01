import { describe, expect, it } from "vitest";
import { GET as live } from "./live/route";
import { GET as ready } from "./ready/route";

describe("deployment health boundaries", () => {
  it("keeps liveness independent from provider configuration", async () => {
    const response = live();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok", service: "aniverse" });
  });

  it("fails readiness when production providers are incomplete", async () => {
    const response = ready();
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.status).toBe("not_ready");
    expect(JSON.stringify(payload)).not.toMatch(/secret|token|password/i);
  });
});
