"use client";

import { GitBranch, Medal, RotateCcw, Share2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { calculateTournamentResult } from "../../tournament";
import type { TournamentBracket } from "../../tournament";
import { useState } from "react";
import { MeasuredLabel } from "../../shared/ui";
import { VictoryConfetti } from "../live-match/victory-confetti";
import { ReplayTournamentDialog } from "./replay-tournament-dialog";
import { TournamentShareDialog } from "./tournament-share-dialog";
import { MatchHistory } from "./match-history";

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
  onNewDraw?: () => void;
  onReplaySame?: () => void;
  onViewBracket?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [showShare, setShowShare] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const result = calculateTournamentResult(bracket);
  const roundRobin = bracket.format === "round-robin-finals";
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
        <h1>
          <MeasuredLabel
            className="results-champion-name"
            maxSize={128}
            minSize={18}
            text={`${name(result.championId)} wins`}
          />
        </h1>
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
          {onReplaySame && onNewDraw ? (
            <button
              className="secondary-button results-share"
              data-qa="replay-tournament"
              onClick={() => setShowReplay(true)}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={18} /> Play again
            </button>
          ) : null}
          {onViewBracket ? (
            <button
              className="text-button results-share"
              data-qa="view-final-bracket"
              onClick={onViewBracket}
              type="button"
            >
              <GitBranch aria-hidden="true" size={18} /> Review{" "}
              {roundRobin ? "schedule" : "bracket"}
            </button>
          ) : null}
        </div>
      </motion.header>
      <section aria-label="Podium" className="podium">
        <div className="podium-place second">
          <Medal
            aria-label="Silver medal"
            className="podium-medal podium-medal--silver"
          />
          <strong>
            <MeasuredLabel
              maxSize={36}
              minSize={12}
              text={name(result.runnerUpId)}
            />
          </strong>
          <small>Runner-up</small>
        </div>
        <div className="podium-place first">
          <Medal
            aria-label="Gold medal"
            className="podium-medal podium-medal--gold"
          />
          <strong>
            <MeasuredLabel
              maxSize={36}
              minSize={12}
              text={name(result.championId)}
            />
          </strong>
          <small>Champion</small>
        </div>
        <div className="podium-place third">
          <Medal
            aria-label="Bronze medal"
            className="podium-medal podium-medal--bronze"
          />
          <strong>
            <MeasuredLabel
              maxSize={36}
              minSize={12}
              text={name(result.thirdPlaceId)}
            />
          </strong>
          <small>Third place</small>
        </div>
      </section>
      <section
        className={`results-grid${roundRobin ? "results-grid--round-robin" : ""}`}
      >
        <div>
          <h2>Player stats</h2>
          <StandingsTable name={name} standings={result.standings} />
        </div>
        <div>
          <h2>
            {roundRobin ? "Round-robin standings" : "How the field finished"}
          </h2>
          {roundRobin && result.preliminaryStandings ? (
            <StandingsTable
              name={name}
              standings={result.preliminaryStandings}
            />
          ) : (
            <div className="elimination-groups">
              {result.eliminationGroups.map((group) => (
                <section key={group.round}>
                  <p>{roundName(group.round, bracket.roundCount)}</p>
                  <strong>{group.playerIds.map(name).join(" · ")}</strong>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
      <MatchHistory bracket={bracket} name={name} />
      <p className="results-footnote">
        Results from this tournament only. Player ratings stay unchanged.
      </p>
      {showShare ? (
        <TournamentShareDialog
          bracket={bracket}
          onClose={() => setShowShare(false)}
        />
      ) : null}
      {showReplay && onNewDraw && onReplaySame ? (
        <ReplayTournamentDialog
          onClose={() => setShowReplay(false)}
          onNewDraw={onNewDraw}
          onSameDraw={onReplaySame}
          format={bracket.format}
        />
      ) : null}
    </main>
  );
}

function StandingsTable({
  name,
  standings,
}: {
  name: (id: string) => string;
  standings: ReturnType<typeof calculateTournamentResult>["standings"];
}) {
  return (
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
          <abbr className="results-header-short" title="Point differential">
            +/−
          </abbr>
        </span>
      </div>
      {standings.map((standing) => (
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
  );
}
