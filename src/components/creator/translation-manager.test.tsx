import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TranslationManager } from "./translation-manager";

describe("creator translation manager", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads title metadata and switches between English and Japanese", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          titles: [
            {
              id: "987f6543-e21b-43d2-a456-426614174000",
              name: "Moon Garden",
              native_name: "月の庭",
              synopsis: "A garden beneath the stars.",
              status: "draft",
            },
          ],
          translations: [],
        }),
      ),
    );

    render(<TranslationManager cloud />);
    await waitFor(() =>
      expect(screen.getByLabelText("Translation title")).toHaveValue(
        "987f6543-e21b-43d2-a456-426614174000",
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Display title")).toHaveValue("Moon Garden"),
    );
    fireEvent.click(screen.getByRole("tab", { name: /日本語/ }));
    await waitFor(() =>
      expect(screen.getByLabelText("Native or alternate title")).toHaveValue(
        "月の庭",
      ),
    );
    expect(screen.getByRole("button", { name: "Save 日本語" })).toBeEnabled();
  });
});
