import type { BracketShareFormat } from "./share-format";
import { bracketShareFormatLabel } from "./share-format";

export function ShareFormatPicker({
  formats,
  onChange,
  value,
}: {
  formats: readonly BracketShareFormat[];
  onChange: (format: BracketShareFormat) => void;
  value: BracketShareFormat;
}) {
  return (
    <div aria-label="Image format" className="share-format-choice" role="group">
      {formats.map((format) => (
        <button
          aria-pressed={value === format}
          data-qa={`share-format-${format}`}
          key={format}
          onClick={() => onChange(format)}
          type="button"
        >
          {bracketShareFormatLabel(format)}
        </button>
      ))}
    </div>
  );
}
