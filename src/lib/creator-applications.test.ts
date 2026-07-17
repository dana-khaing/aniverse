import { describe,expect,it } from "vitest";
import { creatorSlug } from "./creator-applications";
describe("creator applications",()=>{it("builds stable team slugs from channel names",()=>{expect(creatorSlug("Lumen Works!","12345678-abcd")).toBe("lumen-works-12345678")});it("uses a safe fallback for non-Latin names",()=>{expect(creatorSlug("星空","abcdef12-rest")).toBe("creator-abcdef12")})});
