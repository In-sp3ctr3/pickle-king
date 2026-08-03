import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  findUnlistedControls,
  observeMotion,
  performAction,
  verifyCanvas,
} from "./frontend-harness-audits";
import {
  openRoute,
  routeMap,
  safeRenderPath,
  type Control,
} from "./frontend-harness-support";

async function installDeterministicBrowserState(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    Object.defineProperty(window.crypto, "randomUUID", {
      configurable: true,
      value: () => "11111111-1111-4111-8111-111111111111",
    });
  });
}

for (const viewport of routeMap.viewports) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routeMap.routes) {
      test(`${route.name}: route, controls, console, focus, axe, and screenshot`, async ({
        page,
      }) => {
        await installDeterministicBrowserState(page);
        const consoleErrors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => consoleErrors.push(error.message));

        const response = await openRoute(page, route);
        expect(response?.ok()).toBe(true);
        await page.evaluate(() => document.fonts.ready);
        expect(
          (await page.locator("body").innerText()).trim().length,
        ).toBeGreaterThan(0);
        if (route.primaryActionSelector) {
          const primaryAction = page.locator(route.primaryActionSelector);
          expect(await primaryAction.count()).toBe(1);
          await expect(primaryAction).toBeVisible();
        }
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );

        const applicableControls = route.controls.filter(
          (control) =>
            !control.viewports || control.viewports.includes(viewport.name),
        );
        for (const check of route.motionChecks ?? []) {
          await observeMotion(
            page,
            route,
            check,
            applicableControls,
            viewport.name,
          );
        }
        expect(await findUnlistedControls(page, applicableControls)).toEqual(
          [],
        );

        const sequences = new Map<string, Control[]>();
        for (const control of applicableControls) {
          if (control.auditOnly) continue;
          const key = control.sequence ?? `independent:${control.name}`;
          sequences.set(key, [...(sequences.get(key) ?? []), control]);
        }

        for (const controls of sequences.values()) {
          const sequenceResponse = await openRoute(page, route);
          expect(sequenceResponse?.ok()).toBe(true);
          for (const control of controls) {
            const locator = page.locator(control.selector);
            expect(
              await locator.count(),
              `${control.name} must map one element`,
            ).toBe(1);
            await expect(locator, control.name).toBeVisible();
            const isInteractive = await locator.evaluate((element) => {
              const tag = element.tagName.toLowerCase();
              return (
                [
                  "a",
                  "button",
                  "input",
                  "select",
                  "summary",
                  "textarea",
                ].includes(tag) ||
                element.getAttribute("role") === "button" ||
                element.hasAttribute("tabindex")
              );
            });
            expect(
              isInteractive,
              `${control.name} must map an interactive element`,
            ).toBe(true);

            const beforeUrl = page.url();
            await performAction(page, control);
            if (control.expect.url) {
              await expect(page).toHaveURL(new RegExp(control.expect.url));
            }
            if (control.expect.visible) {
              await expect(page.locator(control.expect.visible)).toBeVisible();
            }
            if (control.expect.text) {
              await expect(
                page.locator(control.expect.text.selector),
              ).toContainText(control.expect.text.value);
            }
            expect(
              (await new AxeBuilder({ page }).analyze()).violations,
            ).toEqual([]);
            if (page.url() === beforeUrl) {
              expect(
                await findUnlistedControls(page, applicableControls),
              ).toEqual([]);
            }
          }
        }

        for (const check of route.canvasChecks ?? []) {
          await verifyCanvas(page, route, check);
        }
        const focusable = page.locator(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if ((await focusable.count()) > 0) {
          const focusResponse = await openRoute(page, route);
          expect(focusResponse?.ok()).toBe(true);
          const initiallyFocused = await page.evaluate(
            () => document.activeElement?.tagName ?? "",
          );
          if (initiallyFocused === "BODY") await page.keyboard.press("Tab");
          expect(
            await page.evaluate(() => document.activeElement?.tagName ?? ""),
          ).not.toBe("BODY");
        }

        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
        expect(consoleErrors).toEqual([]);
        await page.evaluate(() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          document.documentElement.dataset.visualFreeze = "true";
        });
        await page.screenshot({
          path: safeRenderPath(route.visualEvidence[viewport.name].render),
          fullPage: true,
          animations: "disabled",
        });
      });
    }
  });
}

test.describe("reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const route of routeMap.routes) {
    test(`${route.name}: remains usable with reduced motion`, async ({
      page,
    }) => {
      await installDeterministicBrowserState(page);
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      const response = await openRoute(page, route);
      expect(response?.ok()).toBe(true);
      await expect(page.locator("body")).toBeVisible();
      for (const check of route.reducedMotionChecks ?? []) {
        const locator = page.locator(check.selector);
        if (check.expect === "visible") {
          await expect(locator, check.name).toBeVisible();
        } else {
          await expect(locator, check.name).toBeHidden();
        }
      }
      for (const check of route.motionChecks ?? []) {
        await expect(page.locator(check.selector)).toHaveAttribute(
          check.stateAttribute,
          check.reducedMotionState,
        );
      }
      for (const check of route.canvasChecks ?? []) {
        await expect(page.locator(check.fallbackSelector)).toBeVisible();
        await expect(page.locator(check.semanticSelector)).toBeVisible();
        await expect(page.locator(check.canvasSelector)).toHaveAttribute(
          check.renderStateAttribute,
          check.reducedValue,
        );
      }
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
      ).toBe(false);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});
