import { expect, test } from "@playwright/test";

test("company and help routes are complete", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Stories beyond");
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "Answers without the wait." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contact support" }).first()).toBeVisible();
});

test("status and support surfaces expose their primary workflows", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByText(/All systems operational|Some systems need attention/)).toBeVisible();
  await page.goto("/support");
  await expect(page.getByRole("heading", { name: "How can we help?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create support request" })).toBeDisabled();
});
