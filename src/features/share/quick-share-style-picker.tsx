import type { QuickShareStyle } from "./quick-share-card";

const styles: { label: string; value: QuickShareStyle }[] = [
  { label: "Poster", value: "poster" },
  { label: "Frame", value: "frame" },
  { label: "Receipt", value: "receipt" },
];

export function QuickShareStylePicker({
  onChange,
  value,
}: {
  onChange: (style: QuickShareStyle) => void;
  value: QuickShareStyle;
}) {
  return (
    <div aria-label="Image style" className="share-format-choice" role="group">
      {styles.map((style) => (
        <button
          aria-pressed={value === style.value}
          key={style.value}
          onClick={() => onChange(style.value)}
          type="button"
        >
          {style.label}
        </button>
      ))}
    </div>
  );
}
