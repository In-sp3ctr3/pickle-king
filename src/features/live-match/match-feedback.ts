import { isDoubles } from "../../match/service";
import type { ScoringState } from "../../match/types";

export function scoreAnnouncement(scorer: ScoringState): string | null {
  const team = scorer.service?.servingTeam;
  if (!team || !scorer.service) return null;
  const scores =
    team === "A"
      ? [scorer.scoreA, scorer.scoreB]
      : [scorer.scoreB, scorer.scoreA];
  if (isDoubles(scorer, team)) {
    scores.push(scorer.service.turn === "first" ? 1 : 2);
  }
  return scores.join(", ");
}

export function stopScoreAnnouncement(): void {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

export function speakScoreAnnouncement(scorer: ScoringState): void {
  const message = scoreAnnouncement(scorer);
  if (
    !message ||
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof SpeechSynthesisUtterance === "undefined"
  ) {
    return;
  }
  try {
    stopScoreAnnouncement();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
  } catch {
    // The visible score remains available when speech is blocked.
  }
}

export function playBuzzer(): void {
  const Context = window.AudioContext;
  if (!Context) return;
  try {
    const context = new Context();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.frequency.setValueAtTime(660, context.currentTime + 0.16);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.42);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Visible result feedback remains available if audio is blocked.
  }
}
