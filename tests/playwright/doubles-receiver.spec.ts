import { expect, test } from "@playwright/test";

const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://127.0.0.1:3000";

test("shows the doubles receiver and legal receiving position", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Quick match" }).click();
  await page.getByRole("button", { name: "Doubles" }).click();
  await page.getByLabel("Team A · Player 1").fill("Alex");
  await page.getByLabel("Team A · Player 2").fill("Bea");
  await page.getByLabel("Team B · Player 1").fill("Casey");
  await page.getByLabel("Team B · Player 2").fill("Drew");
  await page.getByRole("button", { name: "Open scorer" }).click();
  await page.getByRole("button", { name: "Start match", exact: true }).click();
  await page.locator("[data-qa='confirm-serve-setup']").click();

  const guide = page.locator("[data-qa='serve-guide']");
  const court = guide.getByRole("img");
  const server = guide.locator(".serve-court__player-marker--server");
  const receiver = guide.locator(".serve-court__player-marker--receiver");
  await expect(guide).toContainText("Alex is serving");
  await expect(guide).toContainText("Casey is receiving");
  await expect(receiver).toHaveClass(/serve-court__player-marker--near-right/);
  await expect(court).toHaveAttribute(
    "aria-label",
    /Casey receives from the right service box on the right end/,
  );
  expect(
    await receiver.evaluate((element) => ({
      head: getComputedStyle(
        element.querySelector<HTMLElement>(".serve-court__player-head")!,
      ).backgroundColor,
      torso: getComputedStyle(
        element.querySelector<HTMLElement>(".serve-court__player-torso")!,
      ).backgroundColor,
    })),
  ).toEqual({ head: "rgb(245, 243, 233)", torso: "rgb(245, 243, 233)" });
  await expect(server.locator(".serve-court__player-head")).toHaveCSS(
    "background-color",
    "rgb(200, 255, 61)",
  );

  await page.locator("[data-qa='score-a-add']").click();
  await expect(guide).toContainText("Drew is receiving");
  await expect(receiver).toHaveClass(/serve-court__player-marker--near-left/);
  await expect(court).toHaveAttribute(
    "aria-label",
    /Drew receives from the left service box on the right end/,
  );
  expect(
    await court.evaluate((element) => {
      const surface = element
        .querySelector<HTMLElement>(".serve-court__surface")!
        .getBoundingClientRect();
      const serverMarker = element
        .querySelector<HTMLElement>(".serve-court__player-marker--server")!
        .getBoundingClientRect();
      const receiverMarker = element
        .querySelector<HTMLElement>(".serve-court__player-marker--receiver")!
        .getBoundingClientRect();
      return {
        diagonal:
          Math.abs(
            serverMarker.top +
              serverMarker.height / 2 -
              (receiverMarker.top + receiverMarker.height / 2),
          ) >=
          surface.height * 0.4,
        receiverOutside: receiverMarker.left >= surface.right + 1,
        serverOutside: serverMarker.right <= surface.left - 1,
      };
    }),
  ).toEqual({ diagonal: true, receiverOutside: true, serverOutside: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/frontend-captures/doubles-receiver-mobile.png",
  });

  await page.setViewportSize({ width: 320, height: 768 });
  await expect(guide).toContainText("Drew is receiving");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight,
    ),
  ).toBe(true);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({
    path: "test-results/frontend-captures/doubles-receiver-landscape.png",
  });
  const gaps = await page.locator(".score-side").evaluateAll((sides) =>
    sides.map((side) => {
      const bounds = (selector: string) =>
        side.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      const name = bounds(".score-player");
      const hint = bounds(".score-hint");
      const score = bounds(".score-number");
      const controls = bounds(".score-stepper");
      return {
        hintToScore: score.top - hint.bottom,
        nameToHint: hint.top - name.bottom,
        scoreToControls: controls.top - score.bottom,
      };
    }),
  );
  expect(
    gaps.every(
      (gap) =>
        gap.nameToHint >= 0 && gap.hintToScore >= 0 && gap.scoreToControls >= 0,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= window.innerHeight &&
        document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
