import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LocalizedBrowsePage } from "./localized-browse-page";
import { LocalizedSchedulePage } from "./localized-schedule-page";

describe("localized catalog pages", () => {
  it("renders the complete Japanese discovery interface", async () => {
    render(
      await LocalizedBrowsePage({
        locale: "ja",
        searchParams: Promise.resolve({ genre: "Fantasy" }),
      }),
    );
    expect(
      screen.getByRole("heading", { name: "アニメを探す" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("ジャンル")).toHaveValue("Fantasy");
    expect(screen.getByRole("button", { name: "適用" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "絞り込みをリセット" }),
    ).toHaveAttribute("href", "/ja/browse");
  });

  it("localizes schedule labels and title metadata", async () => {
    render(await LocalizedSchedulePage({ locale: "ja" }));
    expect(
      screen.getByRole("heading", { name: "配信スケジュール" }),
    ).toBeInTheDocument();
    expect(screen.getByText("月曜日")).toBeInTheDocument();
    expect(screen.getByText("アステリアの残響")).toBeInTheDocument();
  });
});
