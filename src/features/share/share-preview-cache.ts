import { pngFile } from "./share-file";

const previewFiles = new Map<string, Promise<File>>();
const previewFileLimit = 8;

export function sharePreviewFile(
  key: string,
  fileName: string,
  build: () => Promise<HTMLCanvasElement>,
) {
  const cached = previewFiles.get(key);
  if (cached) {
    previewFiles.delete(key);
    previewFiles.set(key, cached);
    return cached;
  }
  const pending = build()
    .then((canvas) => pngFile(canvas, fileName))
    .catch((error: unknown) => {
      previewFiles.delete(key);
      throw error;
    });
  previewFiles.set(key, pending);
  while (previewFiles.size > previewFileLimit) {
    const oldestKey = previewFiles.keys().next().value;
    if (typeof oldestKey === "string") previewFiles.delete(oldestKey);
  }
  return pending;
}

export function prewarmSharePreview(
  key: string,
  fileName: string,
  build: () => Promise<HTMLCanvasElement>,
) {
  void sharePreviewFile(key, fileName, build).catch(() => undefined);
}
