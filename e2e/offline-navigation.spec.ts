import { expect, test } from "@playwright/test";

test("offline navigation shows the offline page instead of home", async ({ page, context }) => {
  await page.goto("/en/community", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await context.setOffline(true);
  await page.goto("/en/creators");

  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Discover your next universe/i })).toHaveCount(0);
});
