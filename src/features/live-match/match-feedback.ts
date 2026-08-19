import { isDoubles } from "../../match/service";
import type { ScoringState } from "../../match/types";

const ANNOUNCER_ROOT = "/audio/announcer";
const CONVERSATIONAL_SCORE_MAX = 21;

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

function conversationalScore(values: number[]): AnnouncementClip[] | null {
  if (values.length !== 2 && values.length !== 3) {
    return null;
  }
  const [servingScore, receivingScore] = values;
  const high = Math.max(servingScore, receivingScore);
  const supported =
    high <= 10 ||
    (high <= CONVERSATIONAL_SCORE_MAX &&
      Math.min(servingScore, receivingScore) >= 10 &&
      Math.abs(servingScore - receivingScore) <= 1);
  if (!supported) return null;
  const clips: AnnouncementClip[] = [
    {
      name: `chatterbox/scores/singles/${servingScore}-${receivingScore}`,
      pauseAfterMs: 0,
    },
  ];
  if (values.length === 3) {
    clips.push({ name: `chatterbox/server-${values[2]}`, pauseAfterMs: 0 });
  }
  return clips;
}

function hasConversationalGame(scores: number[]): boolean {
  const [winner, loser] = scores;
  return (
    (winner >= 2 && winner <= 11 && loser <= winner - 2) ||
    (winner >= 12 && winner <= 21 && loser === winner - 2)
  );
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
    if (hasConversationalGame(scores)) {
      return [
        {
          name: `chatterbox/game/${scores.join("-")}`,
          pauseAfterMs: 0,
        },
      ];
    }
    const finalScore = conversationalScore(scores);
    return finalScore
      ? [
          { name: "chatterbox/game-final-score", pauseAfterMs: 0 },
          ...finalScore,
        ]
      : [];
  }
  const score = conversationalScore(scoreValues(scorer)) ?? [];
  if (score.length === 0) return [];
  const sideOut = Boolean(
    previous?.service &&
    previous.service.servingTeam !== scorer.service?.servingTeam,
  );
  const matchPoint = isMatchPoint(scorer);
  if (sideOut && matchPoint) {
    return [
      { name: "chatterbox/side-out-match-point", pauseAfterMs: 120 },
      ...score,
    ];
  }
  const call = sideOut ? "side-out" : matchPoint ? "match-point" : null;
  return call
    ? [{ name: `chatterbox/${call}`, pauseAfterMs: 120 }, ...score]
    : score;
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
