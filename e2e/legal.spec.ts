import { expect, test } from "@playwright/test";

test("legal center exposes all operational policies", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Terms of Service",
  );
  await page.getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("link", { name: "Copyright" })).toBeVisible();
  await page.goto("/copyright");
  await expect(page.getByRole("link", { name: "Submit a DMCA notice" })).toBeVisible();
});

test("DMCA form requires legal declarations", async ({ page }) => {
  await page.goto("/takedown");
  await expect(page.getByLabel("Full legal name")).toBeVisible();
  await expect(
    page.getByText(/good-faith belief that the disputed use/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit notice" })).toBeVisible();
});

test("signup requires versioned legal consent", async ({ page }) => {
  await page.goto("/sign-up");
  const consent = page.getByRole("checkbox", {
    name: /I agree to the Terms of Service/,
  });
  await expect(consent).toBeVisible();
  await expect(consent).toHaveAttribute("required", "");
});
