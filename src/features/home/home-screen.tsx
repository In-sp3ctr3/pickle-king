"use client";

import { ActionButton } from "@/src/shared/ui";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { HomeBracketVisual } from "./home-bracket-visual";

export interface HomeScreenProps {
  onStartTournament: () => void;
  onQuickMatch: () => void;
  onResume?: () => void;
  resumeLabel?: string;
}

export function HomeScreen({
  onStartTournament,
  onQuickMatch,
  onResume,
  resumeLabel = "Resume tournament",
}: HomeScreenProps) {
  return (
    <main className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-12 lg:items-center lg:gap-14 lg:py-24">
      <section className="lg:col-span-7">
        <p className="mb-5 text-xs font-extrabold tracking-[0.2em] text-[#c8ff3d] uppercase">
          One court · One crown
        </p>
        <h1 className="max-w-[9ch] text-[clamp(4rem,11vw,9.5rem)] leading-[0.8] font-black tracking-[-0.07em] uppercase">
          Run the court.
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-[#9da494] sm:text-lg">
          Seed the crew, protect rest time, and keep every match moving before
          the booking ends.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionButton
            className="sm:min-w-56"
            data-qa="start-tournament"
            onClick={onStartTournament}
          >
            Start tournament
            <ArrowRight aria-hidden="true" size={19} strokeWidth={2.5} />
          </ActionButton>
          <ActionButton
            className="sm:min-w-44"
            data-qa="quick-match"
            onClick={onQuickMatch}
            variant="secondary"
          >
            <Play aria-hidden="true" size={18} fill="currentColor" />
            Quick match
          </ActionButton>
          {onResume ? (
            <ActionButton
              className="sm:min-w-52"
              data-qa="resume-tournament"
              onClick={onResume}
              variant="quiet"
            >
              <RotateCcw aria-hidden="true" size={18} />
              {resumeLabel}
            </ActionButton>
          ) : null}
        </div>

        <p className="mt-7 text-xs font-bold tracking-[0.12em] text-[#737b6c] uppercase">
          Private by default · Works courtside · No account
        </p>
      </section>

      <section className="lg:col-span-5" aria-label="How Pickle King works">
        <HomeBracketVisual />
      </section>
    </main>
  );
}
