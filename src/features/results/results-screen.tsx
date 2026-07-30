"use client";

import { ArrowLeft, Crown, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { calculateTournamentResult } from "../../tournament";
import type { TournamentBracket } from "../../tournament";

function roundName(round: number, total: number) {
  if (round === total) return "Final";
  if (round === total - 1) return "Semifinal";
  if (round === total - 2) return "Quarterfinal";
  return `Round ${round}`;
}

export function ResultsScreen({
  bracket,
  onHome,
  onCorrect,
}: {
  bracket: TournamentBracket;
  onHome: () => void;
  onCorrect: (matchId: string, scoreA: number, scoreB: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const result = calculateTournamentResult(bracket);
  const player = new Map(bracket.players.map((item) => [item.id, item]));
  const name = (id: string) => player.get(id)?.name ?? "Player";
  return (
    <main className="results-screen" data-qa="results">
      <button className="text-button" onClick={onHome} type="button">
        <ArrowLeft aria-hidden="true" size={18} /> Home
      </button>
      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="results-hero"
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      >
        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, -8, 6, 0] }}
          className="champion-crown"
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <Crown aria-hidden="true" />
        </motion.div>
        <p className="eyebrow">Tournament complete</p>
        <h1>{name(result.championId)} reigns.</h1>
        <p>
          Champion of the court—not a new official skill rating. The numbers
          below describe this tournament only.
        </p>
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
              <span>Player</span>
              <span>W–L</span>
              <span>For</span>
              <span>Against</span>
              <span>Diff</span>
            </div>
            {result.standings.map((standing) => (
              <div className="standings-row" key={standing.playerId} role="row">
                <strong>{name(standing.playerId)}</strong>
                <span>
                  {standing.wins}–{standing.losses}
                </span>
                <span>{standing.pointsFor}</span>
                <span>{standing.pointsAgainst}</span>
                <span>
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
                const scoreA = Number(
                  window.prompt(
                    "Correct score for the first side",
                    `${match.scoreA}`,
                  ),
                );
                const scoreB = Number(
                  window.prompt(
                    "Correct score for the second side",
                    `${match.scoreB}`,
                  ),
                );
                if (Number.isInteger(scoreA) && Number.isInteger(scoreB)) {
                  onCorrect(match.id, scoreA, scoreB);
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
