import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SharePreviewActions } from "./share-preview-actions";
import type { SharePreviewState } from "./use-share-preview";

function preview(
  overrides: Partial<SharePreviewState> = {},
): SharePreviewState {
  return {
    appleMobile: false,
    busy: false,
    download: vi.fn(),
    error: null,
    lastAction: null,
    previewUrl: "blob:preview",
    ready: true,
    share: vi.fn(),
    shareAvailable: true,
    status: "idle",
    ...overrides,
  };
}

describe("SharePreviewActions", () => {
  it("uses one Share / Save action on iPad and iPhone", () => {
    const markup = renderToStaticMarkup(
      <SharePreviewActions preview={preview({ appleMobile: true })} />,
    );
    expect(markup).toContain("Share / Save");
    expect(markup).not.toContain("Download image");
  });

  it("offers a save fallback when native iPad sharing is unavailable", () => {
    const markup = renderToStaticMarkup(
      <SharePreviewActions
        preview={preview({ appleMobile: true, shareAvailable: false })}
      />,
    );
    expect(markup).toContain("Save image");
    expect(markup).not.toContain("Download image");
  });

  it("shows completion inside the action instead of status copy", () => {
    const markup = renderToStaticMarkup(
      <SharePreviewActions
        preview={preview({ lastAction: "download", status: "success" })}
      />,
    );
    expect(markup).toContain("Saved");
    expect(markup).not.toContain("Download started");
  });

  it("uses neutral Done copy after native sharing completes", () => {
    const markup = renderToStaticMarkup(
      <SharePreviewActions
        preview={preview({ lastAction: "share", status: "success" })}
      />,
    );
    expect(markup).toContain("Done");
    expect(markup).not.toContain("Shared");
  });

  it("announces only genuine failures", () => {
    const markup = renderToStaticMarkup(
      <SharePreviewActions
        preview={preview({
          error: "The image could not be saved.",
          status: "error",
        })}
      />,
    );
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("The image could not be saved.");
  });
});
