import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

type ExpectedOutcome = {
  url?: string;
  visible?: string;
  text?: { selector: string; value: string };
};

type Control = {
  name: string;
  selector: string;
  viewports?: string[];
  sequence?: string;
  action: "click" | "fill" | "press" | "check";
  value?: string;
  expect: ExpectedOutcome;
};

type Route = {
  name: string;
  path: string;
  primaryActionSelector?: string;
  primaryActionNotApplicableReason?: string;
  visualEvidence: Record<
    string,
    { source: string; render: string; comparison: string }
  >;
  controls: Control[];
  motionChecks?: Array<{
    name: string;
    selector: string;
    stateAttribute: string;
    requiredStates: string[];
    reducedMotionState: string;
    observationMs: number;
    triggerSequence?: string;
  }>;
  reducedMotionChecks?: Array<{
    name: string;
    selector: string;
    expect: "visible" | "hidden";
  }>;
  canvasChecks?: Array<{
    name: string;
    canvasSelector: string;
    semanticSelector: string;
    fallbackSelector: string;
    renderStateAttribute: string;
    activeValue: string;
    pausedValue: string;
    reducedValue: string;
    fallbackValue: string;
    dprAttribute: string;
    maxDpr: number;
  }>;
};

type RouteMap = {
  baseUrl?: string;
  viewports: Array<{ name: string; width: number; height: number }>;
  routes: Route[];
};

const routeMap = JSON.parse(
  readFileSync(path.resolve("docs/frontend/route-map.json"), "utf8"),
) as RouteMap;
const baseUrl =
  process.env.FRONTEND_BASE_URL ?? routeMap.baseUrl ?? "http://127.0.0.1:3000";
const repositoryRoot = realpathSync(process.cwd());

function safeRenderPath(relativePath: string) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`Render path must be repository-relative: ${relativePath}`);
  }
  const resolved = path.resolve(repositoryRoot, relativePath);
  const allowed = path.resolve(
    repositoryRoot,
    "test-results/frontend-captures",
  );
  if (!resolved.startsWith(`${allowed}${path.sep}`)) {
    throw new Error(
      `Render path must stay under test-results/frontend-captures: ${relativePath}`,
    );
  }
  let current = repositoryRoot;
  for (const segment of path
    .relative(repositoryRoot, resolved)
    .split(path.sep)) {
    current = path.join(current, segment);
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) {
      throw new Error(`Render path traverses a symbolic link: ${relativePath}`);
    }
  }
  return resolved;
}

