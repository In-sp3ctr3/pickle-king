import { describe, expect, it } from "vitest";
import {
  drawQuickShareLayout,
  type QuickShareCardData,
} from "./quick-share-layouts";

type TextCall = { font: string; text: string; x: number; y: number };

function recordingContext() {
  const text: TextCall[] = [];
  const images: Array<{ height: number; width: number; x: number; y: number }> =
    [];
  const translations: Array<[number, number]> = [];
  const context = {
    fillStyle: "",
    font: "10px sans-serif",
    letterSpacing: "0px",
    textAlign: "left",
    filter: "none",
    drawImage: (_image: HTMLImageElement, ...values: number[]) => {
      const [x, y, width, height] =
        values.length === 8 ? values.slice(4) : values;
      images.push({ height, width, x, y });
    },
    fillText(this: { font: string }, value: string, x: number, y: number) {
      text.push({ font: this.font, text: value, x, y });
    },
    fillRect() {},
    measureText(this: { font: string; letterSpacing: string }, value: string) {
      const size = Number.parseFloat(
        this.font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "10",
      );
      const tracking = Number.parseFloat(this.letterSpacing) || 0;
      return {
        width:
          value.length * size * 0.6 + Math.max(0, value.length - 1) * tracking,
      };
    },
    restore() {},
    save() {},
    scale() {},
    translate(x: number, y: number) {
      translations.push([x, y]);
    },
  } as unknown as CanvasRenderingContext2D;
  return { context, images, text, translations };
}

const fixture: QuickShareCardData = {
  date: "AUG 22",
  format: "SINGLES",
  heading: ["SINGLES", "AUG 22"],
  loserName: "Steven",
  loserScore: 7,
  winnerName: "Maya",
  winnerScore: 11,
};

describe("Quick Receipt layout", () => {
  it("uses the reference fonts and fixed Story baselines", () => {
    const { context, text } = recordingContext();
    drawQuickShareLayout(
      context,
      {} as HTMLImageElement,
      fixture,
      1080,
      1920,
      "receipt",
    );

    expect(text.find(({ text }) => text === "MAYA")).toMatchObject({
      font: "400 164px 'Archivo Black', sans-serif",
      x: 1014,
      y: 1253,
    });
    expect(text.find(({ text }) => text === "11–7")).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Alfa Slab One', serif$/),
      x: 0,
      y: 1710,
    });
    expect(text.find(({ text }) => text === "over Steven")).toMatchObject({
      font: "400 40px Manrope, sans-serif",
      x: 1001,
      y: 1759,
    });
  });

  it("keeps score and opponent positions independent of winner line count", () => {
    const short = recordingContext();
    const long = recordingContext();
    drawQuickShareLayout(
      short.context,
      {} as HTMLImageElement,
      fixture,
      1080,
      1920,
      "receipt",
    );
    drawQuickShareLayout(
      long.context,
      {} as HTMLImageElement,
      { ...fixture, winnerName: "Ana Maria + Christopher Jonathan" },
      1080,
      1920,
      "receipt",
    );

    for (const value of ["11–7", "over Steven"]) {
      expect(long.text.find(({ text }) => text === value)).toMatchObject(
        short.text.find(({ text }) => text === value)!,
      );
    }
    expect(long.text.find(({ text }) => text === "WINS")?.y).toBe(1385);
  });

  it("centers the canonical 4.444:1 lockup", () => {
    const { context, images } = recordingContext();
    drawQuickShareLayout(
      context,
      {} as HTMLImageElement,
      fixture,
      1080,
      1920,
      "receipt",
    );
    const footer = images.slice(-2);
    const left = footer[0].x;
    const right = footer[1].x + footer[1].width;

    expect(right - left).toBeCloseTo(320);
    expect(footer[0].height).toBeCloseTo(72);
    expect((left + right) / 2).toBeCloseTo(540);
  });
});

describe("Quick Poster and Frame Story layouts", () => {
  it("renders a valid sixteen-character winner in full in every treatment", () => {
    for (const style of ["poster", "frame", "receipt"] as const) {
      for (const height of [1350, 1920]) {
        const { context, text } = recordingContext();
        drawQuickShareLayout(
          context,
          {} as HTMLImageElement,
          { ...fixture, winnerName: "Jean-Baptiste M." },
          1080,
          height,
          style,
        );
        const rendered = text.map(({ text }) => text).join(" ");
        expect(rendered, `${style} ${height}`).toContain("JEAN");
        expect(rendered, `${style} ${height}`).toContain("BAPTISTE");
        expect(rendered, `${style} ${height}`).toContain("M.");
        expect(
          text
            .filter(({ text }) => /JEAN|BAPTISTE|M\./.test(text))
            .some(({ text }) => text.includes("…")),
          `${style} ${height}`,
        ).toBe(false);
        const nameLines = text.filter(({ text }) =>
          /JEAN|BAPTISTE|M\./.test(text),
        );
        expect(new Set(nameLines.map(({ font }) => font)).size).toBe(1);
        const wins = text.find(({ text }) => text === "WINS")!;
        const lastNameLine = nameLines.at(-1)!;
        const nameSize = Number.parseFloat(
          lastNameLine.font.match(/(\d+)px/)![1],
        );
        expect(wins.y - lastNameLine.y).toBeGreaterThan(nameSize);
      }
    }
  });

  it("matches the Poster type, score, opponent, and footer anchors", () => {
    const { context, text, translations } = recordingContext();
    drawQuickShareLayout(
      context,
      {} as HTMLImageElement,
      {
        ...fixture,
        loserName: "Shevar",
        loserScore: 2,
        winnerName: "Jadan",
        winnerScore: 4,
      },
      1080,
      1920,
      "poster",
    );

    expect(text.find(({ text }) => text === "JADAN")).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Anton', sans-serif$/),
      x: 68,
      y: 359,
    });
    const winner = text.find(({ text }) => text === "JADAN")!;
    const winnerSize = Number.parseFloat(winner.font.match(/(\d+)px/)![1]);
    expect(
      winner.x + winner.text.length * winnerSize * 0.6,
    ).toBeLessThanOrEqual(423);
    expect(
      text.find(({ text, y }) => text === "4" && y === 1048),
    ).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Anton', sans-serif$/),
      x: 0,
    });
    expect(text.find(({ text }) => text === "over Shevar")).toMatchObject({
      font: "800 46px Manrope, sans-serif",
      x: 239,
      y: 1614,
    });
    expect(translations.filter(([x]) => x === 228)).toHaveLength(3);
  });

  it("matches the Frame winner and independently fitted result anchors", () => {
    const { context, text, translations } = recordingContext();
    drawQuickShareLayout(
      context,
      {} as HTMLImageElement,
      fixture,
      1080,
      1920,
      "frame",
    );

    expect(text.find(({ text }) => text === "MAYA")).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Anton', sans-serif$/),
      x: 120,
      y: 1182,
    });
    expect(text.find(({ text }) => text === "WINS")?.y).toBe(1400);
    expect(text.find(({ text }) => text === "11–7")).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Alfa Slab One', serif$/),
      x: 0,
      y: 1648,
    });
    expect(text.find(({ text }) => text === "over Steven")).toMatchObject({
      font: expect.stringMatching(/^400 \d+px Manrope, sans-serif$/),
      x: 0,
      y: 1717,
    });
    expect(translations).toEqual(
      expect.arrayContaining([
        [131, 0],
        [128, 0],
      ]),
    );
  });
});
