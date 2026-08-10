import { expect, type Page } from "@playwright/test";
import {
  openRoute,
  type CanvasCheck,
  type Control,
  type MotionCheck,
  type Route,
} from "./frontend-harness-support";

export async function performAction(page: Page, control: Control) {
  const locator = page.locator(control.selector);
  expect(await locator.count(), `${control.name} must map one element`).toBe(1);
  await expect(locator, control.name).toBeVisible();
  if (control.action === "click") await locator.click();
  if (control.action === "fill") await locator.fill(control.value ?? "");
  if (control.action === "press") await locator.press(control.value ?? "Enter");
  if (control.action === "check") await locator.check();
  if (control.action === "select")
    await locator.selectOption(control.value ?? "");
}

export function findUnlistedControls(page: Page, controls: Control[]) {
  return page.evaluate(
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
            element.getAttribute("aria-hidden") !== "true" &&
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
    controls.map((control) => control.selector),
  );
}

export async function observeMotion(
  page: Page,
  route: Route,
  check: MotionCheck,
  controls: Control[],
  viewportName: string,
) {
  const motionResponse = await openRoute(page, route);
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
        __motionProbe?: {
          states: Set<string>;
          observer: MutationObserver;
          capture: () => void;
        };
      };
      probeWindow.__motionProbe = { states, observer, capture };
      return true;
    },
    { selector: check.selector, attribute: check.stateAttribute },
  );
  expect(probeInstalled, `${check.name} selector must exist`).toBe(true);
  if (check.triggerSequence) {
    const triggers = controls.filter(
      (control) => control.sequence === check.triggerSequence,
    );
    expect(
      triggers.length,
      `${check.name} trigger sequence must apply to ${viewportName}`,
    ).toBeGreaterThan(0);
    for (const control of triggers) await performAction(page, control);
  }
  await page.waitForTimeout(check.observationMs);
  const observedStates = await page.evaluate(() => {
    const probeWindow = window as typeof window & {
      __motionProbe?: {
        states: Set<string>;
        observer: MutationObserver;
        capture: () => void;
      };
    };
    const probe = probeWindow.__motionProbe;
    if (!probe) return [];
    probe.capture();
    probe.observer.disconnect();
    delete probeWindow.__motionProbe;
    return [...probe.states];
  });
  for (const state of check.requiredStates) {
    expect(observedStates, `${check.name} must expose ${state}`).toContain(
      state,
    );
  }
}

export async function verifyCanvas(
  page: Page,
  route: Route,
  check: CanvasCheck,
) {
  const canvasResponse = await openRoute(page, route);
  expect(canvasResponse?.ok()).toBe(true);
  const canvas = page.locator(check.canvasSelector);
  const semantic = page.locator(check.semanticSelector);
  const fallback = page.locator(check.fallbackSelector);
  await expect(canvas, check.name).toBeVisible();
  expect(await semantic.count()).toBe(1);
  expect(await fallback.count()).toBe(1);
  await expect(semantic).toBeVisible();
  await expect(fallback).toBeHidden();
  const validSupport = await page.evaluate(
    ({ semanticSelector, fallbackSelector }) => {
      const semanticElement = document.querySelector(semanticSelector);
      const fallbackElement = document.querySelector(fallbackSelector);
      const semanticText = [
        semanticElement?.textContent,
        semanticElement?.getAttribute("aria-label"),
        semanticElement?.getAttribute("alt"),
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      return {
        semanticIsNonCanvas: Boolean(
          semanticElement && !(semanticElement instanceof HTMLCanvasElement),
        ),
        fallbackIsNonCanvas: Boolean(
          fallbackElement && !(fallbackElement instanceof HTMLCanvasElement),
        ),
        semanticHasContent: semanticText.length > 0,
      };
    },
    {
      semanticSelector: check.semanticSelector,
      fallbackSelector: check.fallbackSelector,
    },
  );
  expect(validSupport.semanticIsNonCanvas).toBe(true);
  expect(validSupport.fallbackIsNonCanvas).toBe(true);
  expect(validSupport.semanticHasContent).toBe(true);
  const hasWebglContext = await canvas.evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) return false;
    return Boolean(element.getContext("webgl2") ?? element.getContext("webgl"));
  });
  expect(hasWebglContext, `${check.name} requires a real WebGL context`).toBe(
    true,
  );
  await expect(canvas).toHaveAttribute(
    check.renderStateAttribute,
    check.activeValue,
  );
  const dpr = Number(await canvas.getAttribute(check.dprAttribute));
  expect(Number.isFinite(dpr)).toBe(true);
  expect(dpr).toBeGreaterThan(0);
  expect(dpr).toBeLessThanOrEqual(check.maxDpr);

  await canvas.evaluate((element) => {
    element.scrollIntoView({ block: "start" });
    window.scrollBy(0, window.innerHeight * 2);
  });
  await expect(canvas).toHaveAttribute(
    check.renderStateAttribute,
    check.pausedValue,
  );
  await canvas.evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  await expect(canvas).toHaveAttribute(
    check.renderStateAttribute,
    check.activeValue,
  );
  const contextLossTriggered = await canvas.evaluate((element) => {
    if (!(element instanceof HTMLCanvasElement)) return false;
    const context = element.getContext("webgl2") ?? element.getContext("webgl");
    const extension = context?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  expect(
    contextLossTriggered,
    `${check.name} must support context-loss QA`,
  ).toBe(true);
  await expect(canvas).toHaveAttribute(
    check.renderStateAttribute,
    check.fallbackValue,
  );
  await expect(fallback).toBeVisible();
}
