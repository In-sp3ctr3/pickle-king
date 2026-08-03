"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Player } from "../../tournament";
import { RatingSelect } from "../setup/rating-select";

type EditablePlayer = Omit<Player, "seed">;

export function BracketEditorDialog({
  hasStarted,
  onClose,
  onSave,
  players,
}: {
  hasStarted: boolean;
  onClose: () => void;
  onSave: (players: EditablePlayer[], structural: boolean) => void;
  players: Player[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initial = useMemo(
    () => players.map(({ id, name, rating }) => ({ id, name, rating })),
    [players],
  );
  const [draft, setDraft] = useState<EditablePlayer[]>(initial);
  const [message, setMessage] = useState("");
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);
  const structural =
    draft.length !== initial.length ||
    draft.some(
      (player, index) =>
        player.id !== initial[index]?.id ||
        player.rating !== initial[index]?.rating,
    );

  function update(id: string, changes: Partial<EditablePlayer>) {
    setDraft((current) =>
      current.map((player) =>
        player.id === id ? { ...player, ...changes } : player,
      ),
    );
    setMessage("");
  }

  function save() {
    const trimmed = draft.map((player) => ({
      ...player,
      name: player.name.trim(),
    }));
    if (trimmed.length < 4 || trimmed.length > 16) {
      setMessage("A tournament needs between 4 and 16 players.");
      return;
    }
    if (trimmed.some(({ name }) => !name || name.length > 40)) {
      setMessage("Every player needs a name between 1 and 40 characters.");
      return;
    }
    const names = trimmed.map(({ name }) => name.toLocaleLowerCase());
    if (new Set(names).size !== names.length) {
      setMessage("Every player needs a unique name.");
      return;
    }
    onSave(trimmed, structural);
  }

  return (
    <dialog
      aria-labelledby="draw-editor-title"
      className="draw-editor"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      <header>
        <div>
          <p className="eyebrow">Tournament field</p>
          <h2 id="draw-editor-title">Edit the draw.</h2>
        </div>
        <button aria-label="Close draw editor" onClick={onClose} type="button">
          <X aria-hidden="true" />
        </button>
      </header>
      <div
        className={`draw-editor__impact ${structural ? "is-structural" : ""}`}
      >
        <strong>
          {structural ? "This changes the field" : "Name corrections are safe"}
        </strong>
        <span>
          {structural
            ? hasStarted
              ? "A single forgotten player can use late-entry repair. Other field changes rebuild the bracket."
              : "Saving will reseed the bracket before play begins."
            : "Player identity and every completed score stay intact."}
        </span>
      </div>
      <div className="draw-editor__players">
        {draft.map((player, index) => (
          <div className="draw-editor__row" key={player.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <label>
              <span>Name</span>
              <input
                maxLength={40}
                onChange={(event) =>
                  update(player.id, { name: event.target.value })
                }
                value={player.name}
              />
            </label>
            <label>
              <span>Rating</span>
              <RatingSelect
                id={`edit-rating-${player.id}`}
                invalid={false}
                onChange={(rating) => update(player.id, { rating })}
                value={player.rating}
              />
            </label>
            <button
              aria-label={`Remove ${player.name || `player ${index + 1}`}`}
              disabled={draft.length <= 4}
              onClick={() =>
                setDraft((current) =>
                  current.filter(({ id }) => id !== player.id),
                )
              }
              type="button"
            >
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>
      <button
        className="draw-editor__add"
        disabled={draft.length >= 16}
        onClick={() =>
          setDraft((current) => [
            ...current,
            { id: `player-${crypto.randomUUID()}`, name: "", rating: "3.5" },
          ])
        }
        type="button"
      >
        <Plus aria-hidden="true" size={19} /> Add forgotten player
      </button>
      {message ? (
        <p className="draw-editor__error" role="alert">
          {message}
        </p>
      ) : null}
      <footer>
        <button className="secondary-button" onClick={onClose} type="button">
          Cancel
        </button>
        <button
          className={
            structural && hasStarted ? "danger-button" : "primary-button"
          }
          onClick={save}
          type="button"
        >
          {structural ? "Review draw change" : "Save names"}
        </button>
      </footer>
    </dialog>
  );
}
