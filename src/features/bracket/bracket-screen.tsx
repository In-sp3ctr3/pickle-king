"use client";

import { ActionButton } from "@/src/shared/ui";
import {
  getNextMatch,
  getReadySchedule,
  type TournamentBracket,
} from "@/src/tournament";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState, type TouchEvent } from "react";
import {
  initialRound,
  matchSideLabel,
  orderedRunOfShow,
  roundLabel,
} from "./bracket-utils";
import { MatchCard } from "./match-card";
import { RunOfShow } from "./run-of-show";

export interface BracketScreenProps {
  bracket: TournamentBracket;
  onCorrectMatch: (matchId: string) => void;
  onStartMatch: (matchId: string) => void;
  sessionLabel?: string;
  timingWarning?: string;
}

export function BracketScreen({
  bracket,
  onCorrectMatch,
  onStartMatch,
  sessionLabel,
  timingWarning,
}: BracketScreenProps) {
  const rounds = useMemo(
    () =>
      Array.from(new Set(bracket.matches.map((match) => match.round))).sort(
        (left, right) => left - right,
      ),
    [bracket.matches],
  );
  const [selectedRound, setSelectedRound] = useState(() =>
    initialRound(bracket),
  );
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();
  const nextMatch = getNextMatch(bracket);
  const readySchedule = getReadySchedule(bracket);
  const runOfShow = [
    ...readySchedule,
    ...orderedRunOfShow(bracket.matches).filter(
      (match) => !readySchedule.some(({ id }) => id === match.id),
    ),
  ];
  const activeRound = rounds.includes(selectedRound)
    ? selectedRound
    : (rounds[0] ?? selectedRound);
  const selectedIndex = Math.max(0, rounds.indexOf(activeRound));
  const matchesForRound = bracket.matches
    .filter((match) => match.round === activeRound)
    .toSorted((left, right) => {
      if (left.kind !== right.kind) return left.kind === "elimination" ? -1 : 1;
      return left.ordinal - right.ordinal;
    });

  function selectRelativeRound(direction: -1 | 1) {
    const nextRound = rounds[selectedIndex + direction];
    if (nextRound) setSelectedRound(nextRound);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (startX === null || endX === undefined) return;
    const distance = endX - startX;
    if (Math.abs(distance) < 40) return;
    selectRelativeRound(distance < 0 ? 1 : -1);
  }

  const currentRoundLabel = roundLabel(activeRound, bracket.roundCount);
  const completeCount = bracket.matches.filter(
    (match) => match.status === "complete",
  ).length;

  return (
    <main
      className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-10 sm:py-12"
      data-qa="bracket-screen"
    >
      <header className="mb-8 flex flex-col gap-5 border-b border-[#2b3227] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-extrabold tracking-[0.18em] text-[#c8ff3d] uppercase">
            <Trophy aria-hidden="true" size={17} />
            Tournament bracket
          </p>
          <h1 className="text-[clamp(3rem,8vw,6rem)] leading-[0.82] font-black tracking-[-0.055em] uppercase">
            Road to king.
          </h1>
        </div>
        <p className="text-sm font-bold text-[#9da494] tabular-nums">
          {completeCount} of {bracket.matches.length} matches final
        </p>
      </header>

      <RunOfShow
        matches={runOfShow}
        onStartMatch={onStartMatch}
        players={bracket.players}
        sessionLabel={sessionLabel}
      />
      {timingWarning ? (
        <p
          className="mt-3 border-l-2 border-[#ff7a4d] bg-[#21130f] px-4 py-3 text-sm font-bold text-[#ffb097]"
          role="status"
        >
          {timingWarning}
        </p>
      ) : null}

      <section aria-labelledby="bracket-round-title" className="mt-12">
        <div className="flex flex-col gap-4 border-b border-[#2b3227] pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.14em] text-[#737b6c] uppercase">
              Bracket view
            </p>
            <h2
              aria-live="polite"
              className="mt-2 text-3xl leading-none font-black uppercase"
              id="bracket-round-title"
            >
              {currentRoundLabel}
            </h2>
          </div>

          <div
            aria-label="Choose bracket round"
            className="flex max-w-full gap-2 overflow-x-auto pb-1"
            role="tablist"
          >
            {rounds.map((round) => {
              const isSelected = round === activeRound;
              return (
                <button
                  aria-controls="bracket-round-panel"
                  aria-selected={isSelected}
                  className={`min-h-12 shrink-0 rounded-[18px] px-4 text-xs font-extrabold tracking-[0.1em] uppercase transition-colors ${
                    isSelected
                      ? "bg-[#c8ff3d] text-[#090b08]"
                      : "border border-[#3b4436] bg-[#11150f] text-[#9da494] hover:border-[#9da494] hover:text-[#f5f3e9]"
                  }`}
                  id={`round-tab-${round}`}
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  role="tab"
                  type="button"
                >
                  {roundLabel(round, bracket.roundCount)}
                </button>
              );
            })}
          </div>
        </div>

        <div
          aria-labelledby={`round-tab-${activeRound}`}
          className="overflow-hidden py-6"
          id="bracket-round-panel"
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
          role="tabpanel"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="grid gap-5 md:grid-cols-2"
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
              key={activeRound}
              transition={{
                duration: reducedMotion ? 0.1 : 0.28,
                ease: "easeOut",
              }}
            >
              {matchesForRound.map((match) => (
                <MatchCard
                  canStart={match.id === nextMatch?.id}
                  key={match.id}
                  label={
                    match.kind === "bronze"
                      ? "Third-place match"
                      : `${currentRoundLabel} · Match ${match.ordinal}`
                  }
                  match={match}
                  onCorrectMatch={onCorrectMatch}
                  onStartMatch={onStartMatch}
                  sideALabel={matchSideLabel(
                    match.sideA?.memberIds,
                    bracket.players,
                  )}
                  sideBLabel={matchSideLabel(
                    match.sideB?.memberIds,
                    bracket.players,
                  )}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#2b3227] pt-5">
          <ActionButton
            aria-label={
              selectedIndex === 0
                ? "Already at the first round"
                : `Show ${roundLabel(
                    rounds[selectedIndex - 1] ?? activeRound,
                    bracket.roundCount,
                  )}`
            }
            disabled={selectedIndex === 0}
            onClick={() => selectRelativeRound(-1)}
            title={
              selectedIndex === 0 ? "Already at the first round" : undefined
            }
            variant="secondary"
          >
            <ChevronLeft aria-hidden="true" size={19} />
            <span className="hidden sm:inline">Previous round</span>
            <span className="sm:hidden">Previous</span>
          </ActionButton>
          <p className="text-xs font-extrabold tracking-[0.12em] text-[#737b6c] uppercase tabular-nums">
            {selectedIndex + 1} / {rounds.length}
          </p>
          <ActionButton
            aria-label={
              selectedIndex === rounds.length - 1
                ? "Already at the final round"
                : `Show ${roundLabel(
                    rounds[selectedIndex + 1] ?? activeRound,
                    bracket.roundCount,
                  )}`
            }
            disabled={selectedIndex === rounds.length - 1}
            onClick={() => selectRelativeRound(1)}
            title={
              selectedIndex === rounds.length - 1
                ? "Already at the final round"
                : undefined
            }
            variant="secondary"
          >
            <span className="hidden sm:inline">Next round</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight aria-hidden="true" size={19} />
          </ActionButton>
        </div>
      </section>
    </main>
  );
}
