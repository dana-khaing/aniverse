import { expect, test } from "@playwright/test";

const snapshot = (watchlist: string[]) => ({
  progress: [],
  favorites: [],
  watchlist,
  lists: [],
});

test("separate users keep isolated libraries while same-user tabs synchronize", async ({
  browser,
}) => {
  const firstUser = await browser.newContext();
  const secondUser = await browser.newContext();
  await firstUser.addInitScript(
    (state) => {
      localStorage.setItem("aniverse.library", JSON.stringify(state));
    },
    snapshot(["echoes-of-asteria"]),
  );
  await secondUser.addInitScript(
    (state) => {
      localStorage.setItem("aniverse.library", JSON.stringify(state));
    },
    snapshot(["neon-ronin"]),
  );

  const firstTab = await firstUser.newPage();
  const synchronizedTab = await firstUser.newPage();
  const secondTab = await secondUser.newPage();
  await Promise.all([
    firstTab.goto("/library"),
    synchronizedTab.goto("/library"),
    secondTab.goto("/library"),
  ]);

  await expect(firstTab.locator("#watchlist")).toContainText(
    "Echoes of Asteria",
  );
  await expect(secondTab.locator("#watchlist")).toContainText("Neon Ronin");
  await expect(secondTab.locator("#watchlist")).not.toContainText(
    "Echoes of Asteria",
  );

  await firstTab
    .getByRole("button", { name: "Remove Echoes of Asteria from Watchlist" })
    .click();
  await expect(synchronizedTab.locator("#watchlist")).not.toContainText(
    "Echoes of Asteria",
  );
  await expect(secondTab.locator("#watchlist")).toContainText("Neon Ronin");

  await Promise.all([firstUser.close(), secondUser.close()]);
});
