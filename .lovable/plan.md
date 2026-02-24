

# Fix All 8 Study Materials Issues

## Overview
Eight targeted fixes across the Study Materials module to resolve bugs, improve UX, and add missing functionality.

---

## Issue 1: Make Retry Processing Non-Blocking

**Problem:** `handleRetryProcessing` in `StudyMaterialsPage.tsx` (line 72-89) and `ProcessingStatus.tsx` uses `await runProcessingPipeline(...)`, which blocks the UI thread until the entire 7-step pipeline completes.

**Fix:** Change both to fire-and-forget pattern (same as `useCreateStudyMaterial` already does):
- In `StudyMaterialsPage.tsx`: Remove `await` from `runProcessingPipeline()`, add `.catch()` handler, show "Retrying..." toast immediately.
- In `ProcessingStatus.tsx`: Same fire-and-forget pattern in `handleRetry`.

**Files:** `src/pages/StudyMaterialsPage.tsx`, `src/components/materials/ProcessingStatus.tsx`

---

## Issue 2: Fix MaterialCard Dropdown Visibility on Desktop

**Problem:** `MaterialCard.tsx` uses `group-hover:opacity-100` on the actions menu (line 108), but the parent `motion.div` is missing the `group` Tailwind class, so the dropdown never appears on desktop hover.

**Fix:** Add `group` class to the parent `motion.div` element.

**File:** `src/components/materials/MaterialCard.tsx`

---

## Issue 3: Fix Processing Progress Tracking

**Problem:** `ProcessingStatus.tsx` reads `material.processing_error` for progress messages, but the pipeline writes progress to `processing_error` field (which is semantically wrong) and the matching strings don't align with what the edge function actually writes.

**Fix:** 
- Use the `updated_at` timestamp changes as a trigger for re-fetching (already polling).
- Track progress client-side: store a `currentStep` in local state, and update it each time the `study-material` query refetches and detects new generated content (check if tutor_notes, summaries, flashcards, questions, concept_map tables have data for this material).
- Alternatively, simpler approach: query the material's related tables to determine completed steps and derive progress from that.

**File:** `src/components/materials/ProcessingStatus.tsx`

---

## Issue 4: Add Polling on Materials List Page

**Problem:** `StudyMaterialsPage.tsx` doesn't poll, so materials stuck in "Processing" never update to "Ready" without manual refresh.

**Fix:** Add `refetchInterval` to the `useStudyMaterials` hook when any material has `processing_status` of `pending` or `processing`. Set interval to 5 seconds, disable when all materials are completed/failed.

**File:** `src/hooks/useStudyMaterials.tsx` (in `useStudyMaterials` hook) or `src/pages/StudyMaterialsPage.tsx` (using the query client).

---

## Issue 5: Persist AI Chat History

**Problem:** `AIChatTab.tsx` stores messages in `useState`, so switching tabs or navigating away loses the conversation.

**Fix:** Use `sessionStorage` keyed by `materialId` to persist and restore chat messages. On mount, load from sessionStorage. On every message update, save to sessionStorage. This preserves chat during tab switches without requiring a database table.

**File:** `src/components/materials/tabs/AIChatTab.tsx`

---

## Issue 6: Remove Redundant Card Count Update in FlashcardsTab

**Problem:** `FlashcardsTab.tsx` (lines 136-147) manually fetches and updates `card_count` on `flashcard_decks` after inserting flashcards. But the database already has a trigger `update_deck_card_count` that automatically increments/decrements `card_count` on INSERT/DELETE.

**Fix:** Remove the manual card count update block (lines 135-147) from `saveToDeckmutation`, keeping only the `flashcards` insert.

**File:** `src/components/materials/tabs/FlashcardsTab.tsx`

---

## Issue 7: Add Web URL and YouTube File Type Support

**Problem:** `MaterialCard.tsx` and `StudyMaterialsPage.tsx` have no icon, color, or filter option for `web_url` or `youtube` file types, so these materials show a generic "File" icon.

**Fix:**
- In `MaterialCard.tsx`: Add `web_url` and `youtube` entries to `fileTypeConfig` with appropriate icons (Globe, Video) and colors.
- In `StudyMaterialsPage.tsx`: Add `web_url` and `youtube` to the `FileTypeFilter` type and add corresponding filter checkboxes in the dropdown.

**Files:** `src/components/materials/MaterialCard.tsx`, `src/pages/StudyMaterialsPage.tsx`

---

## Issue 8: Fix ProcessingStatus Progress Detection via Content Queries

**Problem (elaboration of Issue 3):** The progress bar in `ProcessingStatus.tsx` relies on `processing_error` field which contains error messages, not progress. The progress stays stuck at 15%.

**Fix:** Replace the `getProgress` function with one that queries the related content tables to determine which steps have completed:
- Check if `extracted_content` is populated (extract step done)
- Check if `tutor_notes` table has records for this material
- Check if `summaries` table has records
- Check if `material_flashcards` table has records
- Check if `practice_questions` table has records
- Check if `concept_maps` table has records

This gives accurate, real-time progress as each pipeline step completes and the polling interval picks up the changes.

**File:** `src/components/materials/ProcessingStatus.tsx`, with new queries added to `src/hooks/useStudyMaterials.tsx`

---

## Summary of Files to Modify

| File | Issues |
|------|--------|
| `src/pages/StudyMaterialsPage.tsx` | 1, 7 |
| `src/components/materials/ProcessingStatus.tsx` | 1, 3, 8 |
| `src/components/materials/MaterialCard.tsx` | 2, 7 |
| `src/hooks/useStudyMaterials.tsx` | 4 |
| `src/components/materials/tabs/AIChatTab.tsx` | 5 |
| `src/components/materials/tabs/FlashcardsTab.tsx` | 6 |

