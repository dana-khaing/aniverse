import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CommunityFeed } from "./community-feed";

describe("community feed", () => {
  beforeEach(() => localStorage.clear());

  it("publishes a post and marks notifications read", () => {
    render(<CommunityFeed />);

    fireEvent.change(screen.getByLabelText("Create community post"), {
      target: { value: "Independent animation deserves this space." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish post" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));

    expect(
      screen.getByText("Independent animation deserves this space."),
    ).toBeInTheDocument();
    const stored = localStorage.getItem("aniverse.community");
    expect(stored).toContain("Independent animation deserves this space.");
    expect(stored).not.toContain('"read":false');
  });

  it("opens a confidential report flow for a post", () => {
    render(<CommunityFeed />);
    fireEvent.click(
      screen.getAllByRole("button", { name: /Report:/ })[0],
    );
    expect(
      screen.getByRole("dialog", { name: "Report community post" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "This contains repeated targeted harassment." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Submit confidential report" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Report:/ })[0],
    ).toBeDisabled();
  });

  it("renders localized community controls", () => {
    render(<CommunityFeed locale="ja" />);

    expect(
      screen.getByRole("heading", { name: "物語を、みんなで楽しもう" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("コミュニティ投稿を作成")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "すべて既読" }),
    ).toBeInTheDocument();
  });
});
