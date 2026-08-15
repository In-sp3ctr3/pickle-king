"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScoringState } from "../../match/types";
import {
  speakScoreAnnouncement,
  stopScoreAnnouncement,
} from "./match-feedback";

const SCORE_MUTED_KEY = "pickle-king:score-muted";

export function ScoreSoundToggle({ scorer }: { scorer: ScoringState }) {
  const [muted, setMuted] = useState(false);
  const previousAnnouncement = useRef<string | null | undefined>(undefined);
  const previousScorer = useRef<ScoringState | null>(null);
  const finished = ["awaiting-confirmation", "complete"].includes(
    scorer.status,
  );
  const announcementKey = finished
    ? ["finished", scorer.scoreA, scorer.scoreB, scorer.winner].join(":")
    : scorer.service
      ? [
          scorer.scoreA,
          scorer.scoreB,
          scorer.service.servingTeam,
          scorer.service.serverId,
          scorer.service.turn,
        ].join(":")
      : null;

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const frame = requestAnimationFrame(() => {
      setMuted(window.localStorage.getItem(SCORE_MUTED_KEY) === "true");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const initial = previousAnnouncement.current === undefined;
    const previous = previousScorer.current;
    previousScorer.current = scorer;
    if (previousAnnouncement.current === announcementKey) return;
    previousAnnouncement.current = announcementKey;
    if (!initial && announcementKey && !muted) {
      speakScoreAnnouncement(scorer, previous);
    }
  }, [announcementKey, muted, scorer]);

  return (
    <button
      aria-label={
        muted ? "Unmute score announcements" : "Mute score announcements"
      }
      aria-pressed={muted}
      className="score-sound-toggle"
      data-qa="score-sound-toggle"
      onClick={() => {
        const next = !muted;
        setMuted(next);
        window.localStorage.setItem(SCORE_MUTED_KEY, String(next));
        if (next) stopScoreAnnouncement();
      }}
      type="button"
    >
      {muted ? (
        <VolumeX aria-hidden="true" size={20} />
      ) : (
        <Volume2 aria-hidden="true" size={20} />
      )}
    </button>
  );
}
