import { expect, test, type Page } from "@playwright/test";

async function mockSearch(page: Page) {
  await page.route("**/api/v1/search?**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ slug:"neon-ronin",name:"Neon Ronin",nativeName:"ネオン浪人",studio:"Voltage Frame",tone:"cyan" }],
        discovery: [{ id:"1555",title:"Naruto: Shippuden",nativeTitle:"ナルト 疾風伝",subtype:"TV",posterImage:null }],
        meta: { query:"neon", discoveryAvailable:true },
      }),
    }),
  );
}

test("desktop navbar exposes mixed text search", async ({ page }) => {
  await page.setViewportSize({ width:1440, height:820 });
  await mockSearch(page);
  await page.goto("/en/browse");
  const search=page.getByRole("combobox", { name:"Search anime" });
  await expect(search).toBeVisible();
  await search.fill("neon");
  const options=page.locator(".header-search-results").getByRole("option");
  await expect(options).toHaveCount(2);
  await expect(options.first()).toContainText("Watch on AniVerse");
  await expect(options.last()).toContainText("Discover via Kitsu");
});

for (const width of [390, 772]) {
  test(`narrow search expands without overflowing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height:820 });
    await mockSearch(page);
    await page.goto("/en/browse");
    const trigger = width <= 700
      ? page.locator(".mobile-dock .dock-search")
      : page.locator(".header-search-toggle");
    await trigger.click();
    const search=page.getByRole("combobox", { name:"Search anime" });
    await expect(search).toBeVisible();
    await expect(search).toBeFocused();
    await search.fill("neon");
    await expect(page.locator(".header-search-results").getByRole("option")).toHaveCount(2);
    const dimensions=await page.evaluate(()=>({ viewport:document.documentElement.clientWidth, content:document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport+1);
    await search.press("Escape");
    await expect(trigger).toBeFocused();
  });
}
