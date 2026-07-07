// Study Preferences taxonomy — goals, experience levels, selection helpers.
// Ported from mobile. Aligns onboarding + Settings with a single source of truth.

import { subjectLabel } from './subjects';

export interface GoalOption {
  value: string;
  label: string;
  desc: string;
}

export const GOALS: GoalOption[] = [
  { value: 'exam',         label: 'Exam Prep',    desc: 'Studying for tests' },
  { value: 'professional', label: 'Professional', desc: 'New skills for work' },
  { value: 'personal',     label: 'Personal',     desc: 'Learning for fun' },
  { value: 'general',      label: 'General',      desc: 'Mixed learning' },
];

const GOAL_LABELS: Record<string, string> = Object.fromEntries(
  GOALS.map(g => [g.value, g.label]),
);

export function goalLabel(value: string | null | undefined): string {
  if (!value) return 'General';
  return GOAL_LABELS[value] ?? 'General';
}

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ExperienceOption {
  value: ExperienceLevel;
  label: string;
  desc: string;
}

export const EXPERIENCE_LEVELS: ExperienceOption[] = [
  { value: 'beginner',     label: 'Beginner',     desc: 'New to this material' },
  { value: 'intermediate', label: 'Intermediate', desc: "I've seen most of this before" },
  { value: 'advanced',     label: 'Advanced',     desc: 'I want to deepen mastery' },
];

const EXPERIENCE_LABELS: Record<string, string> = Object.fromEntries(
  EXPERIENCE_LEVELS.map(e => [e.value, e.label]),
);

export function experienceLabel(value: string | null | undefined): string {
  if (!value) return 'Intermediate';
  return EXPERIENCE_LABELS[value] ?? 'Intermediate';
}

export const MAX_PREF_SUBJECTS = 3;

export function toggleSubjectSelection(
  current: string[],
  slug: string,
  max: number = MAX_PREF_SUBJECTS,
): { next: string[]; limitReached: boolean } {
  if (current.includes(slug)) {
    return { next: current.filter(s => s !== slug), limitReached: false };
  }
  if (current.length >= max) {
    return { next: current, limitReached: true };
  }
  return { next: [...current, slug], limitReached: false };
}

export function subjectsSummary(slugs: string[] | null | undefined): string {
  const list = slugs ?? [];
  if (list.length === 0) return 'None yet';
  const labels = list.map(s => subjectLabel(s)).filter(Boolean);
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
}
