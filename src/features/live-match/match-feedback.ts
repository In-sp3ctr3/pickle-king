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

function isMatchPoint(scorer: ScoringState): boolean {
  if (!scorer.service) return false;
  const servingScore =
    scorer.service.servingTeam === "A" ? scorer.scoreA : scorer.scoreB;
  const receivingScore =
    scorer.service.servingTeam === "A" ? scorer.scoreB : scorer.scoreA;
  return (
    servingScore + 1 >= scorer.targetScore &&
    servingScore + 1 - receivingScore >= 2
  );
}

export function matchAnnouncement(
  previous: ScoringState | null,
  scorer: ScoringState,
): string | null {
  if (scorer.status === "awaiting-confirmation" && scorer.winner) {
    const winner = scorer.winner === "A" ? scorer.labelA : scorer.labelB;
    return `Game! The win goes to ${winner}, ${scorer.scoreA} to ${scorer.scoreB}.`;
  }
  const score = scoreAnnouncement(scorer);
  if (!score) return null;
  const calls = [];
  if (
    previous?.service &&
    previous.service.servingTeam !== scorer.service?.servingTeam
  ) {
    calls.push("That's a side out.");
  }
  if (isMatchPoint(scorer)) calls.push("Match point.");
  calls.push(`${score}.`);
  return calls.join(" ");
}

function preferredVoice(
  voices: SpeechSynthesisVoice[],
  locale: string,
): SpeechSynthesisVoice | undefined {
  const preferredNames = [
    "natural",
    "premium",
    "enhanced",
    "siri",
    "ava",
    "zoe",
    "serena",
    "aria",
    "jenny",
    "google",
  ];
  const language = locale.toLowerCase();
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .map((voice) => {
      const name = voice.name.toLowerCase();
      const preference = preferredNames.findIndex((value) =>
        name.includes(value),
      );
      const voiceLanguage = voice.lang.toLowerCase();
      const score =
        (preference < 0 ? 0 : 100 - preference) +
        (voiceLanguage === language ? 20 : 0) +
        (voiceLanguage.split("-")[0] === language.split("-")[0] ? 10 : 0) +
        (voice.localService ? 2 : 0) +
        (voice.default ? 1 : 0);
      return { score, voice };
    })
    .sort((left, right) => right.score - left.score)[0]?.voice;
}

export function stopScoreAnnouncement(): void {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

export function speakScoreAnnouncement(
  scorer: ScoringState,
  previous: ScoringState | null = null,
): void {
  const message = previous
    ? matchAnnouncement(previous, scorer)
    : scoreAnnouncement(scorer);
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
    const utterance = new SpeechSynthesisUtterance(message);
    const voice = preferredVoice(
      window.speechSynthesis.getVoices(),
      window.navigator.language,
    );
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 1.03;
    utterance.pitch = 1.04;
    window.speechSynthesis.speak(utterance);
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
