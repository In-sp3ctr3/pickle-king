"use client";

import { Check, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PLAYER_NAME_MAX_LENGTH, type Match } from "@/src/tournament";

interface InlineScoreEditorProps {
  match: Match;
  onCancel: () => void;
  onSave: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerIdOverride?: string,
  ) => boolean;
  onRenamePlayer?: (playerId: string, name: string) => boolean;
  sideALabel: string;
  sideBLabel: string;
}

export function InlineScoreEditor({
  match,
  onCancel,
  onSave,
  onRenamePlayer,
  sideALabel,
  sideBLabel,
}: InlineScoreEditorProps) {
  const [scoreA, setScoreA] = useState(String(match.scoreA));
  const [scoreB, setScoreB] = useState(String(match.scoreB));
  const [nameA, setNameA] = useState(sideALabel);
  const [nameB, setNameB] = useState(sideBLabel);
  const [selectedWinner, setSelectedWinner] = useState(
    match.scoreA === match.scoreB ? (match.winnerId ?? "") : "",
  );
  const parsedA = parseScore(scoreA);
  const parsedB = parseScore(scoreB);
  const tied = parsedA !== null && parsedA === parsedB;
  const valid = parsedA !== null && parsedB !== null;
  const sideAId = match.sideA?.memberIds[0] ?? "";
  const sideBId = match.sideB?.memberIds[0] ?? "";
  const editingResult = match.status === "complete";
  const namesValid =
    Boolean(nameA.trim() && nameB.trim()) &&
    nameA.trim().toLocaleLowerCase() !== nameB.trim().toLocaleLowerCase();
  const canSave =
    namesValid && (!editingResult || (valid && (!tied || selectedWinner)));
  const resultChanged =
    editingResult &&
    valid &&
    (parsedA !== match.scoreA ||
      parsedB !== match.scoreB ||
      (tied && selectedWinner !== match.winnerId));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nameA.trim() || !nameB.trim() || nameA.trim() === nameB.trim()) return;
    const renamedA = onRenamePlayer && sideAId && nameA.trim() !== sideALabel;
    if (renamedA && !onRenamePlayer(sideAId, nameA.trim())) return;
    if (
      onRenamePlayer &&
      sideBId &&
      nameB.trim() !== sideBLabel &&
      !onRenamePlayer(sideBId, nameB.trim())
    ) {
      if (renamedA) onRenamePlayer(sideAId, sideALabel);
      return;
    }
    if (match.status !== "complete" || !resultChanged) return onCancel();
    if (!valid || parsedA === null || parsedB === null) return;
    const winnerOverride = tied ? selectedWinner || undefined : undefined;
    if (tied && !winnerOverride) return;
    if (onSave(match.id, parsedA, parsedB, winnerOverride)) onCancel();
  }

  return (
    <form className="inline-score-editor" onSubmit={submit}>
      <header>
        <p>
          {editingResult
            ? tied
              ? "Choose winner"
              : "Edit match"
            : "Edit players"}
        </p>
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
            disabled={!canSave}
            type="submit"
          >
            <Check aria-hidden="true" size={18} />
          </button>
        </div>
      </header>
      <ScoreEditRow
        label={sideALabel}
        name={nameA}
        onNameChange={setNameA}
        onChange={setScoreA}
        onSelectWinner={setSelectedWinner}
        playerId={sideAId}
        score={scoreA}
        showScore={editingResult}
        selectedWinner={selectedWinner}
        showWinnerChoice={editingResult && tied}
      />
      <ScoreEditRow
        label={sideBLabel}
        name={nameB}
        onNameChange={setNameB}
        onChange={setScoreB}
        onSelectWinner={setSelectedWinner}
        playerId={sideBId}
        score={scoreB}
        showScore={editingResult}
        selectedWinner={selectedWinner}
        showWinnerChoice={editingResult && tied}
      />
    </form>
  );
}

function ScoreEditRow({
  label,
  name,
  onChange,
  onNameChange,
  onSelectWinner,
  playerId,
  score,
  showScore,
  selectedWinner,
  showWinnerChoice,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSelectWinner: (playerId: string) => void;
  playerId: string;
  score: string;
  showScore: boolean;
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
      <input
        aria-label={`Player name for ${label}`}
        maxLength={PLAYER_NAME_MAX_LENGTH}
        onChange={(event) => onNameChange(event.target.value)}
        type="text"
        value={name}
      />
      {showScore ? (
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
      ) : null}
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
