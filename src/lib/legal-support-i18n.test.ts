import { describe, expect, it } from "vitest";
import { legalSupportMessages } from "./legal-support-i18n";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, shape(item)]),
    );
  return typeof value;
}

describe("legal and support translations", () => {
  it("keeps every locale structurally complete", () => {
    expect(shape(legalSupportMessages.ja)).toEqual(shape(legalSupportMessages.en));
  });

  it("contains no empty interface strings", () => {
    for (const dictionary of Object.values(legalSupportMessages))
      expect(JSON.stringify(dictionary)).not.toMatch(/:""/);
  });
});
