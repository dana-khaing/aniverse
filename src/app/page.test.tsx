import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("AniVerse home", () => {
  it("introduces the featured title and discovery sections", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /Echoes of Asteria/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trending now" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest episodes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Release schedule" })).toBeInTheDocument();
  });

  it("exposes primary navigation and accessible playback actions", () => {
    render(<Home />);
    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Watch now" })).toHaveAttribute("href", "/watch/echoes-of-asteria/1");
    expect(screen.getAllByRole("link", { name: /^Play / })).toHaveLength(9);
    expect(screen.getAllByRole("link", { name: "Play Echoes of Asteria" })[0]).toHaveAttribute(
      "href",
      "/watch/echoes-of-asteria/1",
    );
  });

  it("routes homepage discovery controls through implemented catalog pages", () => {
    render(<Home />);
    expect(screen.getByRole("form", { name: "Find anime" })).toHaveAttribute(
      "action",
      "/browse",
    );
    expect(screen.getByRole("searchbox", { name: "Search anime" })).toHaveAttribute(
      "name",
      "q",
    );
    expect(screen.getByRole("link", { name: "Asteria" })).toHaveAttribute(
      "href",
      "/browse?q=asteria",
    );
    expect(screen.getAllByRole("link", { name: /View all/ })[0]).toHaveAttribute(
      "href",
      "/browse?sort=score",
    );
    expect(screen.getAllByRole("link", { name: /View all/ })[1]).toHaveAttribute(
      "href",
      "/browse?sort=newest",
    );
  });
});
