import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MoreMenu } from "./site-navigation";

describe("MoreMenu", () => {
  it("exposes locale-aware secondary destinations", () => {
    render(<MoreMenu locale="ja" />);
    const trigger=screen.getByRole("button", {name:/その他/});
    fireEvent.click(trigger);
    expect(screen.getByRole("menuitem", {name:/ランキング/})).toHaveAttribute("href","/ja/charts/seasonal");
    expect(screen.getByRole("menuitem", {name:/コミュニティ/})).toHaveAttribute("href","/ja/community");
  });

  it("closes on Escape and restores trigger focus", () => {
    render(<MoreMenu />);
    const trigger=screen.getByRole("button", {name:/More/});
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(document,{key:"Escape"});
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
