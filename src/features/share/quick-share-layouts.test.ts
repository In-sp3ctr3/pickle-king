import { describe, expect, it } from "vitest";
import {
  drawQuickShareLayout,
  type QuickShareCardData,
} from "./quick-share-layouts";

type TextCall = { font: string; text: string; x: number; y: number };
const lockup = {
  chalk: {} as HTMLImageElement,
  ink: {} as HTMLImageElement,
};

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
      const factor = this.font.includes("Anton")
        ? 0.38
        : this.font.includes("Alfa Slab One")
          ? 0.46
          : 0.56;
      return {
        actualBoundingBoxAscent: size * 0.76,
        actualBoundingBoxDescent: 0,
        width:
          value.length * size * factor +
          Math.max(0, value.length - 1) * tracking,
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
    drawQuickShareLayout(context, lockup, fixture, 1080, 1920, "receipt");

    const winner = text.find(({ text }) => text === "MAYA")!;
    const wins = text.find(({ text }) => text === "WINS")!;
    expect(winner.font).toBe("400 164px 'Archivo Black', sans-serif");
    expect(winner.x).toBe(1014);
    expect(estimatedInkTop(winner)).toBeGreaterThanOrEqual(1121);
    expect(wins.y - winner.y).toBeGreaterThan(120);
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
    drawQuickShareLayout(short.context, lockup, fixture, 1080, 1920, "receipt");
    drawQuickShareLayout(
      long.context,
      lockup,
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
    drawQuickShareLayout(context, lockup, fixture, 1080, 1920, "receipt");
    const footer = images.at(-1)!;

    expect(footer.width).toBeCloseTo(320);
    expect(footer.height).toBeCloseTo(72);
    expect(footer.x + footer.width / 2).toBeCloseTo(540);
  });
});

describe("Quick Poster and Frame Story layouts", () => {
  it("keeps the production 12–10 feed fixture inside each safe text lane", () => {
    const production = {
      ...fixture,
      loserName: "Jean-Paul",
      loserScore: 10,
      winnerName: "Darien",
      winnerScore: 12,
    };

    const poster = recordingContext();
    drawQuickShareLayout(
      poster.context,
      lockup,
      production,
      1080,
      1350,
      "poster",
    );
    expect(
      poster.text
        .filter(({ text }) => ["12", "–", "10"].includes(text))
        .map(({ y }) => y),
    ).toEqual([820, 1040]);

    const frame = recordingContext();
    drawQuickShareLayout(
      frame.context,
      lockup,
      production,
      1080,
      1350,
      "frame",
    );
    const frameScore = frame.text.find(({ text }) => text === "12–10")!;
    expect(estimatedRight(frameScore)).toBeLessThanOrEqual(524);

    const receipt = recordingContext();
    drawQuickShareLayout(
      receipt.context,
      lockup,
      production,
      1080,
      1350,
      "receipt",
    );
    const receiptWins = receipt.text.find(({ text }) => text === "WINS")!;
    const receiptScore = receipt.text.find(({ text }) => text === "12–10")!;
    expect(receipt.translations).toContainEqual([1008, 0]);
    expect(receiptScore).toMatchObject({ x: 0, y: 1093 });
    expect(
      estimatedInkTop(receiptScore) - receiptWins.y,
    ).toBeGreaterThanOrEqual(72);
  });

  it("keeps every Post footer centered inside the safe area", () => {
    for (const style of ["poster", "frame", "receipt"] as const) {
      const { context, images, text } = recordingContext();
      drawQuickShareLayout(context, lockup, fixture, 1080, 1350, style);
      const footer = images.at(-1)!;
      const lastContentBaseline = Math.max(...text.map(({ y }) => y));

      expect(footer.x + footer.width / 2, style).toBeCloseTo(540);
      expect(footer.y + footer.height, style).toBeLessThanOrEqual(1296);
      expect(footer.y - lastContentBaseline, style).toBeGreaterThanOrEqual(72);
    }
  });

  it("renders a valid sixteen-character winner in full in every treatment", () => {
    for (const style of ["poster", "frame", "receipt"] as const) {
      for (const height of [1350, 1920]) {
        const { context, text } = recordingContext();
        drawQuickShareLayout(
          context,
          lockup,
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
        if (style === "receipt" && height === 1350)
          expect(
            estimatedInkTop(text.find(({ text }) => text === "11–7")!) - wins.y,
          ).toBeGreaterThanOrEqual(72);
      }
    }
  });

  it("matches the Poster type, score, opponent, and footer anchors", () => {
    const { context, text, translations } = recordingContext();
    drawQuickShareLayout(
      context,
      lockup,
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

    const winner = text.find(({ text }) => text === "JADAN")!;
    expect(winner).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Anton', sans-serif$/),
      x: 68,
    });
    expect(estimatedInkTop(winner)).toBeGreaterThanOrEqual(205);
    expect(estimatedRight(winner)).toBeLessThanOrEqual(423);
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
    drawQuickShareLayout(context, lockup, fixture, 1080, 1920, "frame");

    const winner = text.find(({ text }) => text === "MAYA")!;
    expect(winner).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Anton', sans-serif$/),
      x: 120,
    });
    expect(estimatedInkTop(winner)).toBeGreaterThanOrEqual(964);
    expect(text.find(({ text }) => text === "WINS")?.y).toBe(1400);
    expect(text.find(({ text }) => text === "11–7")).toMatchObject({
      font: expect.stringMatching(/^400 \d+px 'Alfa Slab One', serif$/),
      x: 0,
      y: 1648,
    });
    expect(text.find(({ text }) => text === "over Steven")).toMatchObject({
      font: expect.stringMatching(/^400 \d+px Manrope, sans-serif$/),
      x: 128,
      y: 1717,
    });
    expect(translations).toContainEqual([131, 0]);
  });
});

function estimatedLeft(call: TextCall) {
  const width = estimatedWidth(call);
  if (call.x >= 900) return call.x - width;
  return call.x;
}

function estimatedRight(call: TextCall) {
  return estimatedLeft(call) + estimatedWidth(call);
}

function estimatedWidth(call: TextCall) {
  const size = Number.parseFloat(
    call.font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "10",
  );
  const factor = call.font.includes("Anton")
    ? 0.38
    : call.font.includes("Alfa Slab One")
      ? 0.46
      : 0.56;
  return call.text.length * size * factor;
}

function estimatedInkTop(call: TextCall) {
  const size = Number.parseFloat(
    call.font.match(/(\d+(?:\.\d+)?)px/)?.[1] ?? "10",
  );
  return call.y - size * 0.75;
}
