import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WebsiteGuide } from "./website-guide";

describe("website user guide", () => {
  it("switches role guidance and filters it with search", () => {
    render(<WebsiteGuide />);
    expect(screen.getByRole("heading", { name: "Find your next story" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Creator" }));
    expect(screen.getByRole("heading", { name: "Publish original animation" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create watchlists and custom lists" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search playback, lists, privacy..."), { target: { value: "no-such-topic" } });
    expect(screen.getByText("No guide matched that search.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("heading", { name: "Publish original animation" })).toBeInTheDocument();
  });
});
