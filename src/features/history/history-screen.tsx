"use client";

import { AlertTriangle, Share2, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import type { SessionHistoryV1 } from "../../history";
import {
  bracketShareCanvas,
  quickShareCanvas,
  ShareImageDialog,
  type ShareImageRequest,
} from "../share";

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
}: {
  history: SessionHistoryV1;
  recoveryMessage: string | null;
  onRemove: (id: string, kind: "quick" | "tournament") => void;
  onReset: () => void;
}) {
  const [shareRequest, setShareRequest] = useState<ShareImageRequest | null>(
    null,
  );
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
        <section
          className="session-ledger"
          aria-labelledby="quick-history-title"
        >
          <h2 id="quick-history-title">Quick Matches</h2>
          {history.quickMatches.map((match) => (
            <article className="session-ledger__row" key={match.id}>
              <div>
                <span>
                  {dateLabel(match.completedAt)} · {match.format}
                </span>
                <strong>
                  {match.labels.sideA}{" "}
                  <b>
                    {match.score.sideA}–{match.score.sideB}
                  </b>{" "}
                  {match.labels.sideB}
                </strong>
              </div>
              <div className="session-ledger__actions">
                <button
                  onClick={() =>
                    setShareRequest({
                      alt: `${match.labels.sideA} versus ${match.labels.sideB} final score`,
                      aspect: "portrait",
                      build: () => quickShareCanvas(match),
                      description: "Check the final score before sharing it.",
                      fileName: `pickle-king-${match.completedAt}.png`,
                      key: `quick:${match.id}`,
                      title: "Result preview",
                    })
                  }
                  type="button"
                >
                  <Share2 aria-hidden="true" size={18} /> Share
                </button>
                <button
                  aria-label="Remove match from history"
                  onClick={() => onRemove(match.id, "quick")}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
              </div>
            </article>
          ))}
        </section>
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
                    {item.bracket.players.length} players
                  </span>
                  <strong>{champion} took the crown</strong>
                </div>
                <div className="session-ledger__actions">
                  <button
                    onClick={() =>
                      setShareRequest({
                        alt: `${champion} tournament bracket`,
                        aspect: "landscape",
                        build: () => bracketShareCanvas(item.bracket),
                        description:
                          "Check the completed draw before sharing it.",
                        fileName: `pickle-king-bracket-${item.completedAt}.png`,
                        key: `tournament:${item.id}`,
                        title: "Bracket preview",
                      })
                    }
                    type="button"
                  >
                    <Share2 aria-hidden="true" size={18} /> Share
                  </button>
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
    </main>
  );
}
