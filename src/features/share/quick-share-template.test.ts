import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

async function artBounds(
  file: string,
  region: { bottom: number; left: number; right: number; top: number },
  paper = false,
) {
  const { data, info } = await sharp(
    path.join(process.cwd(), "public/share/templates", file),
  )
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width;
  let right = -1;
  for (let y = region.top; y <= region.bottom; y += 1) {
    for (let x = region.left; x <= region.right; x += 1) {
      const index = (y * info.width + x) * info.channels;
      const rgb = [data[index], data[index + 1], data[index + 2]];
      const colored = paper
        ? Math.min(...rgb) < 185 || Math.max(...rgb) - Math.min(...rgb) > 35
        : Math.max(...rgb) > 35;
      if (!colored) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }
  return { left, right };
}

describe("Quick template safe zones", () => {
  it.each(["feed", "story"] as const)(
    "keeps all mascot art outside the result lanes in %s",
    async (format) => {
      const poster = await artBounds(`quick-poster-${format}.webp`, {
        bottom: format === "story" ? 1660 : 1230,
        left: 430,
        right: 1079,
        top: 180,
      });
      const frame = await artBounds(`quick-frame-${format}.webp`, {
        bottom: format === "story" ? 1740 : 1240,
        left: 430,
        right: 1079,
        top: 160,
      });
      const receipt = await artBounds(
        `quick-receipt-${format}.webp`,
        { bottom: 1220, left: 0, right: 900, top: 620 },
        true,
      );
      expect(poster.left).toBeGreaterThanOrEqual(510);
      expect(frame.left).toBeGreaterThanOrEqual(510);
      expect(receipt.right).toBeLessThanOrEqual(700);
    },
  );
});
