"use client";

import { useState } from "react";
import type { QuickMatchRecord } from "../../history";
import type { ScoringState } from "../../match/types";
import {
  DEFAULT_SHARE_FORMAT,
  quickShareCanvas,
  ShareImageDialog,
  type ShareImageRequest,
} from "../share";
import { ResultSavedDialog } from "./result-saved-dialog";

export interface ConfirmedResultSnapshot {
  continueLabel: string;
  input: QuickMatchRecord | ScoringState;
  key: string;
}

export function RecentResultHandoff({
  onDismiss,
  result,
}: {
  onDismiss: () => void;
  result: ConfirmedResultSnapshot;
}) {
  const [sharing, setSharing] = useState(false);
  const request: ShareImageRequest = {
    alt: `${winnerName(result.input)} final score`,
    aspect: "portrait",
    build: (format, style = "poster") =>
      quickShareCanvas(
        result.input,
        format === "landscape" ? DEFAULT_SHARE_FORMAT : format,
        style,
      ),
    fileName: "pickle-king-score-result.png",
    formats: ["story", "feed"],
    initialFormat: DEFAULT_SHARE_FORMAT,
    key: result.key,
    styles: ["poster", "frame", "receipt"],
    title: "Share result",
  };

  return sharing ? (
    <ShareImageDialog onClose={() => setSharing(false)} request={request} />
  ) : (
    <ResultSavedDialog
      continueLabel={result.continueLabel}
      onClose={onDismiss}
      onContinue={onDismiss}
      onShare={() => setSharing(true)}
      score={resultScore(result.input)}
      winnerName={winnerName(result.input)}
    />
  );
}

function winnerName(input: QuickMatchRecord | ScoringState) {
  if (input.winner === "A")
    return "labels" in input ? input.labels.sideA : input.labelA;
  return "labels" in input ? input.labels.sideB : input.labelB;
}

function resultScore(input: QuickMatchRecord | ScoringState) {
  return "score" in input
    ? `${input.score.sideA}–${input.score.sideB}`
    : `${input.scoreA}–${input.scoreB}`;
}
