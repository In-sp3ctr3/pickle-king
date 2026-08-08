"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function MeasuredLabel({
  className,
  maxSize = 18,
  minSize = 11,
  text,
}: {
  className?: string;
  maxSize?: number;
  minSize?: number;
  text: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(minSize);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;
    const measure = () => {
      const available = element.clientWidth;
      if (available <= 0) return;
      const style = window.getComputedStyle(element);
      const measuredText =
        style.textTransform === "uppercase"
          ? text.toLocaleUpperCase()
          : style.textTransform === "lowercase"
            ? text.toLocaleLowerCase()
            : text;
      const letterSpacing =
        style.letterSpacing === "normal"
          ? 0
          : Number.parseFloat(style.letterSpacing) || 0;
      let next = maxSize;
      while (next > minSize) {
        context.font = `${style.fontWeight} ${next}px ${style.fontFamily}`;
        const width =
          context.measureText(measuredText).width +
          Math.max(0, measuredText.length - 1) * letterSpacing;
        if (width <= available) break;
        next -= 1;
      }
      setSize(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [maxSize, minSize, text]);

  return (
    <span
      className={`measured-label${className ? ` ${className}` : ""}`}
      ref={ref}
      style={{ fontSize: `${size}px` }}
      title={text}
    >
      {text}
    </span>
  );
}
