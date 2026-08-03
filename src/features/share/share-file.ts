export type ShareOutcome = "shared" | "downloaded" | "cancelled";

export function pngFile(
  canvas: HTMLCanvasElement,
  fileName: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The share image could not be encoded."));
        return;
      }
      resolve(new File([blob], fileName, { type: "image/png" }));
    }, "image/png");
  });
}

export function canShareFile(file: File) {
  return (
    typeof navigator.share === "function" &&
    Boolean(navigator.canShare?.({ files: [file] }))
  );
}

export async function shareFile(file: File, title: string) {
  if (!canShareFile(file)) {
    throw new Error("File sharing is not available in this browser.");
  }
  try {
    await navigator.share({ files: [file], title });
    return "shared" as const;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled" as const;
    }
    throw error;
  }
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.download = file.name;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return "downloaded" as const;
}

export async function shareCanvas(
  canvas: HTMLCanvasElement | Promise<HTMLCanvasElement>,
  fileName: string,
  title: string,
): Promise<ShareOutcome> {
  const file = await pngFile(await canvas, fileName);
  return canShareFile(file) ? shareFile(file, title) : downloadFile(file);
}
