"use client";

import { AlertTriangle, Eye, Share2, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import type { SessionHistoryV1 } from "../../history";
import type { TournamentBracket } from "../../tournament";
import { TournamentShareDialog } from "../results";
import {
  bracketShareCanvas,
  ShareImageDialog,
  type ShareImageRequest,
  tournamentShareContentKey,
} from "../share";
import { QuickMatchHistory } from "./quick-match-history";

function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

export function HistoryScreen({
  history,
  recoveryMessage,
  onRemove,
  onReset,
  onViewResults,
}: {
  history: SessionHistoryV1;
  recoveryMessage: string | null;
  onRemove: (id: string, kind: "quick" | "tournament") => void;
  onReset: () => void;
  onViewResults?: (id: string) => void;
}) {
  const [shareRequest, setShareRequest] = useState<ShareImageRequest | null>(
    null,
  );
  const [shareTournament, setShareTournament] =
    useState<TournamentBracket | null>(null);
  if (recoveryMessage) {
    return (
      <main className="history-screen" data-qa="history-screen">
        <AlertTriangle aria-hidden="true" size={38} />
        <p className="eyebrow">History recovery</p>
        <h1>Saved match history needs a reset.</h1>
        <p>{recoveryMessage} Your active tournament is still available.</p>
        <button className="primary-button" onClick={onReset} type="button">
          Reset match history
        </button>
      </main>
    );
  }
  const empty = !history.quickMatches.length && !history.tournaments.length;
  return (
    <main className="history-screen" data-qa="history-screen">
      <header className="history-screen__header">
        <div>
          <p className="eyebrow">On this device</p>
          <h1>Match ledger.</h1>
        </div>
        <p>
          {history.quickMatches.length} quick · {history.tournaments.length}{" "}
          tournaments
        </p>
      </header>
      <p className="history-screen__privacy">
        Recent results stay on this device. Share only the records you choose.
      </p>
      {empty ? (
        <section className="history-empty">
          <Trophy aria-hidden="true" size={32} />
          <h2>No final scores yet.</h2>
          <p>
            Confirm a Quick Match or finish a tournament and it will appear
            here.
          </p>
        </section>
      ) : null}
      {history.quickMatches.length ? (
        <QuickMatchHistory matches={history.quickMatches} onRemove={onRemove} />
      ) : null}
      {history.tournaments.length ? (
        <section
          className="session-ledger"
          aria-labelledby="tournament-history-title"
        >
          <h2 id="tournament-history-title">Completed tournaments</h2>
          {history.tournaments.map((item) => {
            const final = item.bracket.matches.find(
              ({ id }) => id === item.bracket.finalMatchId,
            );
            const champion =
              item.bracket.players.find(({ id }) => id === final?.winnerId)
                ?.name ?? "Champion";
            return (
              <article className="session-ledger__row" key={item.id}>
                <div>
                  <span>
                    {dateLabel(item.completedAt)} ·{" "}
                    {item.bracket.players.length} players ·{" "}
                    {item.bracket.format === "round-robin-finals"
                      ? "Round robin + finals"
                      : "Fast knockout"}
                  </span>
                  <strong>{champion} took the crown</strong>
                </div>
                <div className="session-ledger__actions">
                  {onViewResults ? (
                    <button
                      className="session-ledger__view"
                      onClick={() => onViewResults(item.id)}
                      type="button"
                    >
                      <Eye aria-hidden="true" size={18} /> View results
                    </button>
                  ) : null}
                  {item.bracket.format === "round-robin-finals" ? (
                    <button
                      data-qa="share-archived-results"
                      onClick={() => setShareTournament(item.bracket)}
                      type="button"
                    >
                      <Share2 aria-hidden="true" size={18} /> Share results
                    </button>
                  ) : (
                    <button
                      data-qa="share-archived-bracket"
                      onClick={() =>
                        setShareRequest({
                          alt: `${champion} tournament bracket`,
                          aspect: "landscape",
                          build: (format) =>
                            bracketShareCanvas(item.bracket, format),
                          fileName: `pickle-king-bracket-${item.completedAt}.png`,
                          formats: ["landscape", "feed", "story"],
                          initialFormat: "landscape",
                          inspectable: true,
                          key: `tournament:${item.id}:${tournamentShareContentKey(item.bracket)}`,
                          title: "Tournament bracket",
                        })
                      }
                      type="button"
                    >
                      <Share2 aria-hidden="true" size={18} /> Share bracket
                    </button>
                  )}
                  <button
                    aria-label="Remove tournament from history"
                    onClick={() => onRemove(item.id, "tournament")}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
      {shareRequest ? (
        <ShareImageDialog
          onClose={() => setShareRequest(null)}
          request={shareRequest}
        />
      ) : null}
      {shareTournament ? (
        <TournamentShareDialog
          bracket={shareTournament}
          onClose={() => setShareTournament(null)}
        />
      ) : null}
    </main>
  );
}
