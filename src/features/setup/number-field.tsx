interface NumberFieldProps {
  error?: string;
  help: string;
  id: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: string) => void;
  suffix: string;
  value: string;
}

export function NumberField({
  error,
  help,
  id,
  label,
  max,
  min,
  onChange,
  suffix,
  value,
}: NumberFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <label className="setup-number-field">
      <span>{label}</span>
      <span className="setup-number-input">
        <input
          aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          id={id}
          inputMode="numeric"
          max={max}
          min={min}
          onChange={(event) => onChange(event.currentTarget.value)}
          required
          type="number"
          value={value}
        />
        <span className="setup-number-suffix">{suffix}</span>
      </span>
      <span className="setup-number-help" id={helpId}>
        {help}
      </span>
      {error ? (
        <span className="setup-field-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
