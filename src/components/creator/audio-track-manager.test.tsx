import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioTrackManager } from "./audio-track-manager";

describe("AudioTrackManager", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("adds a secure alternate audio track", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            episodes: [
              {
                id: "episode-1",
                title: "Skybound",
                season: 1,
                episode: 2,
                episodeTitle: "Clouds",
              },
            ],
            tracks: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            track: {
              id: "track-1",
              episode_id: "episode-1",
              language_code: "ja",
              label: "Japanese",
              is_default: false,
              status: "preparing",
              error_message: null,
            },
          }),
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(<AudioTrackManager cloud />);
    await screen.findByText("Skybound · S1 E2");
    fireEvent.change(screen.getByLabelText("Audio source URL"), {
      target: { value: "https://media.example/japanese.m4a" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add audio" }));
    await screen.findByText(/Mux is preparing/);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/v1/creator/audio-tracks",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("explains the provider requirement in local mode", () => {
    render(<AudioTrackManager cloud={false} />);
    expect(
      screen.getByText("Cloud audio is ready to connect"),
    ).toBeInTheDocument();
  });
});
