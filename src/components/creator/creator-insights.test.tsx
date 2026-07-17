import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorInsights } from "@/components/creator/creator-insights";

describe("creator release calendar", () => {
  beforeEach(() => { localStorage.clear(); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("local mode"))); });
  it("schedules each supported release kind locally", () => {
    render(<CreatorInsights />);
    fireEvent.change(screen.getByLabelText("Release title"), { target: { value: "Finale night" } });
    fireEvent.change(screen.getByLabelText("Release kind"), { target: { value: "Premiere" } });
    fireEvent.change(screen.getByLabelText("Release time"), { target: { value: "2026-07-20T20:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    const release = screen.getByText("Finale night").closest("article");
    expect(release).toHaveTextContent("Premiere");
  });
});
