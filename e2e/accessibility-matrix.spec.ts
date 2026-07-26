import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/browse", "/schedule", "/ja", "/ja/browse"];

for (const route of publicRoutes) {
  test(`${route} has a named landmark, heading, and responsive viewport`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}

test("interactive discovery controls retain visible keyboard focus", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name.includes("mobile"),
    "Mobile emulation does not provide hardware Tab focus",
  );
  await page.goto("/browse");
  const search = page.getByRole("textbox", {
    name: /Search titles|Search anime/,
  });
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Genre" })).toBeFocused();
});

test("reduced-motion users can operate localized navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ja/browse");
  const englishLink = page.getByRole("link", { name: "EN", exact: true });
  await expect(englishLink).toBeVisible();
  await expect(async () => {
    if (!page.url().endsWith("/en/browse")) await englishLink.click();
    await expect(page).toHaveURL(/\/en\/browse$/);
  }).toPass({ timeout: 10_000 });
  await expect(
    page.getByRole("heading", { name: "Browse anime" }),
  ).toBeVisible();
});
