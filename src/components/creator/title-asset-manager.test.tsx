import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TitleAssetManager } from "./title-asset-manager";

describe("creator title asset manager", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads artwork previews and trailer controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          titles: [
            {
              id: "987f6543-e21b-43d2-a456-426614174000",
              name: "Moon Garden",
              slug: "moon-garden",
              status: "draft",
            },
          ],
          assets: [
            {
              id: "987f6543-e21b-43d2-a456-426614174001",
              titleId: "987f6543-e21b-43d2-a456-426614174000",
              kind: "poster",
              url: "https://media.example/poster.webp",
              mimeType: "image/webp",
              bytes: 1024,
              updatedAt: "2026-07-23T12:00:00Z",
            },
          ],
        }),
      ),
    );

    render(<TitleAssetManager cloud />);

    await waitFor(() =>
      expect(screen.getByLabelText("Artwork title")).toHaveValue(
        "987f6543-e21b-43d2-a456-426614174000",
      ),
    );
    expect(screen.getByAltText("poster preview")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload poster")).toBeEnabled();
    expect(screen.getByLabelText("Upload backdrop")).toBeEnabled();
    expect(screen.getByLabelText("Trailer URL")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save trailer" })).toBeEnabled();
  });
});
