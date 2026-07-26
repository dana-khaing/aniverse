import { expect, test } from "@playwright/test";

test("separate users keep isolated libraries while same-user tabs synchronize", async ({
  browser,
}) => {
  const firstUser = await browser.newContext();
  const secondUser = await browser.newContext();
  const firstTab = await firstUser.newPage();
  const synchronizedTab = await firstUser.newPage();
  const secondTab = await secondUser.newPage();
  await Promise.all([
    firstTab.goto("/anime/echoes-of-asteria"),
    synchronizedTab.goto("/library"),
    secondTab.goto("/library"),
  ]);
  await Promise.all([
    expect(firstTab.getByRole("button", { name: "Watchlist" })).toBeVisible(),
    expect(synchronizedTab.locator("#watchlist")).toBeVisible(),
    expect(secondTab.locator("#watchlist")).toBeVisible(),
  ]);
  await Promise.all([
    firstTab.waitForTimeout(1_000),
    synchronizedTab.waitForTimeout(1_000),
    secondTab.waitForTimeout(1_000),
  ]);
  await firstTab.getByRole("button", { name: "Watchlist" }).click();
  await expect(synchronizedTab.locator("#watchlist")).toContainText(
    "Echoes of Asteria",
  );
  await expect(secondTab.locator("#watchlist")).toContainText("Neon Ronin");
  await expect(secondTab.locator("#watchlist")).not.toContainText(
    "Echoes of Asteria",
  );

  await synchronizedTab
    .getByRole("button", { name: "Remove Echoes of Asteria from Watchlist" })
    .click();
  await expect(synchronizedTab.locator("#watchlist")).not.toContainText(
    "Echoes of Asteria",
  );
  await expect(secondTab.locator("#watchlist")).toContainText("Neon Ronin");

  await Promise.all([firstUser.close(), secondUser.close()]);
});