for (const viewport of routeMap.viewports) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routeMap.routes) {
      test(`${route.name}: route, controls, console, focus, axe, and screenshot`, async ({
        page,
      }) => {
        const consoleErrors: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => consoleErrors.push(error.message));

        const response = await page.goto(
          new URL(route.path, baseUrl).toString(),
          {
            waitUntil: "networkidle",
          },
        );
        expect(response?.ok()).toBe(true);
        await page.evaluate(() => document.fonts.ready);
        const bodyText = await page.locator("body").innerText();
        expect(bodyText.trim().length).toBeGreaterThan(0);
        if (route.primaryActionSelector) {
          const primaryAction = page.locator(route.primaryActionSelector);
          expect(await primaryAction.count()).toBe(1);
          await expect(primaryAction).toBeVisible();
        }

        const initialAxe = await new AxeBuilder({ page }).analyze();
        expect(initialAxe.violations).toEqual([]);

        const applicableControls = route.controls.filter(
          (control) =>
            !control.viewports || control.viewports.includes(viewport.name),
        );
        const performAction = async (control: Control) => {
          const locator = page.locator(control.selector);
          expect(
            await locator.count(),
            `${control.name} must map one element`,
          ).toBe(1);
          await expect(locator, control.name).toBeVisible();
          if (control.action === "click") await locator.click();
          if (control.action === "fill")
            await locator.fill(control.value ?? "");
          if (control.action === "press")
            await locator.press(control.value ?? "Enter");
          if (control.action === "check") await locator.check();
        };

        for (const motionCheck of route.motionChecks ?? []) {
          const motionResponse = await page.goto(
            new URL(route.path, baseUrl).toString(),
            {
              waitUntil: "networkidle",
            },
          );
          expect(motionResponse?.ok()).toBe(true);
          const probeInstalled = await page.evaluate(
            ({ selector, attribute }) => {
              const element = document.querySelector(selector);
              if (!element) return false;
              const states = new Set<string>();
              const capture = () => {
                const value = element.getAttribute(attribute);
                if (value) states.add(value);
              };
              capture();
              const observer = new MutationObserver(capture);
              observer.observe(element, {
                attributes: true,
                attributeFilter: [attribute],
              });
              const probeWindow = window as typeof window & {
                __codexMotionProbe?: {
                  states: Set<string>;
                  observer: MutationObserver;
                  capture: () => void;
                };
              };
              probeWindow.__codexMotionProbe = { states, observer, capture };
              return true;
            },
            {
              selector: motionCheck.selector,
              attribute: motionCheck.stateAttribute,
            },
          );
          expect(
            probeInstalled,
            `${motionCheck.name} selector must exist`,
          ).toBe(true);
          if (motionCheck.triggerSequence) {
            const triggerControls = applicableControls.filter(
              (control) => control.sequence === motionCheck.triggerSequence,
            );
            expect(
              triggerControls.length,
              `${motionCheck.name} trigger sequence must apply to ${viewport.name}`,
            ).toBeGreaterThan(0);
            for (const control of triggerControls) await performAction(control);
          }
          await page.waitForTimeout(motionCheck.observationMs);
          const observedStates = await page.evaluate(() => {
            const probeWindow = window as typeof window & {
              __codexMotionProbe?: {
                states: Set<string>;
                observer: MutationObserver;
                capture: () => void;
              };
            };
            const probe = probeWindow.__codexMotionProbe;
            if (!probe) return [];
            probe.capture();
            probe.observer.disconnect();
            delete probeWindow.__codexMotionProbe;
            return [...probe.states];
          });
          for (const state of motionCheck.requiredStates) {
            expect(
              observedStates,
              `${motionCheck.name} must expose ${state}`,
            ).toContain(state);
          }
        }

        const findUnlistedControls = () =>
          page.evaluate(
            (selectors) => {
              const interactive = [
                ...document.querySelectorAll(
                  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"], [tabindex]:not([tabindex="-1"])',
                ),
              ];
              return interactive
                .filter((element) => {
                  const style = window.getComputedStyle(element);
                  const visible =
                    style.display !== "none" &&
                    style.visibility !== "hidden" &&
                    element.getBoundingClientRect().width > 0 &&
                    element.getBoundingClientRect().height > 0;
                  if (!visible) return false;
                  return !selectors.some((selector) => {
                    try {
                      return element.matches(selector);
                    } catch {
                      return false;
                    }
                  });
                })
                .map((element) => ({
                  tag: element.tagName.toLowerCase(),
                  text: element.textContent?.trim().slice(0, 80) ?? "",
                  ariaLabel: element.getAttribute("aria-label") ?? "",
                }));
            },
            applicableControls.map((control) => control.selector),
          );

        expect(await findUnlistedControls()).toEqual([]);

        const sequences = new Map<string, Control[]>();
        for (const control of applicableControls) {
          const key = control.sequence ?? `independent:${control.name}`;
          sequences.set(key, [...(sequences.get(key) ?? []), control]);
        }

        for (const controls of sequences.values()) {
          const sequenceResponse = await page.goto(
            new URL(route.path, baseUrl).toString(),
            {
              waitUntil: "networkidle",
            },
          );
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
                ["a", "button", "input", "select", "textarea"].includes(tag) ||
                element.getAttribute("role") === "button" ||
                element.hasAttribute("tabindex")
              );
            });
            expect(
              isInteractive,
              `${control.name} must map an interactive element`,
            ).toBe(true);

            const beforeUrl = page.url();
            await performAction(control);

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
            const stateAxe = await new AxeBuilder({ page }).analyze();
            expect(stateAxe.violations).toEqual([]);
            if (page.url() === beforeUrl) {
              expect(await findUnlistedControls()).toEqual([]);
            }
          }
        }

        for (const canvasCheck of route.canvasChecks ?? []) {
          const canvasResponse = await page.goto(
            new URL(route.path, baseUrl).toString(),
            {
              waitUntil: "networkidle",
            },
          );
          expect(canvasResponse?.ok()).toBe(true);
          const canvas = page.locator(canvasCheck.canvasSelector);
          const semantic = page.locator(canvasCheck.semanticSelector);
          const fallback = page.locator(canvasCheck.fallbackSelector);
          await expect(canvas, canvasCheck.name).toBeVisible();
          expect(await semantic.count()).toBe(1);
          expect(await fallback.count()).toBe(1);
          await expect(semantic).toBeVisible();
          await expect(fallback).toBeHidden();
          const supportingElementsAreValid = await page.evaluate(
            ({ semanticSelector, fallbackSelector }) => {
              const semantic = document.querySelector(semanticSelector);
              const fallback = document.querySelector(fallbackSelector);
              const semanticText = [
                semantic?.textContent,
                semantic?.getAttribute("aria-label"),
                semantic?.getAttribute("alt"),
              ]
                .filter(Boolean)
                .join(" ")
                .trim();
              return {
                semanticIsNonCanvas: Boolean(
                  semantic && !(semantic instanceof HTMLCanvasElement),
                ),
                fallbackIsNonCanvas: Boolean(
                  fallback && !(fallback instanceof HTMLCanvasElement),
                ),
                semanticHasContent: semanticText.length > 0,
              };
            },
            {
              semanticSelector: canvasCheck.semanticSelector,
              fallbackSelector: canvasCheck.fallbackSelector,
            },
          );
          expect(supportingElementsAreValid.semanticIsNonCanvas).toBe(true);
          expect(supportingElementsAreValid.fallbackIsNonCanvas).toBe(true);
          expect(supportingElementsAreValid.semanticHasContent).toBe(true);
          const hasWebglContext = await canvas.evaluate((element) => {
            if (!(element instanceof HTMLCanvasElement)) return false;
            return Boolean(
              element.getContext("webgl2") ?? element.getContext("webgl"),
            );
          });
          expect(
            hasWebglContext,
            `${canvasCheck.name} requires a real WebGL context`,
          ).toBe(true);
          await expect(canvas).toHaveAttribute(
            canvasCheck.renderStateAttribute,
            canvasCheck.activeValue,
          );
          const dpr = Number(
            await canvas.getAttribute(canvasCheck.dprAttribute),
          );
          expect(Number.isFinite(dpr)).toBe(true);
          expect(dpr).toBeGreaterThan(0);
          expect(dpr).toBeLessThanOrEqual(canvasCheck.maxDpr);

          await canvas.evaluate((element) => {
            element.scrollIntoView({ block: "start" });
            window.scrollBy(0, window.innerHeight * 2);
          });
          await expect(canvas).toHaveAttribute(
            canvasCheck.renderStateAttribute,
            canvasCheck.pausedValue,
          );
          await canvas.evaluate((element) =>
            element.scrollIntoView({ block: "center" }),
          );
          await expect(canvas).toHaveAttribute(
            canvasCheck.renderStateAttribute,
            canvasCheck.activeValue,
          );

          const contextLossTriggered = await canvas.evaluate((element) => {
            if (!(element instanceof HTMLCanvasElement)) return false;
            const context =
              element.getContext("webgl2") ?? element.getContext("webgl");
            const extension = context?.getExtension("WEBGL_lose_context");
            if (!extension) return false;
            extension.loseContext();
            return true;
          });
          expect(
            contextLossTriggered,
            `${canvasCheck.name} must support context-loss QA`,
          ).toBe(true);
          await expect(canvas).toHaveAttribute(
            canvasCheck.renderStateAttribute,
            canvasCheck.fallbackValue,
          );
          await expect(fallback).toBeVisible();
        }

        const focusable = page.locator(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if ((await focusable.count()) > 0) {
          const focusResponse = await page.goto(
            new URL(route.path, baseUrl).toString(),
            {
              waitUntil: "networkidle",
            },
          );
          expect(focusResponse?.ok()).toBe(true);
          await page.keyboard.press("Tab");
          const focused = await page.evaluate(
            () => document.activeElement?.tagName ?? "",
          );
          expect(focused).not.toBe("BODY");
        }

        const axe = await new AxeBuilder({ page }).analyze();
        expect(axe.violations).toEqual([]);
        expect(consoleErrors).toEqual([]);

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
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      const response = await page.goto(
        new URL(route.path, baseUrl).toString(),
        {
          waitUntil: "networkidle",
        },
      );
      expect(response?.ok()).toBe(true);
      await expect(page.locator("body")).toBeVisible();
      for (const check of route.reducedMotionChecks ?? []) {
        const locator = page.locator(check.selector);
        if (check.expect === "visible")
          await expect(locator, check.name).toBeVisible();
        if (check.expect === "hidden")
          await expect(locator, check.name).toBeHidden();
      }
      for (const motionCheck of route.motionChecks ?? []) {
        await expect(page.locator(motionCheck.selector)).toHaveAttribute(
          motionCheck.stateAttribute,
          motionCheck.reducedMotionState,
        );
      }
      for (const canvasCheck of route.canvasChecks ?? []) {
        await expect(page.locator(canvasCheck.fallbackSelector)).toBeVisible();
        await expect(page.locator(canvasCheck.semanticSelector)).toBeVisible();
        await expect(page.locator(canvasCheck.canvasSelector)).toHaveAttribute(
          canvasCheck.renderStateAttribute,
          canvasCheck.reducedValue,
        );
      }
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});
