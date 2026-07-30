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
    <label className="grid gap-2">
      <span className="text-xs font-extrabold tracking-[0.14em] text-[#9da494] uppercase">
        {label}
      </span>
      <span className="relative">
        <input
          aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          className="min-h-13 w-full rounded-[18px] border border-[#3b4436] bg-[#090b08] px-4 pr-20 text-lg font-black text-[#f5f3e9] tabular-nums hover:border-[#596452]"
          id={id}
          inputMode="numeric"
          max={max}
          min={min}
          onChange={(event) => onChange(event.currentTarget.value)}
          required
          type="number"
          value={value}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-extrabold tracking-[0.1em] text-[#737b6c] uppercase">
          {suffix}
        </span>
      </span>
      <span className="text-xs leading-5 text-[#737b6c]" id={helpId}>
        {help}
      </span>
      {error ? (
        <span className="text-sm font-semibold text-[#ff9a78]" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
