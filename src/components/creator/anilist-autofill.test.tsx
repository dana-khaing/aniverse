import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AniListAutofill } from "./anilist-autofill";

describe("AniListAutofill", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("searches AniList and applies the picked result to the draft", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1,
              title: "Neon Ronin",
              nativeTitle: "ネオン浪人",
              synopsis: "A masterless swordsman hunts corrupted memories.",
              year: 2026,
              format: "TV",
              coverImage: null,
              siteUrl: "https://anilist.co/anime/1",
            },
          ],
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const onApply = vi.fn();
    render(<AniListAutofill onApply={onApply} />);

    fireEvent.change(screen.getByLabelText("Autofill from AniList"), {
      target: { value: "neon ronin" },
    });

    await screen.findByText("Neon Ronin");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/creator/anilist-search?q=neon%20ronin",
      expect.objectContaining({ signal: expect.anything() }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Neon Ronin/ }));
    expect(onApply).toHaveBeenCalledWith({
      nativeName: "ネオン浪人",
      synopsis: "A masterless swordsman hunts corrupted memories.",
    });
    expect(
      screen.queryByRole("listbox"),
    ).not.toBeInTheDocument();
  });

  it("does not search until the query is at least two characters", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<AniListAutofill onApply={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Autofill from AniList"), {
      target: { value: "n" },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
