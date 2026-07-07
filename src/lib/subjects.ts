// Subject taxonomy shared across onboarding, upload, materials filters, and
// Study Preferences in Settings. Ported from mobile — icons swapped to lucide names.

import {
  Leaf, FlaskConical, Atom, Calculator, Code2, Wrench, Stethoscope,
  Briefcase, Clock, Languages, ShieldCheck, BookOpen, MoreHorizontal,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface Subject {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const SUBJECTS: Subject[] = [
  { value: 'biology',           label: 'Biology',           icon: Leaf },
  { value: 'chemistry',         label: 'Chemistry',         icon: FlaskConical },
  { value: 'physics',           label: 'Physics',           icon: Atom },
  { value: 'math',              label: 'Math',              icon: Calculator },
  { value: 'computer_science',  label: 'Computer Science',  icon: Code2 },
  { value: 'engineering',       label: 'Engineering',       icon: Wrench },
  { value: 'medicine',          label: 'Medicine',          icon: Stethoscope },
  { value: 'business',          label: 'Business',          icon: Briefcase },
  { value: 'history',           label: 'History',           icon: Clock },
  { value: 'languages',         label: 'Languages',         icon: Languages },
  { value: 'law',               label: 'Law',               icon: ShieldCheck },
  { value: 'literature',        label: 'Literature',        icon: BookOpen },
  { value: 'other',             label: 'Other',             icon: MoreHorizontal },
];

const BY_SLUG = new Map(SUBJECTS.map(s => [s.value, s]));

export function subjectLabel(slug: string | null | undefined): string {
  if (!slug) return '';
  return BY_SLUG.get(slug)?.label ?? slug;
}

export function subjectIcon(slug: string | null | undefined): LucideIcon {
  return BY_SLUG.get(slug || '')?.icon ?? FileText;
}
