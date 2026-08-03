export type ShareFormat = "feed" | "story";

export function shareDimensions(format: ShareFormat) {
  return format === "story"
    ? { height: 1920, width: 1080 }
    : { height: 1350, width: 1080 };
}

export function shareFormatLabel(format: ShareFormat) {
  return format === "story" ? "Story" : "Feed";
}
