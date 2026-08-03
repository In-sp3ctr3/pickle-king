export function SharePreviewSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-label="Preparing Pickle King preview"
      className={["share-preview-skeleton", className]
        .filter(Boolean)
        .join(" ")}
      role="status"
    >
      {/* The local brand mark is available offline and intentionally bypasses optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/brand/pickle-king-mark.png" />
      <strong>Pickle King</strong>
      <span aria-hidden="true" className="share-preview-skeleton__spinner" />
    </div>
  );
}
