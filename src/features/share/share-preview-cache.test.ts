import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./share-file", () => ({
  pngFile: vi.fn(
    async (_canvas: HTMLCanvasElement, name: string) =>
      new File(["png"], name, { type: "image/png" }),
  ),
}));

describe("share preview cache", () => {
  beforeEach(() => vi.resetModules());

  it("evicts the oldest large preview after eight entries", async () => {
    const { sharePreviewFile } = await import("./share-preview-cache");
    const builds = new Map<string, number>();
    const build = (key: string) => async () => {
      builds.set(key, (builds.get(key) ?? 0) + 1);
      return {} as HTMLCanvasElement;
    };

    for (let index = 0; index < 9; index += 1) {
      const key = `preview-${index}`;
      await sharePreviewFile(key, `${key}.png`, build(key));
    }
    await sharePreviewFile("preview-0", "preview-0.png", build("preview-0"));
    await sharePreviewFile("preview-8", "preview-8.png", build("preview-8"));

    expect(builds.get("preview-0")).toBe(2);
    expect(builds.get("preview-8")).toBe(1);
  });
});
