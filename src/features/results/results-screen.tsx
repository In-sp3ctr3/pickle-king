"use client";

import { GitBranch, Medal, RotateCcw, Share2, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { calculateTournamentResult } from "../../tournament";
import type { TournamentBracket } from "../../tournament";
import { useState } from "react";
import { VictoryConfetti } from "../live-match/victory-confetti";
import { ReplayTournamentDialog } from "./replay-tournament-dialog";
import { TournamentShareDialog } from "./tournament-share-dialog";

function roundName(round: number, total: number) {
  if (round === total) return "Final";
  if (round === total - 1) return "Semifinal";
  if (round === total - 2) return "Quarterfinal";
  return `Round ${round}`;
}

export function ResultsScreen({
  bracket,
  onNewDraw,
  onReplaySame,
  onViewBracket,
}: {
  bracket: TournamentBracket;
  onNewDraw: () => void;
  onReplaySame: () => void;
  onViewBracket: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [showShare, setShowShare] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const result = calculateTournamentResult(bracket);
  const player = new Map(bracket.players.map((item) => [item.id, item]));
  const name = (id: string) => player.get(id)?.name ?? "Player";
  const champion = result.standings.find(
    ({ playerId }) => playerId === result.championId,
  )!;
  const final = result.matchHistory.find(
    ({ id }) => id === bracket.finalMatchId,
  )!;
  const championIsA = final.sideA?.memberIds.includes(result.championId);
  const winnerScore = championIsA ? final.scoreA : final.scoreB;
  const runnerUpScore = championIsA ? final.scoreB : final.scoreA;
  return (
    <main className="results-screen" data-qa="results">
      <motion.header
        animate={{ y: 0 }}
        className="results-hero"
        initial={reducedMotion ? false : { y: 24 }}
      >
        <VictoryConfetti className="results-hero__confetti" />
        <motion.div
          animate={reducedMotion ? undefined : { rotate: [0, -8, 6, 0] }}
          aria-label="Crowned pickleball champion mark"
          className="champion-mark"
          role="img"
          transition={{ delay: 0.3, duration: 0.7 }}
        />
        <p className="eyebrow">Tournament champion</p>
        <h1>{name(result.championId)} wins</h1>
        <div
          className="results-final-score"
          aria-label={`Final score ${winnerScore} to ${runnerUpScore}`}
        >
          <span>{winnerScore}</span>
          <i>–</i>
          <span>{runnerUpScore}</span>
        </div>
        <p className="results-final-opponent">
          Final · {name(result.championId)} over {name(result.runnerUpId)}
        </p>
        <div className="results-hero__record">
          <strong>
            {champion.wins}–{champion.losses} record
          </strong>
          <span>
            {champion.differential > 0 ? "+" : ""}
            {champion.differential} point differential
          </span>
        </div>
        <div className="results-hero__actions">
          <button
            className="primary-button results-share"
            data-qa="share-tournament"
            onClick={() => setShowShare(true)}
            type="button"
          >
            <Share2 aria-hidden="true" size={18} /> Share tournament
          </button>
          <button
            className="secondary-button results-share"
            data-qa="replay-tournament"
            onClick={() => setShowReplay(true)}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={18} /> Play again
          </button>
          <button
            className="text-button results-share"
            data-qa="view-final-bracket"
            onClick={onViewBracket}
            type="button"
          >
            <GitBranch aria-hidden="true" size={18} /> Review bracket
          </button>
        </div>
      </motion.header>
      <section aria-label="Podium" className="podium">
        <div className="podium-place second">
          <Medal
            aria-label="Silver medal"
            className="podium-medal podium-medal--silver"
          />
          <strong>{name(result.runnerUpId)}</strong>
          <small>Runner-up</small>
        </div>
        <div className="podium-place first">
          <Medal
            aria-label="Gold medal"
            className="podium-medal podium-medal--gold"
          />
          <strong>{name(result.championId)}</strong>
          <small>Champion</small>
        </div>
        <div className="podium-place third">
          <Medal
            aria-label="Bronze medal"
            className="podium-medal podium-medal--bronze"
          />
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
                    `${name(upset.winnerId)} defeated the No. ${player.get(upset.loserId)?.seed} seed`,
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
                : match.kind === "challenge"
                  ? "Late-entry challenge"
                  : roundName(match.round, bracket.roundCount)}
            </span>
            <strong>
              {name(match.sideA!.memberIds[0])} {match.scoreA}–{match.scoreB}{" "}
              {name(match.sideB!.memberIds[0])}
            </strong>
          </div>
        ))}
      </section>
      <p className="results-footnote">
        Ratings seed this draw only. These results reflect this tournament.
      </p>
      {showShare ? (
        <TournamentShareDialog
          bracket={bracket}
          onClose={() => setShowShare(false)}
        />
      ) : null}
      {showReplay ? (
        <ReplayTournamentDialog
          onClose={() => setShowReplay(false)}
          onNewDraw={onNewDraw}
          onSameDraw={onReplaySame}
        />
      ) : null}
    </main>
  );
}
