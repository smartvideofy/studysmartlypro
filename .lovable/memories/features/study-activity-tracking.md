---
name: Study Activity Tracking
description: Server-authoritative XP/streak/achievement engine via record-activity. Six activity types, per-material-per-day caps, idempotent via event_id.
type: feature
---

# Study Activity Tracking

All XP, streak, and achievement updates flow through the `record-activity` edge function. Clients (web + mobile) only emit events. Direct writes to `profiles.xp` from clients are tolerated only during the mobile rollout window.

## Activity types
- `flashcard_review` — batched per session (one call at session end)
- `quiz` — fires when ALL questions answered
- `notes_read`, `summary_read` — fire on dwell ≥30s OR scroll-to-end
- `concept_map` — fires on dwell/interaction
- `tutor_chat` — fires on first user message of a session

## XP table
- `flashcard_review`: `15 * correct + 5 * (items - correct)`. No daily cap (cards self-limit via SRS due dates).
- `quiz`: `10 * correct + 20` on first attempt per (user, material, day); 0 thereafter (streak still rolls).
- `notes_read`, `summary_read`: 10 first time per (user, material, day); 0 thereafter.
- `concept_map`, `tutor_chat`: 5 first time per (user, material, day); 0 thereafter.

## Idempotency
Clients pass an `event_id` (uuid). Server uniqueness on `(user_id, event_id)` — duplicates return the prior `xp_awarded` and do not re-grant.

## Storage
- `study_activity` table — append-only (no UPDATE/DELETE grant to authenticated).
- `study_activity_v` view — UNION of `study_activity` + `study_sessions` (with `activity_type='flashcard_review'`). Read this for all progress aggregations.

## Achievement re-check
Runs inline on every `record-activity` call. Uses:
- streaks → `profiles.current_streak` (set inside this call)
- cards → SUM(`cards_or_items`) from `study_activity_v` WHERE `activity_type='flashcard_review'`
- study_time → SUM(`duration_seconds`)/60 from `study_activity_v`
- mastery → COUNT of `flashcards` with `interval_days >= 21` across user's decks

## Critical rule
NO DUAL-WRITE. Once the web/mobile clients adopt `record-activity`, they must stop inserting `study_sessions` for new flashcard reviews. Historical `study_sessions` rows stay (the view reads them, counted once).
