"use client";

import { useId, useMemo, useRef, useState } from "react";

export function NameCombobox({
  describedBy,
  invalid,
  label,
  maxLength,
  onChange,
  suggestions,
  value,
}: {
  describedBy?: string;
  invalid: boolean;
  label: string;
  maxLength: number;
  onChange: (value: string) => void;
  suggestions: string[];
  value: string;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();
    return suggestions
      .filter((name) =>
        query ? name.toLocaleLowerCase().includes(query) : true,
      )
      .slice(0, 6);
  }, [suggestions, value]);
  const visible = open && matches.length > 0;

  function choose(name: string) {
    onChange(name);
    setOpen(false);
    setActive(0);
    inputRef.current?.focus();
  }

  return (
    <div className={`name-combobox${invalid ? "is-invalid" : ""}`}>
      <label>
        <span>{label}</span>
        <input
          aria-activedescendant={
            visible ? `${listId}-option-${active}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listId}
          aria-describedby={describedBy}
          aria-expanded={visible}
          aria-invalid={invalid}
          autoComplete="off"
          maxLength={maxLength}
          onBlur={() => window.setTimeout(() => setOpen(false), 100)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && matches.length) {
              event.preventDefault();
              setOpen(true);
              setActive((index) => (index + 1) % matches.length);
            }
            if (event.key === "ArrowUp" && matches.length) {
              event.preventDefault();
              setOpen(true);
              setActive(
                (index) => (index - 1 + matches.length) % matches.length,
              );
            }
            if (event.key === "Enter" && visible) {
              event.preventDefault();
              choose(matches[active]);
            }
            if (event.key === "Escape") setOpen(false);
          }}
          ref={inputRef}
          role="combobox"
          value={value}
        />
      </label>
      <ul
        className="name-combobox__list"
        hidden={!visible}
        id={listId}
        role="listbox"
      >
        {matches.map((name, index) => (
          <li
            aria-selected={index === active}
            id={`${listId}-option-${index}`}
            key={name.toLocaleLowerCase()}
            role="option"
          >
            <button
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(name)}
              tabIndex={-1}
              type="button"
            >
              {name}
              <span>Use player</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
