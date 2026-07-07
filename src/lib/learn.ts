// Adaptive "Learn" mode engine — Quizlet-style mastery loop.
// Ported from mobile (v66). Pure, serializable, framework-free.

export interface LearnCard {
  id: string;
  front: string;
  back: string;
}

export type PromptMode = 'mcq' | 'typed';

export interface LearnPrompt {
  cardId: string;
  front: string;
  answer: string;
  mode: PromptMode;
  choices: string[];
}

export interface LearnState {
  cards: LearnCard[];
  progress: Record<string, number>;
  queue: string[];
  round: number;
  target: number;
}

export const MASTERY_TARGET = 2;
export const MIN_CARDS_FOR_MCQ = 4;
const REQUEUE_GAP = 2;
const MCQ_CHOICES = 4;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkTypedAnswer(input: string, answer: string): boolean {
  const a = normalizeAnswer(input);
  return a.length > 0 && a === normalizeAnswer(answer);
}

export function initLearnSession(
  cards: LearnCard[],
  rng: () => number = Math.random,
  target: number = MASTERY_TARGET,
): LearnState {
  const valid = cards.filter((c) => c.front.trim() && c.back.trim());
  const progress: Record<string, number> = {};
  for (const c of valid) progress[c.id] = 0;
  const queue = shuffle(valid.map((c) => c.id), rng);
  return { cards: valid, progress, queue, round: 1, target };
}

export function masteredCount(state: LearnState): number {
  return state.cards.filter((c) => (state.progress[c.id] ?? 0) >= state.target).length;
}

export function isComplete(state: LearnState): boolean {
  return state.cards.length > 0 && masteredCount(state) === state.cards.length;
}

export function buildChoices(
  state: LearnState,
  cardId: string,
  rng: () => number = Math.random,
  count: number = MCQ_CHOICES,
): string[] {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return [];
  const answer = card.back;
  const pool = shuffle(
    state.cards.filter((c) => c.id !== cardId).map((c) => c.back),
    rng,
  );
  const choices: string[] = [answer];
  for (const back of pool) {
    if (choices.length >= count) break;
    if (!choices.includes(back)) choices.push(back);
  }
  return shuffle(choices, rng);
}

export function currentPrompt(
  state: LearnState,
  rng: () => number = Math.random,
): LearnPrompt | null {
  const cardId = state.queue[0];
  if (!cardId) return null;
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return null;
  const streak = state.progress[cardId] ?? 0;
  const canMcq = state.cards.length >= MIN_CARDS_FOR_MCQ;
  const mode: PromptMode = streak === 0 && canMcq ? 'mcq' : 'typed';
  const choices = mode === 'mcq' ? buildChoices(state, cardId, rng) : [];
  return { cardId, front: card.front, answer: card.back, mode, choices };
}

export function answer(state: LearnState, correct: boolean): LearnState {
  const [cardId, ...rest] = state.queue;
  if (!cardId) return state;

  const progress = { ...state.progress };
  let queue = rest;
  const cur = progress[cardId] ?? 0;

  if (correct) {
    progress[cardId] = Math.min(state.target, cur + 1);
  } else {
    progress[cardId] = 0;
    const pos = Math.min(REQUEUE_GAP, queue.length);
    queue = [...queue.slice(0, pos), cardId, ...queue.slice(pos)];
  }

  if (queue.length === 0) {
    const remaining = state.cards
      .map((c) => c.id)
      .filter((id) => (progress[id] ?? 0) < state.target);
    if (remaining.length > 0) {
      return { ...state, progress, queue: remaining, round: state.round + 1 };
    }
    return { ...state, progress, queue: [] };
  }

  return { ...state, progress, queue };
}
