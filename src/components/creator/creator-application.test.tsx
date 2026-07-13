import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CreatorApplicationForm } from "./creator-application";

describe("creator application", () => {
  beforeEach(() => localStorage.clear());

  it("persists a submitted creator application", () => {
    render(<CreatorApplicationForm />);

    fireEvent.change(screen.getByLabelText("Channel or studio name"), {
      target: { value: "Moonframe" },
    });
    fireEvent.change(screen.getByLabelText("Legal name"), {
      target: { value: "Dana Lewis" },
    });
    fireEvent.change(screen.getByLabelText("Rights and ownership summary"), {
      target: { value: "I own and distribute this original series." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));

    expect(screen.getByText("Application submitted")).toBeInTheDocument();
    expect(localStorage.getItem("aniverse.creator-application")).toContain(
      '"status":"submitted"',
    );
  });
});
