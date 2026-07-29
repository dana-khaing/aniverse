import { expect, test } from "@playwright/test";

test("administrator can inspect and replay failed deliveries", async ({ page }) => {
  await page.goto("/admin");
  const operations = page.locator(".notification-operations");
  await expect(operations.getByRole("heading", { name: "Email and push history" })).toBeVisible();
  await expect(operations.getByText("Invitation to join Northstar Studio")).toBeVisible();
  await operations.getByRole("button", { name: "Replay" }).click();
  await expect(operations.getByRole("status")).toContainText("queued for replay");
});
