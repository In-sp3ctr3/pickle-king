import { expect, test } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("announces the next serve and remembers mute", async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as typeof window & { __spokenScores: string[] };
    target.__spokenScores = JSON.parse(
      window.sessionStorage.getItem("spoken-scores") ?? "[]",
    ) as string[];
    class TestUtterance {
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: TestUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        speak(utterance: TestUtterance) {
          target.__spokenScores.push(utterance.text);
          window.sessionStorage.setItem(
            "spoken-scores",
            JSON.stringify(target.__spokenScores),
          );
        },
      },
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

  const spokenScores = () =>
    page.evaluate(
      () =>
        (window as typeof window & { __spokenScores: string[] }).__spokenScores,
    );
  const sound = page.locator("[data-qa='score-sound-toggle']");

  await expect.poll(spokenScores).toEqual(["0, 0"]);
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-qa='score-a-add']").click();
  expect(await spokenScores()).toEqual(["0, 0"]);

  await page.reload({ waitUntil: "networkidle" });
  await expect(sound).toHaveAccessibleName("Unmute score announcements");
  await sound.click();
  await page.locator("[data-qa='score-a-add']").click();
  await expect.poll(spokenScores).toEqual(["0, 0", "2, 0"]);
});
