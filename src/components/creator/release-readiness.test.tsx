import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReleaseReadiness } from "./release-readiness";

describe("ReleaseReadiness", () => {
  it("shows exact media blockers before moderation review", () => {
    render(<ReleaseReadiness cloud={false} />);
    expect(screen.getAllByText("80%")).toHaveLength(2);
    expect(screen.getByText("0/1 episodes ready")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit for review" }),
    ).toBeDisabled();
  });

  it("links each requirement to its creator control", () => {
    render(<ReleaseReadiness cloud={false} />);
    fireEvent.click(screen.getByRole("link", { name: /Trailer/ }));
    expect(screen.getByRole("link", { name: /Trailer/ })).toHaveAttribute(
      "href",
      "#artwork",
    );
  });
});
