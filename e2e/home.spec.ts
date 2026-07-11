import { expect, test } from "@playwright/test";

test("home page presents discovery and schedule content", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AniVerse/);
  await expect(page.getByRole("heading", { level: 1, name: /Echoes of Asteria/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trending now" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Release schedule" })).toBeVisible();
  await expect(page.locator("html")).not.toHaveCSS("overflow-x", "scroll");
});

test("health endpoint reports readiness", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ status: "ok", service: "aniverse" });
});
