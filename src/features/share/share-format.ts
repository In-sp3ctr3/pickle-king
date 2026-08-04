export type ShareFormat = "feed" | "story";
export type BracketShareFormat = ShareFormat | "landscape";

export function shareDimensions(format: ShareFormat) {
  return format === "story"
    ? { height: 1920, width: 1080 }
    : { height: 1350, width: 1080 };
}

export function shareFormatLabel(format: ShareFormat) {
  return format === "story" ? "Story / Reel" : "Post";
}

export function bracketShareDimensions(format: BracketShareFormat) {
  return format === "landscape"
    ? { height: 1200, width: 1600 }
    : shareDimensions(format);
}

export function bracketShareFormatLabel(format: BracketShareFormat) {
  return format === "landscape" ? "Full draw" : shareFormatLabel(format);
}
