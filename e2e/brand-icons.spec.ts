import { expect, test } from "@playwright/test";

test("serves the AniVerse browser, Apple, and installable app icons", async ({ page, request }) => {
  await page.goto("/en");
  await expect(page.locator('link[rel="icon"][href*="icon.svg"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

  const manifestResponse=await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest=await manifestResponse.json();
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src:"/icons/aniverse-192.png",sizes:"192x192" }),
    expect.objectContaining({ src:"/icons/aniverse-512.png",sizes:"512x512" }),
    expect.objectContaining({ src:"/icons/aniverse-maskable-512.png",purpose:"maskable" }),
  ]));

  for(const path of ["/favicon.ico","/icon.svg","/apple-icon.png","/icons/aniverse-192.png","/icons/aniverse-512.png","/icons/aniverse-maskable-512.png"]){
    const response=await request.get(path);
    expect(response.ok(),`${path} should be served`).toBe(true);
  }
});
