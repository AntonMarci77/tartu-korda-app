import type { CardState, Grade } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

export function newCardState(): CardState {
  return {
    box: 0,
    ease: 2.5,
    intervalDays: 0,
    dueDate: Date.now(), // due immediately
    lapses: 0,
    lastResult: null,
    seenCount: 0,
    correctCount: 0,
    lastReviewed: 0,
  };
}

/**
 * Leitner / SM-2-lite hybrid.
 * - "again" sends the card back to a short same-session interval and lowers ease.
 * - "hard" keeps ease ~constant, multiplies interval by 1.2.
 * - "good" applies the ease.
 * - "easy" applies ease * 1.3.
 *
 * On first successful review, jump straight to 1 day, then 3 days,
 * then ease-driven from there. This matches what a cramming student wants:
 * one good answer = "don't show me again today".
 */
export function applyGrade(prev: CardState | null, grade: Grade, now: number = Date.now()): CardState {
  const s: CardState = prev ? { ...prev } : newCardState();
  s.seenCount += 1;
  s.lastResult = grade;
  s.lastReviewed = now;

  if (grade === "again") {
    s.lapses += 1;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.intervalDays = 0;
    s.box = 0;
    s.dueDate = now + 10 * MIN; // re-show in same session
    return s;
  }

  s.correctCount += 1;
  s.box = Math.min(8, s.box + 1);

  if (grade === "hard") {
    s.ease = Math.max(1.3, s.ease - 0.05);
    if (s.intervalDays === 0) s.intervalDays = 1;
    else s.intervalDays = Math.max(1, Math.round(s.intervalDays * 1.2));
  } else if (grade === "good") {
    // Cold-start ladder: 0 -> 1 -> 3 -> ease-driven
    if (s.intervalDays === 0) s.intervalDays = 1;
    else if (s.intervalDays === 1) s.intervalDays = 3;
    else s.intervalDays = Math.round(s.intervalDays * s.ease);
  } else if (grade === "easy") {
    s.ease = s.ease + 0.1;
    if (s.intervalDays === 0) s.intervalDays = 3;
    else s.intervalDays = Math.round(s.intervalDays * s.ease * 1.3);
  }

  s.intervalDays = Math.min(s.intervalDays, 365);
  s.dueDate = now + s.intervalDays * DAY;
  return s;
}

export function isDue(state: CardState | null, now: number = Date.now()): boolean {
  if (!state) return true; // unseen card is implicitly due
  return state.dueDate <= now;
}

export function isWeak(state: CardState | null): boolean {
  if (!state) return false;
  if (state.lastResult === "again" || state.lastResult === "hard") return true;
  if (state.lapses >= 2) return true;
  const acc = state.seenCount > 0 ? state.correctCount / state.seenCount : 1;
  return state.seenCount >= 2 && acc < 0.6;
}

/**
 * mastery 0..1: combines seen-ness and recent grade.
 * unseen = 0; "again" recent = 0.1; "hard" = 0.5; "good" = 0.8; "easy" = 1.0
 * Adjusted by lapses (-0.05 each, floor 0) and seenCount (+0.05 per repeat above 1, cap +0.15).
 */
export function masteryScore(state: CardState | null): number {
  if (!state) return 0;
  let base = 0;
  switch (state.lastResult) {
    case "again":
      base = 0.1;
      break;
    case "hard":
      base = 0.5;
      break;
    case "good":
      base = 0.8;
      break;
    case "easy":
      base = 1.0;
      break;
    default:
      base = 0.3;
  }
  const repBonus = Math.min(0.15, Math.max(0, (state.seenCount - 1) * 0.05));
  const lapsePenalty = state.lapses * 0.05;
  return Math.max(0, Math.min(1, base + repBonus - lapsePenalty));
}
