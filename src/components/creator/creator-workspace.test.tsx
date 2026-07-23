import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorWorkspace } from "@/components/creator/creator-workspace";

const cloudState = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: () => cloudState.enabled,
}));
vi.mock("@/lib/local-data/use-indexed-records", () => ({
  useIndexedRecords: () => ({ records: [], loading: false, refresh: vi.fn() }),
}));
vi.mock("@/components/creator/creator-insights", () => ({
  CreatorInsights: () => null,
}));

describe("creator workspace", () => {
  beforeEach(() => {
    localStorage.clear();
    cloudState.enabled = false;
    vi.unstubAllGlobals();
  });

  it("creates titles and episodes in local fallback mode", () => {
    render(<CreatorWorkspace />);
    fireEvent.change(screen.getByLabelText("New title name"), {
      target: { value: "Moon Garden" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText("Moon Garden")).toBeInTheDocument();
    const row = screen.getByText("Moon Garden").closest("div")?.parentElement;
    fireEvent.click(row!.querySelector("button")!);
    expect(row).toHaveTextContent("1 episodes");
  });

  it("offers validated WebVTT subtitle controls", () => {
    render(<CreatorWorkspace />);
    expect(
      screen.getByRole("heading", { name: "Episode subtitles" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Subtitle language")).toHaveValue("en");
    expect(screen.getByLabelText("Subtitle label")).toHaveValue("English");
    expect(
      screen.getByRole("button", { name: "Upload subtitles" }),
    ).toBeInTheDocument();
  });

  it("authors chapter, intro, and outro timelines", () => {
    render(<CreatorWorkspace />);
    expect(
      screen.getByRole("heading", { name: "Chapters and skip markers" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add marker" }));
    expect(screen.getByLabelText("Marker 1 type")).toHaveValue("chapter");
    expect(screen.getByLabelText("Marker 1 label")).toHaveValue("New chapter");
    expect(screen.getByLabelText("Marker 1 start seconds")).toHaveValue(0);
    expect(screen.getByRole("button", { name: "Save timeline" })).toBeEnabled();
  });

  it("connects a selected cloud episode to the Mux uploader", async () => {
    cloudState.enabled = true;
    const episode = {
      id: "987f6543-e21b-43d2-a456-426614174000",
      title: "Moon Garden",
      season: 1,
      episode: 2,
      episodeTitle: "Starlight",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/subtitles"))
          return Response.json({ episodes: [episode], tracks: [] });
        if (url.includes("/markers"))
          return Response.json({ episodes: [episode], markers: [] });
        if (url.includes("/studio"))
          return Response.json({
            workspace: {
              team: {
                id: "team-1",
                name: "Moon Works",
                role: "owner",
                members: [],
              },
              titles: [],
            },
          });
        if (url.includes("/invitations"))
          return Response.json({ invitations: [] });
        return Response.json({ releases: [] });
      }),
    );

    render(<CreatorWorkspace />);
    await waitFor(() =>
      expect(screen.getByLabelText("Video episode")).toHaveValue(episode.id),
    );
    expect(screen.getByLabelText("Upload to Mux")).toBeEnabled();
  });
});
