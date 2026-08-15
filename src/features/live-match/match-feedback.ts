import { isDoubles } from "../../match/service";
import type { ScoringState } from "../../match/types";

const ANNOUNCER_ROOT = "/audio/announcer/fenrir";
const NUMBER_CLIP_MAX = 109;

export interface AnnouncementClip {
  name: string;
  pauseAfterMs: number;
}

function scoreValues(scorer: ScoringState): number[] {
  const team = scorer.service?.servingTeam;
  if (!team || !scorer.service) return [];
  const scores =
    team === "A"
      ? [scorer.scoreA, scorer.scoreB]
      : [scorer.scoreB, scorer.scoreA];
  if (isDoubles(scorer, team)) {
    scores.push(scorer.service.turn === "first" ? 1 : 2);
  }
  return scores;
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

function numberClips(
  values: number[],
  scorer: ScoringState,
): AnnouncementClip[] {
  // ponytail: bundled clips cover real-world scores through 109; extend the
  // generated pack if Pickle King ever supports longer-format scoring.
  if (
    values.some(
      (value) =>
        !Number.isInteger(value) || value < 0 || value > NUMBER_CLIP_MAX,
    )
  ) {
    return [];
  }
  return values.map((value, index) => {
    const last = index === values.length - 1;
    const variation =
      (scorer.rallyHistory.length + index) % 2 === 0 ? "a" : "b";
    return {
      name:
        value <= 21
          ? `${last ? "end" : "continue"}-${variation}/${value}`
          : String(value),
      pauseAfterMs: 0,
    };
  });
}

export function announcementSequence(
  previous: ScoringState | null,
  scorer: ScoringState,
): AnnouncementClip[] {
  if (scorer.status === "awaiting-confirmation" && scorer.winner) {
    const scores =
      scorer.winner === "A"
        ? [scorer.scoreA, scorer.scoreB]
        : [scorer.scoreB, scorer.scoreA];
    const finalScores = numberClips(scores, scorer);
    if (finalScores.length !== 2) {
      return [{ name: "game", pauseAfterMs: 0 }];
    }
    const [winnerScore, loserScore] = finalScores;
    return [
      { name: "game", pauseAfterMs: 160 },
      { name: "final-score", pauseAfterMs: 140 },
      winnerScore,
      { name: "to", pauseAfterMs: 0 },
      loserScore,
    ];
  }
  const score = numberClips(scoreValues(scorer), scorer);
  if (score.length === 0) return [];
  const calls: AnnouncementClip[] = [];
  if (
    previous?.service &&
    previous.service.servingTeam !== scorer.service?.servingTeam
  ) {
    calls.push({ name: "side-out", pauseAfterMs: 160 });
  }
  if (isMatchPoint(scorer)) {
    calls.push({ name: "match-point", pauseAfterMs: 160 });
  }
  return [...calls, ...score];
}

let activeAudio: HTMLAudioElement | null = null;
let finishActiveClip: (() => void) | null = null;
let announcementRun = 0;

export function stopScoreAnnouncement(): void {
  announcementRun += 1;
  activeAudio?.pause();
  finishActiveClip?.();
  activeAudio = null;
  finishActiveClip = null;
}

function playClip(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(`${ANNOUNCER_ROOT}/${name}.mp3`);
    activeAudio = audio;
    audio.preload = "auto";
    let settled = false;
    const finish = (played: boolean) => {
      if (settled) return;
      settled = true;
      if (activeAudio === audio) activeAudio = null;
      if (finishActiveClip === cancel) finishActiveClip = null;
      resolve(played);
    };
    const cancel = () => finish(false);
    finishActiveClip = cancel;
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    void audio.play().catch(() => finish(false));
  });
}

export function playScoreAnnouncement(
  scorer: ScoringState,
  previous: ScoringState | null = null,
): void {
  const sequence = announcementSequence(previous, scorer);
  if (sequence.length === 0 || typeof Audio === "undefined") return;
  stopScoreAnnouncement();
  const run = announcementRun;
  void (async () => {
    for (const clip of sequence) {
      if (run !== announcementRun || !(await playClip(clip.name))) return;
      if (clip.pauseAfterMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, clip.pauseAfterMs));
      }
    }
  })();
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
