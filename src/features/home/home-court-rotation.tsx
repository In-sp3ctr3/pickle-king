"use client";

import { Crown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

type RotationState = "seeded" | "rotate" | "serve" | "settled" | "static";

const entrants = [
  { name: "Luis", role: "court-a" },
  { name: "Trent", role: "court-b" },
  { name: "Maya", role: "rest-a" },
  { name: "Rae", role: "rest-b" },
] as const;

export function HomeCourtRotation() {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState<RotationState>("seeded");

  useEffect(() => {
    if (reducedMotion) return;
    const timers = [
      window.setTimeout(() => setState("rotate"), 180),
      window.setTimeout(() => setState("serve"), 620),
      window.setTimeout(() => setState("settled"), 1_080),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [reducedMotion]);

  const staticState = reducedMotion ? "static" : state;
  return (
    <figure
      className="home-rotation"
      data-motion-state={staticState}
      data-qa="home-product-sequence"
    >
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="home-rotation__crown"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.6, y: -18 }}
        transition={{ delay: 0.72, type: "spring", bounce: 0.32 }}
      >
        <Crown aria-hidden="true" size={34} strokeWidth={1.8} />
        <span>One crown</span>
      </motion.div>

      <div aria-hidden="true" className="home-rotation__court">
        <span className="home-rotation__net" />
        <span className="home-rotation__line home-rotation__line--a" />
        <span className="home-rotation__line home-rotation__line--b" />
      </div>

      {entrants.map((entrant, index) => (
        <motion.span
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          className={`home-rotation__player home-rotation__player--${entrant.role}`}
          initial={
            reducedMotion
              ? false
              : {
                  opacity: 0,
                  scale: 0.88,
                  x: index % 2 ? 28 : -28,
                  y: index < 2 ? 18 : 32,
                }
          }
          key={entrant.name}
          transition={{
            delay: 0.12 + index * 0.08,
            type: "spring",
            bounce: 0.24,
            duration: 0.65,
          }}
        >
          <strong>{entrant.name}</strong>
          <small>{index < 2 ? "On court" : "Resting"}</small>
        </motion.span>
      ))}

      <motion.span
        aria-hidden="true"
        animate={
          reducedMotion
            ? { x: 0, y: 0 }
            : { rotate: [0, 140, 300], x: [-62, 4, 68], y: [8, -16, 5] }
        }
        className="home-rotation__ball"
        transition={{ delay: 0.58, duration: 0.72, ease: "easeInOut" }}
      >
        <i />
        <i />
        <i />
      </motion.span>

      <div className="home-rotation__rest">
        <span>Rest lane</span>
        <strong>08:42 buffer</strong>
      </div>
      <figcaption className="sr-only">
        Luis and Trent move onto the court while Maya and Rae rest before the
        next scheduled match.
      </figcaption>
    </figure>
  );
}
