"use client";

import { useEffect, useState } from "react";

export function HomeMascot() {
  const [motionState, setMotionState] = useState("enter");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const staticFrame = window.setTimeout(() => setMotionState("static"), 0);
      return () => window.clearTimeout(staticFrame);
    }
    const awake = window.setTimeout(() => setMotionState("awake"), 420);
    const settled = window.setTimeout(() => setMotionState("settled"), 1_050);
    return () => {
      window.clearTimeout(awake);
      window.clearTimeout(settled);
    };
  }, []);

  return (
    <figure
      className="home-mascot"
      data-motion-state={motionState}
      data-qa="home-mascot"
    >
      <span aria-hidden="true" className="home-mascot__image" />
      <span aria-hidden="true" className="home-mascot__eyelid is-left" />
      <span aria-hidden="true" className="home-mascot__eyelid is-right" />
      <figcaption>Pickle King</figcaption>
    </figure>
  );
}
