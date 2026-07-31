import { ActionButton } from "@/src/shared/ui";
import type { Match, Player } from "@/src/tournament";
import { Clock3, Play } from "lucide-react";
import { matchSideLabel } from "./bracket-utils";

interface RunOfShowProps {
  matches: Match[];
  onStartMatch: (matchId: string) => void;
  players: Player[];
  sessionLabel?: string;
}

export function RunOfShow({
  matches,
  onStartMatch,
  players,
  sessionLabel,
}: RunOfShowProps) {
  const nextMatch = matches[0];
  if (!nextMatch) {
    return (
      <section
        aria-labelledby="run-of-show-title"
        className="rounded-[28px] bg-[#11150f] p-6 sm:p-8"
      >
        <p className="text-xs font-extrabold tracking-[0.16em] text-[#c8ff3d] uppercase">
          Run of show
        </p>
        <h2
          className="mt-3 text-3xl leading-none font-black uppercase"
          id="run-of-show-title"
        >
          Court complete.
        </h2>
        <p className="mt-3 text-[#9da494]">
          Every scheduled match has a result.
        </p>
      </section>
    );
  }

  const sideA = matchSideLabel(nextMatch.sideA?.memberIds, players);
  const sideB = matchSideLabel(nextMatch.sideB?.memberIds, players);
  const isReady = nextMatch.status === "ready";
  const isLive = nextMatch.status === "live";

  return (
    <section
      aria-labelledby="run-of-show-title"
      className={`grid gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)] ${
        isReady ? "bg-[#c8ff3d] text-[#090b08]" : "rounded-[28px] bg-[#11150f]"
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p
            className={`text-xs font-extrabold tracking-[0.16em] uppercase ${
              isReady ? "text-[#415311]" : "text-[#c8ff3d]"
            }`}
          >
            {isLive ? "Live on court" : isReady ? "Ready to play" : "Up next"}
          </p>
          {sessionLabel ? (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                isReady ? "text-[#415311]" : "text-[#9da494]"
              }`}
            >
              <Clock3 aria-hidden="true" size={15} />
              {sessionLabel}
            </span>
          ) : null}
        </div>
        <h2
          aria-label={`${sideA} versus ${sideB}`}
          className="mt-4 text-[clamp(2.1rem,5.4vw,4.2rem)] leading-[0.95] font-extrabold tracking-normal uppercase"
          id="run-of-show-title"
        >
          {sideA}
          <span
            className={`mx-2 align-middle text-base tracking-normal ${
              isReady ? "text-[#536b16]" : "text-[#737b6c]"
            }`}
          >
            vs
          </span>
          {sideB}
        </h2>
        {isReady ? (
          <ActionButton
            className="mt-6"
            data-qa="start-next"
            onClick={() => onStartMatch(nextMatch.id)}
            variant="inverse"
          >
            <Play aria-hidden="true" fill="currentColor" size={18} />
            Start next match
          </ActionButton>
        ) : null}
      </div>

      <ol
        aria-label="Upcoming match order"
        className={`divide-y ${
          isReady ? "divide-[#789f1a]/60" : "divide-[#2b3227]"
        }`}
      >
        {matches.slice(0, 4).map((match, index) => (
          <li
            className="grid min-h-12 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-2 text-sm"
            key={match.id}
          >
            <span className="font-black tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 truncate font-bold">
              {matchSideLabel(match.sideA?.memberIds, players)} vs{" "}
              {matchSideLabel(match.sideB?.memberIds, players)}
            </span>
            <span className="text-[0.65rem] font-extrabold tracking-[0.1em] uppercase">
              {index === 0 && match.status === "ready"
                ? "next"
                : match.status === "ready"
                  ? "queued"
                  : match.status}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
