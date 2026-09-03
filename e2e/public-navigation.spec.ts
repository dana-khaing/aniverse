import { expect, test } from "@playwright/test";

test("desktop navigation opens localized charts and community", async ({page})=>{
  await page.setViewportSize({width:1440,height:820});
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link",{name:"Charts",exact:true}).click();
  await expect(page).toHaveURL(/\/en\/charts\/seasonal$/);
  await expect(page.getByRole("heading",{name:"Seasonal charts"})).toBeVisible();
  await page.getByRole("link",{name:"Community",exact:true}).click();
  await expect(page).toHaveURL(/\/en\/community$/);
  await expect(page.getByRole("heading",{name:"Stories are better together"})).toBeVisible();
});

for(const width of [390,772,1024]){
  test(`secondary navigation remains reachable at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:820});
    await page.goto("/ja", { waitUntil: "networkidle" });
    const more=width<=700?page.locator(".mobile-dock .dock-more>button"):page.locator(".catalog-primary-nav .more-menu>button");
    await expect(more).toBeVisible();
    await more.click();
    const menu=page.getByRole("menu");
    await expect(menu.getByRole("menuitem",{name:/ランキング/})).toBeVisible();
    await expect(menu.getByRole("menuitem",{name:/コミュニティ/})).toHaveAttribute("href","/ja/community");
    await expect(menu.getByRole("menuitem",{name:/クリエイター/})).toHaveAttribute("href","/ja/creators");
  });
}

test("creator spotlight opens the public directory and studio profile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 820 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Explore creators" }).click();
  await expect(page).toHaveURL(/\/en\/creators$/);
  await expect(page.getByRole("heading", { name: "Explore creators" })).toBeVisible();
  await page.getByRole("link", { name: /Lumen Works/ }).click();
  await expect(page).toHaveURL(/\/en\/studios\/Lumen%20Works$/);
  await expect(page.getByRole("heading", { name: "Lumen Works" })).toBeVisible();
});
