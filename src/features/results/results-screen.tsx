"use client";

import { Crown, Share2, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { promptForCorrection } from "../../application/correction-prompt";
import { calculateTournamentResult } from "../../tournament";
import type { TournamentBracket } from "../../tournament";
import { useState } from "react";
import { bracketShareCanvas, shareCanvas } from "../share";

function roundName(round: number, total: number) {
  if (round === total) return "Final";
  if (round === total - 1) return "Semifinal";
  if (round === total - 2) return "Quarterfinal";
  return `Round ${round}`;
}

export function ResultsScreen({
  bracket,
  onCorrect,
}: {
  bracket: TournamentBracket;
  onCorrect: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerIdOverride?: string,
  ) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [shareStatus, setShareStatus] = useState("");
  const result = calculateTournamentResult(bracket);
  const player = new Map(bracket.players.map((item) => [item.id, item]));
  const name = (id: string) => player.get(id)?.name ?? "Player";
  return (
    <main className="results-screen" data-qa="results">
      <motion.header
        animate={{ y: 0 }}
        className="results-hero"
        initial={reducedMotion ? false : { y: 24 }}
      >
        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, -8, 6, 0] }}
          aria-label="Crowned pickleball champion mark"
          className="champion-mark"
          role="img"
          transition={{ delay: 0.3, duration: 0.7 }}
        />
        <p className="eyebrow">Tournament complete</p>
        <h1>{name(result.championId)} reigns.</h1>
        <p>
          Champion of the court—not a new official skill rating. The numbers
          below describe this tournament only.
        </p>
        <button
          className="primary-button results-share"
          data-qa="share-final-bracket"
          onClick={() =>
            void shareCanvas(
              bracketShareCanvas(bracket),
              "pickle-king-final-bracket.png",
              "Pickle King final bracket",
            )
              .then((outcome) =>
                setShareStatus(
                  outcome === "shared"
                    ? "Share sheet opened."
                    : outcome === "downloaded"
                      ? "Bracket image downloaded."
                      : "Sharing cancelled.",
                ),
              )
              .catch(() =>
                setShareStatus("The bracket image could not be shared."),
              )
          }
          type="button"
        >
          <Share2 aria-hidden="true" size={18} /> Share final bracket
        </button>
      </motion.header>
      <section aria-label="Podium" className="podium">
        <div className="podium-place second">
          <span>02</span>
          <strong>{name(result.runnerUpId)}</strong>
          <small>Runner-up</small>
        </div>
        <div className="podium-place first">
          <Crown aria-hidden="true" size={22} />
          <strong>{name(result.championId)}</strong>
          <small>Champion</small>
        </div>
        <div className="podium-place third">
          <span>03</span>
          <strong>{name(result.thirdPlaceId)}</strong>
          <small>Third place</small>
        </div>
      </section>
      <p aria-live="polite" className="share-status">
        {shareStatus}
      </p>
      {result.upsetWins.length ? (
        <section className="upset-strip" aria-labelledby="upsets-title">
          <Sparkles aria-hidden="true" />
          <div>
            <p className="eyebrow" id="upsets-title">
              Upset watch
            </p>
            <p>
              {result.upsetWins
                .map(
                  (upset) =>
                    `${name(upset.winnerId)} beat seed ${player.get(upset.loserId)?.seed}`,
                )
                .join(" · ")}
            </p>
          </div>
        </section>
      ) : null}
      <section className="results-grid">
        <div>
          <h2>Player stats</h2>
          <div className="standings-table" role="table">
            <div className="standings-row standings-head" role="row">
              <span role="columnheader">Player</span>
              <span role="columnheader">W–L</span>
              <span role="columnheader">For</span>
              <span role="columnheader">
                <span className="results-header-full">Against</span>
                <abbr className="results-header-short" title="Against">
                  PA
                </abbr>
              </span>
              <span role="columnheader">
                <span className="results-header-full">Diff</span>
                <abbr
                  className="results-header-short"
                  title="Point differential"
                >
                  +/−
                </abbr>
              </span>
            </div>
            {result.standings.map((standing) => (
              <div className="standings-row" key={standing.playerId} role="row">
                <strong role="cell">{name(standing.playerId)}</strong>
                <span role="cell">
                  {standing.wins}–{standing.losses}
                </span>
                <span role="cell">{standing.pointsFor}</span>
                <span role="cell">{standing.pointsAgainst}</span>
                <span role="cell">
                  {standing.differential > 0 ? "+" : ""}
                  {standing.differential}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>How the field finished</h2>
          <div className="elimination-groups">
            {result.eliminationGroups.map((group) => (
              <section key={group.round}>
                <p>{roundName(group.round, bracket.roundCount)}</p>
                <strong>{group.playerIds.map(name).join(" · ")}</strong>
              </section>
            ))}
          </div>
        </div>
      </section>
      <section className="match-history">
        <h2>Match history</h2>
        {result.matchHistory.map((match) => (
          <div className="history-row" key={match.id}>
            <span>
              {match.kind === "bronze"
                ? "Third place"
                : roundName(match.round, bracket.roundCount)}
            </span>
            <strong>
              {name(match.sideA!.memberIds[0])} {match.scoreA}–{match.scoreB}{" "}
              {name(match.sideB!.memberIds[0])}
            </strong>
            <button
              className="text-button"
              onClick={() => {
                const sideAId = match.sideA!.memberIds[0];
                const sideBId = match.sideB!.memberIds[0];
                const corrected = promptForCorrection({
                  currentScoreA: match.scoreA,
                  currentScoreB: match.scoreB,
                  currentWinnerId: match.winnerId,
                  prompt: (message, defaultValue) =>
                    window.prompt(message, defaultValue),
                  sideA: { id: sideAId, label: name(sideAId) },
                  sideB: { id: sideBId, label: name(sideBId) },
                });
                if (corrected) {
                  onCorrect(
                    match.id,
                    corrected.scoreA,
                    corrected.scoreB,
                    corrected.winnerIdOverride,
                  );
                }
              }}
              type="button"
            >
              Correct
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
