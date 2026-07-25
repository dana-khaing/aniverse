import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminUserManager } from "./admin-user-manager";

describe("AdminUserManager", () => {
  it("searches local users and grants a role with a reason", async () => {
    render(<AdminUserManager />);
    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "Mika" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getAllByText("mika@example.com")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Mika/ }));
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "creator" },
    });
    fireEvent.change(screen.getByLabelText("Access change reason"), {
      target: { value: "Approved creator access after staff verification." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Grant role" }));
    expect(
      await screen.findByText("creator role granted."),
    ).toBeInTheDocument();
  });

  it("requires an audit reason before suspending an account", async () => {
    render(<AdminUserManager />);
    fireEvent.click(screen.getByRole("button", { name: "Suspend account" }));
    expect(
      await screen.findByText("Add a reason of at least 10 characters."),
    ).toBeInTheDocument();
  });
});
