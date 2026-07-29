import { expect, test } from "@playwright/test";

test("Japanese legal and support interfaces are fully localized", async ({ page }) => {
  await page.goto("/ja/support");
  await expect(page.getByRole("heading", { name: "物語に戻れるようお手伝いします。" })).toBeVisible();
  await expect(page.getByText("どのような問題ですか？")).toBeVisible();
  await expect(page.getByRole("button", { name: "サポート依頼を作成" })).toBeVisible();
  await page.goto("/ja/takedown");
  await expect(page.getByRole("heading", { name: "DMCA削除通知" })).toBeVisible();
  await expect(page.getByText("法的氏名")).toBeVisible();
  await expect(page.getByRole("button", { name: "通知を提出" })).toBeVisible();
});

test("localized metadata and language routes remain connected", async ({ page }) => {
  await page.goto("/en/status");
  await expect(page).toHaveTitle(/AniVerse service status/);
  await page.getByRole("link", { name: "日本語" }).click();
  await expect(page).toHaveURL(/\/ja\/status$/);
  await expect(page.getByRole("heading", { name: "AniVerse 稼働状況" })).toBeVisible();
  await expect(page.getByText("すべてのシステムは正常です").first()).toBeVisible();
});
