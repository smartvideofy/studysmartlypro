## Final agreed scope

Mobile confirmed all three answers and flagged three real issues. Plan now locks in:

**Decisions locked**
- XP table adopted verbatim, plus per-material-per-day cap on `quiz` (full XP first attempt/day; later same-day retakes grant 0 XP, still roll streak). "Quiz finish" = all questions answered.
- Achievement re-check fires on every `record-activity` call.
- SRS state preserved on regenerate only when **both** front and back match (normalized: trim + collapse whitespace). Any change to either field → fresh SRS state.

**Flags resolved**
1. **No dual-write.** Once `record-activity` ships, `useReviewFlashcard` stops writing `study_sessions`. New flashcard reviews live in `study_activity` with `activity_type='flashcard_review'`. Existing `study_sessions` rows stay as historical; the union view reads them once.
2. **Idempotency.** `record-activity` accepts optional `event_id uuid`; `study_activity` gets a `unique(user_id, event_id)` constraint; duplicates → `on conflict do nothing` + return existing row's awards.
3. **No feature flag.** Sequence: web ships steps 1–2 → mobile ships one release that cuts over and removes client-side award math. Server tolerates legacy clients still writing `profiles.xp` during rollout (no server-side rejection of direct xp writes).

## Plan

### 1. Migration — `study_activity` + view

```sql
create table public.study_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.study_materials(id) on delete set null,
  deck_id uuid references public.flashcard_decks(id) on delete set null,
  activity_type text not null check (activity_type in
    ('flashcard_review','quiz','notes_read','summary_read','concept_map','tutor_chat')),
  duration_seconds int not null default 0,
  items_count int not null default 0,
  correct_count int not null default 0,
  xp_awarded int not null default 0,
  event_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);
-- Grants: SELECT, INSERT to authenticated (append-only — no UPDATE/DELETE grant); ALL to service_role.
-- RLS: select own; insert own (with user_id = auth.uid()).
-- Indexes: (user_id, created_at desc); (user_id, activity_type, created_at desc); (user_id, material_id, activity_type, created_at).

create view public.study_activity_v
with (security_invoker = true) as
select user_id, created_at as occurred_at, duration_seconds,
       items_count as cards_or_items, correct_count, activity_type, material_id
from public.study_activity
union all
select user_id, started_at, total_time_seconds, cards_studied, correct_count,
       'flashcard_review' as activity_type, null::uuid as material_id
from public.study_sessions where ended_at is not null;
grant select on public.study_activity_v to authenticated;
```

### 2. Edge function — `record-activity` (`verify_jwt = false`, JWT validated in code)

Request:
```ts
{ activity_type: 'flashcard_review'|'quiz'|'notes_read'|'summary_read'|'concept_map'|'tutor_chat',
  material_id?: string, deck_id?: string,
  duration_seconds: number, items_count: number, correct_count: number,
  event_id?: string }
```

Server logic, in order:
1. Validate JWT via `getClaims`; zod-validate body.
2. If `event_id` provided and `(user_id, event_id)` already exists → return existing row's `{xp_awarded, already_recorded:true}`. No further mutation.
3. **XP calc** (server is the only authority):
   - `flashcard_review`: `15*correct_count + 5*(items_count - correct_count)`. No daily cap.
   - `quiz`: if a `quiz` row exists today for same `(user_id, material_id)` → `xp = 0`. Else `10*correct_count + 20`.
   - `notes_read|summary_read`: 10 if no row today for same `(user_id, material_id, activity_type)`, else 0.
   - `concept_map|tutor_chat`: 5 with same per-material-per-day cap.
4. Insert `study_activity` row with computed `xp_awarded` and `event_id`.
5. Streak roll-forward on `profiles`: if `last_study_date < today` advance `streak_days` (reset to 1 if gap > 1 day), set `last_study_date = today`.
6. `profiles.xp += xp_awarded`; recompute `level` (same formula as web `useAwardXP`).
7. Achievement re-check: load catalog + earned set; evaluate all 4 categories using aggregates from `study_activity_v` + `flashcards` (mastered = `interval_days >= 21`); insert any newly earned + their XP + notification rows.
8. Return `{ xp_awarded, new_level, newly_earned: [...] }`.

### 3. Auto-link decks on generation (Option A)

In `supabase/functions/process-material` (flashcards step) and `regenerate-content` (`contentType='flashcards'`):
1. After computing the new `material_flashcards` rows, upsert `flashcard_decks` by `(user_id, source_material_id)`:
   - Insert if missing (name = material title, `source_material_id = materialId`).
2. Load current `flashcards` for that deck. Build a map keyed by `normalize(front) + '\u0001' + normalize(back)` → existing SRS state.
3. For each new card, if key matches → carry over `ease_factor, interval_days, repetitions, next_review`. Otherwise insert with defaults.
4. Delete deck cards whose normalized key isn't in the new set.
5. `normalize(s) = s.trim().replace(/\s+/g, ' ')`.

