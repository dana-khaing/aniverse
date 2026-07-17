import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LibraryDashboard } from "./library-dashboard";
import { TitleLibraryActions } from "./title-library-actions";

describe("user library", () => {
  beforeEach(() => localStorage.clear());

  it("shows Watchlist, history, and custom-list management", () => {
    render(<LibraryDashboard />);
    expect(screen.getByRole("heading", { name: "Watchlist" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Watch history" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("New list name"), { target: { value: "Rainy nights" } });
    fireEvent.click(screen.getByRole("button", { name: /create list/i }));
    expect(screen.getByText("Rainy nights")).toBeInTheDocument();
  });

  it("lets a user add and remove a title from Watchlist", () => {
    render(<TitleLibraryActions slug="garden-of-spirits" />);
    const add = screen.getByRole("button", { name: "Watchlist" });
    fireEvent.click(add);
    expect(screen.getByRole("button", { name: "In Watchlist" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "In Watchlist" }));
    expect(screen.getByRole("button", { name: "Watchlist" })).toBeInTheDocument();
  });
});
