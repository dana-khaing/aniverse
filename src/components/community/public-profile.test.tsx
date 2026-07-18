import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PublicProfile } from "./public-profile";

describe("PublicProfile", () => {
  beforeEach(() => localStorage.clear());

  it("opens a confidential report dialog for another profile", () => {
    render(<PublicProfile username="mika" />);
    fireEvent.click(screen.getByRole("button", { name: "Report" }));
    expect(screen.getByRole("dialog", { name: "Report @mika" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Review title" })).not.toBeInTheDocument();
  });
});
