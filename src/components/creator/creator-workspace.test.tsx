import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorWorkspace } from "@/components/creator/creator-workspace";

vi.mock("@/lib/local-data/use-indexed-records", () => ({
  useIndexedRecords: () => ({ records: [], loading: false, refresh: vi.fn() }),
}));
vi.mock("@/components/creator/creator-insights", () => ({
  CreatorInsights: () => null,
}));

describe("creator workspace", () => {
  beforeEach(() => localStorage.clear());

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
});