Both `material_flashcards` and the linked deck are written every time, so the hub preview and the SRS deck stay in lockstep.

### 4. Backfill migration

For every `(user_id, material_id)` with rows in `material_flashcards` but no `flashcard_decks` row with that `source_material_id`: create the deck and copy `material_flashcards` → `flashcards` with default SRS state. Idempotent (skip if deck already exists).

### 5. Web client changes

- `useReviewFlashcard`: stop inserting `study_sessions` for new reviews. At session end, call `record-activity` once with batched `{ activity_type: 'flashcard_review', deck_id, items_count, correct_count, duration_seconds, event_id: uuid() }`. Existing offline queue keeps a single end-of-session payload.
- `useStudyStats` and Progress views: switch reads to `study_activity_v` (preserve existing shape via mapping).
- Emit `record-activity` calls from `SummariesTab`, `TutorNotesTab`, `ConceptMapTab`, `AIChatTab`, `PracticeQuestionsTab` per the rules above (notes/summary/concept on dwell ≥30s or scroll-to-end; tutor_chat on first user message of session; quiz on completing all questions).
- Remove client-side `useCheckAchievements` call sites and `useAwardXP` direct invocations. Keep the hooks file for now so the build doesn't break elsewhere; delete in a follow-up.
- Hub Flashcards "Study" CTA → linked deck SRS page.

### 6. Memory

- Update `mem://features/flashcard-engine-v2`: mastered = `interval_days >= 21` (canonical); generation auto-links a deck via `source_material_id`; regenerate preserves SRS only on exact normalized front+back match.
- New `mem://features/study-activity-tracking`: the 6 activity types, XP/caps table, `record-activity` is sole XP/streak/achievement writer, idempotent on `event_id`.
- Update `mem://features/gamification-system-v3`: XP/streak/achievement writes are server-side via `record-activity`; client hooks no longer mutate `profiles.xp`.

## Deploy order

1. Migration: `study_activity` + view + grants + indexes + unique(user_id, event_id).
2. `record-activity` edge function (idempotent, achievement re-check inline).
3. Web `useReviewFlashcard` cutover + emit calls from the 5 other tabs + Progress reads from view + remove client award math.
4. Backfill migration for linked decks.
5. Edit `process-material` + `regenerate-content` to upsert linked deck with SRS preservation.
6. Hub "Study" CTA → linked deck.
7. Notify mobile that `record-activity` is live for their cutover release.

## Out of scope

- Option B (merging `material_flashcards` into `flashcards`).
- New `xp`-category achievements.
- Removing `study_sessions` writes from any pre-existing non-flashcard caller (none today).
- Server-side rejection of direct `profiles.xp` writes (deferred until all mobile clients update).
---

## Execution log (this turn)

**Shipped server-side (mobile-unblocking):**
1. ✅ Migration: `study_activity` table + `study_activity_v` view + grants + indexes + `unique(user_id, event_id)`.
2. ✅ `record-activity` edge function (idempotent on `event_id`, in-code JWT validation, achievement re-check inline, server-side level/streak updates).
3. ✅ `process-material` flashcards step rewritten to use `upsertLinkedDeck` — preserves SRS state on exact normalized front+back match (both helper functions and legacy fallback path wired).
4. ✅ `regenerate-content` flashcards branch rewritten to use `upsertLinkedDeckRegen` with the same preservation rule.
5. ✅ Backfill migration: every existing `(user_id, material_id)` with `material_flashcards` rows but no linked `flashcard_decks` row now has one, with cards copied at default SRS state. Idempotent.
6. ✅ `supabase/config.toml` registers `record-activity` with `verify_jwt = false` (JWT validated in-code).

**Mobile can now build against:** `POST /functions/v1/record-activity` with the payload spec in this plan. Returns `{ xp_awarded, new_level, total_xp, current_streak, newly_earned, already_recorded }`.

**Deferred to a follow-up pass (web client cutover — does not block mobile):**
- `useReviewFlashcard` / end-of-session: switch to `record-activity` (batched single call) and stop inserting `study_sessions` for new reviews.
- `useStudyStats` + Progress reads → `study_activity_v`.
- Emit `record-activity` from `SummariesTab`, `TutorNotesTab`, `ConceptMapTab`, `AIChatTab`, `PracticeQuestionsTab`.
- Remove `useAwardXP` / `useCheckAchievements` call sites (keep hook files temporarily so build doesn't break).
- Hub Flashcards "Study" CTA → linked deck SRS page.

The deferred web changes have no schema dependency — they can ship anytime before the mobile cutover release. Until they ship, web continues using the legacy client-side award path; the server tolerates this (no rejection of direct `profiles.xp` writes), so there is no double-counting risk because `study_sessions` and `study_activity` flashcard rows do NOT both get written for the same session (web still writes `study_sessions`; mobile will write `study_activity`; the union view counts each once).
