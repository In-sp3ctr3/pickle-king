"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Home } from "lucide-react";

export function FloatingAppNav({
  backLabel,
  currentLabel,
  onBack,
  onHome,
}: {
  backLabel: string;
  currentLabel: string;
  onBack: () => void;
  onHome: () => void;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <div className="floating-nav-slot">
      <motion.nav aria-label="Application" className="floating-app-nav">
        <button
          aria-label={`Back to ${backLabel.toLowerCase()}`}
          className="floating-app-nav__back"
          data-qa="app-back"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          <span>{backLabel}</span>
        </button>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ y: 0 }}
            className="floating-app-nav__current"
            exit={reducedMotion ? undefined : { y: -8 }}
            initial={reducedMotion ? false : { y: 8 }}
            key={currentLabel}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <span aria-hidden="true" className="floating-app-nav__mark" />
            {currentLabel}
          </motion.span>
        </AnimatePresence>
        <button
          aria-label="Go home"
          className="floating-app-nav__home"
          data-qa="brand-home"
          onClick={onHome}
          type="button"
        >
          <Home aria-hidden="true" size={17} />
        </button>
      </motion.nav>
    </div>
  );
}
