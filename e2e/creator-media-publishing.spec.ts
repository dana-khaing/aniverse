import { expect, test } from "@playwright/test";

test("creator publishing media controls stay connected", async ({ page }) => {
  await page.goto("/creator");
  const console = page.locator(".creator-media-console");
  await expect(console.getByRole("heading", { name: "Title presentation console" })).toBeVisible();
  for (const label of ["Artwork", "Trailers", "Translations", "Audio tracks"])
    await expect(console.getByText(label, { exact: true })).toBeVisible();
  await console.getByRole("link", { name: /Artwork/ }).click();
  await expect(page.locator("#artwork")).toBeInViewport();
  await expect(page.getByRole("heading", { name: "Artwork and trailers" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Episode audio tracks" })).toBeVisible();
});
