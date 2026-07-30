"use client";

import { motion, useReducedMotion } from "motion/react";

const titleLines = [
  { text: "Settle it", muted: false },
  { text: "on court.", muted: true },
];

export function HomeTitle() {
  const reducedMotion = useReducedMotion();

  return (
    <h1>
      {titleLines.map(({ text, muted }, index) => (
        <span className="home-title__clip" key={text}>
          <motion.span
            animate={{ y: 0 }}
            className={muted ? "home-title__muted" : undefined}
            initial={reducedMotion ? false : { y: "112%" }}
            transition={{
              delay: reducedMotion ? 0 : 0.08 + index * 0.1,
              duration: reducedMotion ? 0 : 0.62,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {text}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
