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
  return canShareFiles([file]);
}

export function canShareFiles(files: File[]) {
  return (
    typeof navigator.share === "function" &&
    Boolean(navigator.canShare?.({ files }))
  );
}

export async function shareFile(file: File, title: string) {
  return shareFiles([file], title);
}

export async function shareFiles(files: File[], title: string) {
  if (!canShareFiles(files)) {
    throw new Error("File sharing is not available in this browser.");
  }
  try {
    await navigator.share({ files, title });
    return "completed" as const;
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
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return "downloaded" as const;
}
