import { expect, test } from "@playwright/test";

test("administrator sees the auditable DMCA review workflow", async ({ page }) => {
  await page.goto("/admin");
  const queue = page.locator(".dmca-operations");
  await expect(queue.getByRole("heading", { name: "DMCA review queue" })).toBeVisible();
  await expect(queue.getByText("Northstar Rights")).toBeVisible();
  await expect(queue.getByRole("button", { name: "Start review" })).toBeVisible();
  await expect(queue.getByRole("button", { name: "Execute takedown" })).toBeVisible();
});

test("creator counter-notice center explains its configured state", async ({ page }) => {
  await page.goto("/creator/dmca");
  await expect(page.getByRole("heading", { name: "Copyright response center" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Counter-notice center ready" })).toBeVisible();
});
