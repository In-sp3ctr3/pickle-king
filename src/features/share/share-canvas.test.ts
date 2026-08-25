import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BRAND_LOCKUP_ASPECT_RATIO,
  drawBrandLockup,
  requiredShareFonts,
  waitForShareFonts,
} from "./share-canvas";

afterEach(() => vi.unstubAllGlobals());

describe("share canvas fonts", () => {
  it("requires every contracted local export face", () => {
    expect(requiredShareFonts.map(({ family }) => family)).toEqual([
      "Anton",
      "Alfa Slab One",
      "Roboto Condensed",
      "Roboto Condensed",
      "Roboto Slab",
      "Manrope",
    ]);
  });

  it("fails clearly when a requested family does not produce a loaded face", async () => {
    vi.stubGlobal("document", {
      fonts: {
        check: () => true,
        load: async () => [],
      },
    });
    await expect(waitForShareFonts()).rejects.toThrow(
      "Share image fonts did not load: Anton, Alfa Slab One, Roboto Condensed, Roboto Slab, Manrope.",
    );
  });
});

describe("share brand lockup", () => {
  it("ships one transparent 640x144 source asset", () => {
    const png = readFileSync(
      new URL("../../../public/brand/pickle-king-lockup.png", import.meta.url),
    );

    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(640);
    expect(png.readUInt32BE(20)).toBe(144);
    expect(png[25]).toBe(6);
    expect(BRAND_LOCKUP_ASPECT_RATIO).toBeCloseTo(4.444444, 5);
  });

  it("preserves the fixed ratio and recolors only the wordmark slice", () => {
    const calls: number[][] = [];
    const context = {
      drawImage: (_image: HTMLImageElement, ...values: number[]) =>
        calls.push(values),
      filter: "none",
      restore() {},
      save() {},
    } as unknown as CanvasRenderingContext2D;

    drawBrandLockup(context, {} as HTMLImageElement, 540, 100, 320, "chalk");

    expect(calls).toHaveLength(2);
    expect(calls[0].slice(0, 4)).toEqual([0, 0, 144, 144]);
    expect(calls[1].slice(0, 4)).toEqual([144, 0, 496, 144]);
    expect(calls[0][7]).toBeCloseTo(320 / BRAND_LOCKUP_ASPECT_RATIO);
  });
});
