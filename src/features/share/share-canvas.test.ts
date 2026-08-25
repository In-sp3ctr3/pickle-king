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
  it("ships matching ink and chalk 640x144 source assets", () => {
    for (const name of [
      "pickle-king-lockup.png",
      "pickle-king-lockup-chalk.png",
    ]) {
      const png = readFileSync(
        new URL(`../../../public/brand/${name}`, import.meta.url),
      );
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(640);
      expect(png.readUInt32BE(20)).toBe(144);
      expect(png[25]).toBe(6);
    }
    expect(BRAND_LOCKUP_ASPECT_RATIO).toBeCloseTo(4.444444, 5);
  });

  it("draws the requested fixed-ratio asset without Canvas filters", () => {
    const calls: number[][] = [];
    const chalk = {} as HTMLImageElement;
    const ink = {} as HTMLImageElement;
    const context = {
      drawImage: (image: HTMLImageElement, ...values: number[]) => {
        expect(image).toBe(chalk);
        calls.push(values);
      },
    } as unknown as CanvasRenderingContext2D;

    drawBrandLockup(context, { chalk, ink }, 540, 100, 320, "chalk");

    expect(calls).toHaveLength(1);
    expect(calls[0].slice(2)).toEqual([320, 320 / BRAND_LOCKUP_ASPECT_RATIO]);
  });
});
