import { expect, test } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("announces the next serve and remembers mute", async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as typeof window & { __announcerClips: string[] };
    target.__announcerClips = JSON.parse(
      window.sessionStorage.getItem("announcer-clips") ?? "[]",
    ) as string[];
    class TestAudio {
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      preload = "";

      constructor(public src: string) {}

      pause() {}

      play() {
        target.__announcerClips.push(this.src.split("/").at(-1) ?? this.src);
        window.sessionStorage.setItem(
          "announcer-clips",
          JSON.stringify(target.__announcerClips),
        );
        setTimeout(() => this.onended?.(), 0);
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, "Audio", {
      configurable: true,
      value: TestAudio,
    });
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByLabel("Side A").fill("Alex");
  await page.getByLabel("Side B").fill("Blair");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='confirm-serve-setup']").click();

  const announcerClips = () =>
    page.evaluate(
      () =>
        (window as typeof window & { __announcerClips: string[] })
          .__announcerClips,
    );
  const sound = page.locator("[data-qa='score-sound-toggle']");

  await expect.poll(announcerClips).toEqual(["0.mp3", "0.mp3"]);
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-qa='score-a-add']").click();
  expect(await announcerClips()).toEqual(["0.mp3", "0.mp3"]);

  await page.reload({ waitUntil: "networkidle" });
  await expect(sound).toHaveAccessibleName("Unmute score announcements");
  await sound.click();
  await page.locator("[data-qa='score-a-add']").click();
  await expect
    .poll(announcerClips)
    .toEqual(["0.mp3", "0.mp3", "2.mp3", "0.mp3"]);
});
