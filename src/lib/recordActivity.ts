import { supabase } from "@/integrations/supabase/client";

// Client for the server-authoritative `record-activity` edge function: the same contract the
// mobile app uses (see the mobile app's src/lib/recordActivity.ts). The server owns XP, streaks
// and achievements and writes study_activity, which the admin panel uses to count who studied.
//
//   POST functions/v1/record-activity
//   { activity_type, material_id?, deck_id?, duration_seconds, items_count, correct_count, event_id }
//
// Fire-and-forget: never throws, never blocks the UI.

export type ActivityType =
  | "flashcard_review"
  | "quiz"
  | "notes_read"
  | "summary_read"
  | "concept_map"
  | "tutor_chat";

export interface RecordActivityInput {
  activityType: ActivityType;
  materialId?: string | null;
  deckId?: string | null;
  durationSeconds?: number;
  itemsCount?: number;
  correctCount?: number;
  /** Stable id for idempotent retries; generated when omitted. */
  eventId?: string;
}

function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

const whole = (n: number | undefined) => Math.max(0, Math.round(n ?? 0));

/** Records one study activity. Returns true if the server accepted it. */
export async function recordActivity(input: RecordActivityInput): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("record-activity", {
      body: {
        activity_type: input.activityType,
        material_id: input.materialId ?? null,
        deck_id: input.deckId ?? null,
        duration_seconds: whole(input.durationSeconds),
        items_count: whole(input.itemsCount),
        correct_count: whole(input.correctCount),
        event_id: input.eventId ?? newEventId(),
      },
    });
    if (error && import.meta.env.DEV) console.warn("[recordActivity]", error.message);
    return !error;
  } catch {
    return false;
  }
}

const today = () => new Date().toISOString().slice(0, 10);
const storeKey = (type: string, materialId: string) => `studily:act:${type}:${materialId}`;

/**
 * For passive activities (reading notes/summary/map, tutor chat): record at most once per
 * material per day. Marked only after a successful call, so a failed one is retried next time.
 */
export async function emitDailyActivity(input: RecordActivityInput): Promise<void> {
  const materialId = input.materialId;
  if (!materialId) {
    await recordActivity(input);
    return;
  }
  const key = storeKey(input.activityType, materialId);
  try {
    if (localStorage.getItem(key) === today()) return;
  } catch {
    // storage unavailable: the server caps XP anyway
  }
  if (await recordActivity(input)) {
    try {
      localStorage.setItem(key, today());
    } catch {
      // best effort
    }
  }
}

/** Which reading activity a material workspace tab counts as, if any. */
export function readingActivityForTab(tab: string): ActivityType | null {
  switch (tab) {
    case "tutor-notes":
      return "notes_read";
    case "summaries":
      return "summary_read";
    case "concept-map":
      return "concept_map";
    default:
      return null;
  }
}

/** Seconds a reading tab must stay open before it counts as studied (matches the mobile app). */
export const READ_DWELL_SECONDS = 30;
