import type { QuickShareStyle } from "./quick-share-card";

const styles: { label: string; value: QuickShareStyle }[] = [
  { label: "Poster", value: "poster" },
  { label: "Frame", value: "frame" },
  { label: "Receipt", value: "receipt" },
];

export function QuickShareStylePicker({
  onChange,
  thumbnails = {},
  value,
}: {
  onChange: (style: QuickShareStyle) => void;
  thumbnails?: Partial<Record<QuickShareStyle, string>>;
  value: QuickShareStyle;
}) {
  return (
    <div
      aria-label="Design"
      className="quick-share-design-rail"
      role="radiogroup"
    >
      {styles.map((style) => (
        <button
          aria-checked={value === style.value}
          className="quick-share-design"
          data-qa={`quick-design-${style.value}`}
          key={style.value}
          onClick={() => onChange(style.value)}
          role="radio"
          type="button"
        >
          <span className="quick-share-design__image">
            {thumbnails[style.value] ? (
              // Generated local Blob URL.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={thumbnails[style.value]} />
            ) : (
              <span
                aria-hidden="true"
                className="quick-share-design__placeholder"
              />
            )}
          </span>
          {style.label}
        </button>
      ))}
    </div>
  );
}
