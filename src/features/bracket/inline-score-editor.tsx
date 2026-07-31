"use client";

import { Check, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Match } from "@/src/tournament";

interface InlineScoreEditorProps {
  match: Match;
  onCancel: () => void;
  onSave: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerIdOverride?: string,
  ) => boolean;
  sideALabel: string;
  sideBLabel: string;
}

export function InlineScoreEditor({
  match,
  onCancel,
  onSave,
  sideALabel,
  sideBLabel,
}: InlineScoreEditorProps) {
  const [scoreA, setScoreA] = useState(String(match.scoreA));
  const [scoreB, setScoreB] = useState(String(match.scoreB));
  const [selectedWinner, setSelectedWinner] = useState(
    match.scoreA === match.scoreB ? (match.winnerId ?? "") : "",
  );
  const parsedA = parseScore(scoreA);
  const parsedB = parseScore(scoreB);
  const tied = parsedA !== null && parsedA === parsedB;
  const valid = parsedA !== null && parsedB !== null;
  const sideAId = match.sideA?.memberIds[0] ?? "";
  const sideBId = match.sideB?.memberIds[0] ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || parsedA === null || parsedB === null) return;
    const winnerOverride = tied ? selectedWinner || undefined : undefined;
    if (tied && !winnerOverride) return;
    if (onSave(match.id, parsedA, parsedB, winnerOverride)) onCancel();
  }

  return (
    <form className="inline-score-editor" onSubmit={submit}>
      <header>
        <p>{tied ? "Choose the winner" : "Edit result"}</p>
        <div className="inline-score-editor__actions">
          <button
            aria-label="Cancel score edit"
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" size={17} />
          </button>
          <button
            aria-label="Save corrected score"
            disabled={!valid || (tied && !selectedWinner)}
            type="submit"
          >
            <Check aria-hidden="true" size={18} />
          </button>
        </div>
      </header>
      <ScoreEditRow
        label={sideALabel}
        onChange={setScoreA}
        onSelectWinner={setSelectedWinner}
        playerId={sideAId}
        score={scoreA}
        selectedWinner={selectedWinner}
        showWinnerChoice={tied}
      />
      <ScoreEditRow
        label={sideBLabel}
        onChange={setScoreB}
        onSelectWinner={setSelectedWinner}
        playerId={sideBId}
        score={scoreB}
        selectedWinner={selectedWinner}
        showWinnerChoice={tied}
      />
    </form>
  );
}

function ScoreEditRow({
  label,
  onChange,
  onSelectWinner,
  playerId,
  score,
  selectedWinner,
  showWinnerChoice,
}: {
  label: string;
  onChange: (value: string) => void;
  onSelectWinner: (playerId: string) => void;
  playerId: string;
  score: string;
  selectedWinner: string;
  showWinnerChoice: boolean;
}) {
  return (
    <div
      className="inline-score-editor__row"
      data-winner-choice={showWinnerChoice}
    >
      {showWinnerChoice ? (
        <label className="inline-score-editor__winner">
          <input
            aria-label={`Award ${label}`}
            checked={selectedWinner === playerId}
            name="corrected-winner"
            onChange={() => onSelectWinner(playerId)}
            type="radio"
            value={playerId}
          />
        </label>
      ) : null}
      <span>{label}</span>
      <input
        aria-label={`Score for ${label}`}
        inputMode="numeric"
        max="999"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        step="1"
        type="number"
        value={score}
      />
    </div>
  );
}

function parseScore(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 999
    ? parsed
    : null;
}
