"use client";

import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

const colors = ["#c8ff3d", "#f5f3e9", "#f3c744", "#86a825"];

export function VictoryConfetti({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.motionState = "static";
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(bounds.width));
    canvas.height = Math.max(1, Math.round(bounds.height));
    const fire = confetti.create(canvas, { resize: false, useWorker: true });
    const common = {
      colors,
      disableForReducedMotion: true,
      gravity: 0.95,
      particleCount: 54,
      scalar: 0.92,
      spread: 52,
      startVelocity: 42,
      ticks: 150,
    };
    void fire({ ...common, angle: 58, origin: { x: 0.03, y: 0.7 } });
    const secondBurst = window.setTimeout(() => {
      void fire({ ...common, angle: 122, origin: { x: 0.97, y: 0.7 } });
    }, 90);
    const settle = window.setTimeout(() => {
      root.dataset.motionState = "settled";
    }, 1_200);
    return () => {
      window.clearTimeout(secondBurst);
      window.clearTimeout(settle);
      fire.reset();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`victory-confetti ${className}`}
      data-motion-state="burst"
      data-qa="victory-confetti"
      ref={rootRef}
    >
      <canvas ref={canvasRef} />
      <div className="victory-confetti__static">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  );
}
