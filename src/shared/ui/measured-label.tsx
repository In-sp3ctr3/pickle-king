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
  const [size, setSize] = useState(maxSize);

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
      let next = maxSize;
      while (next > minSize) {
        context.font = `${style.fontWeight} ${next}px ${style.fontFamily}`;
        if (context.measureText(text).width <= available) break;
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
