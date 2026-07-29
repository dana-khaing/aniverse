import { expect, test } from "@playwright/test";

test("Google sign-up requires legal acknowledgement", async ({ page }) => {
  await page.goto("/sign-up");
  const google = page.getByRole("button", { name: "Continue with Google" });
  await expect(google).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(google).toBeEnabled();
  await expect(page.getByRole("link", { name: "Terms of Service" })).toHaveAttribute(
    "href",
    "/terms",
  );
});

test("account exposes append-only legal consent history", async ({ page }) => {
  await page.goto("/account");
  const history = page.locator(".consent-history");
  await expect(history.getByText("Legal consent history")).toBeVisible();
  await expect(history.getByText("terms", { exact: true })).toBeVisible();
  await expect(history.getByText("privacy", { exact: true })).toBeVisible();
  await expect(history.getByText("Granted").first()).toBeVisible();
});
