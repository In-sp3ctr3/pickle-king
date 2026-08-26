export type ShareFormat = "feed" | "story";
export type BracketShareFormat = ShareFormat | "landscape";

export const DEFAULT_SHARE_FORMAT: ShareFormat = "story";

export function shareDimensions(format: ShareFormat) {
  return format === "story"
    ? { height: 1920, width: 1080 }
    : { height: 1350, width: 1080 };
}

export function shareFormatLabel(format: ShareFormat) {
  return format === "story" ? "Story (9:16)" : "Post (4:5)";
}

export function bracketShareDimensions(format: BracketShareFormat) {
  return format === "landscape"
    ? { height: 1200, width: 1600 }
    : shareDimensions(format);
}

export function bracketShareFormatLabel(format: BracketShareFormat) {
  return format === "landscape" ? "Full draw (4:3)" : shareFormatLabel(format);
}
