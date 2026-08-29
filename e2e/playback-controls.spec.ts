import { expect, test } from "@playwright/test";

test("player controls work with pointer and keyboard input", async ({
  page,
}) => {
  await page.goto("/watch/echoes-of-asteria/1");
  const stage = page.locator(".video-stage");
  await expect(stage).toBeVisible();
  await page.waitForTimeout(1_000);
  await stage.getByRole("button", { name: "Skip intro" }).click();
  await expect(
    page.getByRole("slider", { name: "Playback position" }),
  ).toHaveValue("90");
  await stage.getByRole("button", { name: "Play" }).first().click();
  await expect(
    stage.getByRole("button", { name: /Play|Pause/ }).first(),
  ).toBeVisible();

  const speed = page.getByRole("button", { name: "Playback speed" });
  await expect(speed).toContainText("1×");
  await speed.focus();
  await page.keyboard.press("Enter");
  await expect(speed).toContainText("1.5×");

  const captions = page.getByRole("button", { name: "Toggle captions" });
  await expect(captions).toHaveClass(/active/);
  await captions.focus();
  await page.keyboard.press("Enter");
  await expect(captions).not.toHaveClass(/active/);

  const position = page.getByRole("slider", { name: "Playback position" });
  await position.fill("30");
  await expect(position).toHaveValue("30");
});

test("adaptive options expose safe fallbacks without uploaded media", async ({
  page,
}) => {
  await page.goto("/watch/neon-ronin/1");
  await expect(
    page.getByRole("combobox", { name: "Video quality" }),
  ).toHaveValue("-1");
  await expect(
    page.getByRole("combobox", { name: "Audio track" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: "Subtitle size" }),
  ).toHaveValue("Medium");
  await expect(
    page.getByRole("checkbox", { name: "Autoplay next" }),
  ).toBeChecked();
});

for (const width of [390, 772, 1440]) {
  test(`skip intro remains inside the video at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 820 });
    await page.goto("/watch/echoes-of-asteria/1");

    const stage = page.locator(".video-stage");
    const skip = stage.getByRole("button", { name: "Skip intro" });
    await expect(skip).toBeVisible();
    const [stageBox, skipBox] = await Promise.all([
      stage.boundingBox(),
      skip.boundingBox(),
    ]);
    expect(stageBox).not.toBeNull();
    expect(skipBox).not.toBeNull();
    expect(skipBox!.x).toBeGreaterThanOrEqual(stageBox!.x);
    expect(skipBox!.y).toBeGreaterThanOrEqual(stageBox!.y);
    expect(skipBox!.x + skipBox!.width).toBeLessThanOrEqual(
      stageBox!.x + stageBox!.width,
    );
    expect(skipBox!.y + skipBox!.height).toBeLessThanOrEqual(
      stageBox!.y + stageBox!.height,
    );

  });
}
