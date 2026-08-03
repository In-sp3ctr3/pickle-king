export type ShareOutcome = "shared" | "downloaded" | "cancelled";

function pngFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
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

export async function shareCanvas(
  canvas: HTMLCanvasElement,
  fileName: string,
  title: string,
): Promise<ShareOutcome> {
  const file = await pngFile(canvas, fileName);
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      throw error;
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return "downloaded";
}
