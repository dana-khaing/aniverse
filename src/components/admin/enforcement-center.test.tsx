import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnforcementCenter } from "./enforcement-center";

describe("EnforcementCenter", () => {
  it("executes takedowns and appeal remediation in local mode", async () => {
    render(<EnforcementCenter />);
    fireEvent.click(screen.getByRole("button", { name: "Execute takedown" }));
    expect(
      await screen.findByText("Takedown executed atomically."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Approve and restore" }),
    );
    expect(
      await screen.findByText(/strike revoked and linked title restored/),
    ).toBeInTheDocument();
  });
});
