"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

type SplashState = "impact" | "spread" | "droplets" | "settled" | "static";

export function HomeCourtArt() {
  const reducedMotion = useReducedMotion();
  const [splashState, setSplashState] = useState<SplashState>("impact");

  useEffect(() => {
    if (reducedMotion) return;

    const stages: Array<[SplashState, number]> = [
      ["spread", 150],
      ["droplets", 430],
      ["settled", 1_050],
    ];
    const timers = stages.map(([state, delay]) =>
      window.setTimeout(() => setSplashState(state), delay),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [reducedMotion]);

  return (
    <figure
      className="home-court-art"
      data-motion-state={reducedMotion ? "static" : splashState}
      data-qa="home-product-sequence"
    >
      <motion.div
        aria-hidden="true"
        className="home-court-art__impact"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: reducedMotion ? 0 : [0, 0.26, 0], scale: 1.25 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <span />
      </motion.div>
      {(["main", "echo", "flecks"] as const).map((layer, index) => (
        <div
          aria-hidden="true"
          className={`home-court-art__layer home-court-art__layer--${layer}`}
          key={layer}
        >
          <Image
            alt=""
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 42vw, 100vw"
            src="/brand/pickle-king-hero.webp"
            unoptimized
          />
        </div>
      ))}
      <div aria-hidden="true" className="home-court-art__droplets">
        <Image
          alt=""
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          src="/brand/pickle-king-hero.webp"
          unoptimized
        />
      </div>
      <figcaption className="sr-only">
        An acid-lime pickleball races across a night court toward a gold crown.
      </figcaption>
    </figure>
  );
}
