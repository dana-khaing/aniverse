import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceReview } from "./evidence-review";

describe("EvidenceReview", () => {
  it("documents and verifies pending evidence in local mode", async () => {
    render(<EvidenceReview />);
    expect(screen.getAllByText("Targeted harassment")).toHaveLength(2);
    expect(screen.getByText(/SHA-256/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Evidence review notes"), {
      target: { value: "Source and hash checked." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByText("Evidence verified.")).toBeInTheDocument();
  });
});
