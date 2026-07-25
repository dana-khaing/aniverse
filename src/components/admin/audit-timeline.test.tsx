import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditTimeline } from "./audit-timeline";

describe("AuditTimeline", () => {
  it("filters immutable automated and staff events", () => {
    render(<AuditTimeline />);
    expect(screen.getByText(/creator_strike expired/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Audit entity filter"), {
      target: { value: "takedown" },
    });
    expect(
      screen.queryByText(/creator_strike expired/),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/takedown executed/)).toBeInTheDocument();
  });
});
