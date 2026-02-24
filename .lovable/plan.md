

# Audit: Notebooks & Study Materials Implementation

## Issues Found

### 1. CRITICAL: `notebook_id` Not Passed During Material Creation

**File:** `src/hooks/useStudyMaterials.tsx` (lines 148-166)

The `useCreateStudyMaterial` mutation's insert object does NOT include `notebook_id`. The `CreateNotebookModal` passes `notebook_id` via `as any` cast (line 129), but the insert statement in the hook hardcodes only specific columns and silently drops `notebook_id`. This means **all materials created for a notebook have `notebook_id = null`**, completely breaking the notebook-material relationship.

**Fix:** Add `notebook_id: (material as any).notebook_id ?? null` to the insert object in `useCreateStudyMaterial`.

---

### 2. CRITICAL: Individual Material Processing Runs Unnecessarily for Notebook Materials

**File:** `src/hooks/useStudyMaterials.tsx` (lines 172-177)

When `useCreateStudyMaterial` succeeds, it fires `runProcessingPipeline(createdMaterial.id)` which runs the full 7-step individual material pipeline (tutor notes, summaries, flashcards, etc.). For notebook materials, this is wasteful -- they only need the **extract** step, then the notebook pipeline handles the rest. Currently every notebook source gets its own individual flashcards, questions, etc. on top of the combined notebook ones.

**Fix:** When `notebook_id` is present, only run the extract step of the pipeline (or skip the pipeline entirely and rely on the notebook pipeline). This could be done by adding a parameter to `runProcessingPipeline` to stop after extraction, or by checking `notebook_id` before firing.

---

### 3. MODERATE: `NotebookWorkspace` Auto-Trigger Can Run Multiple Times

**File:** `src/pages/NotebookWorkspace.tsx` (lines 65-74)

The `useEffect` that auto-triggers the notebook pipeline uses `isRetrying` as a guard, but `isRetrying` starts as `false` and is set to `true` synchronously. However, if `allExtracted` and `isPending` change while a pipeline is already running (due to polling), the effect could trigger again in a race condition. Also, the dependency array includes `isRetrying`, which means the effect re-runs whenever `isRetrying` changes back to `false`.

**Fix:** Use a `useRef` flag to track whether the pipeline has been triggered, independent of the component's render cycle.

---

### 4. MODERATE: Notebook Processing Pipeline Blocks the Client

**File:** `src/lib/processNotebookPipeline.ts`

The `runNotebookPipeline` function is `await`ed in the `NotebookWorkspace` component (line 69). It calls 6 sequential edge function invocations. While the UI shows a spinner, the user is blocked from interacting meaningfully and if they navigate away the pipeline stops mid-execution. The individual material pipeline uses fire-and-forget -- the notebook pipeline should too.

**Fix:** Make the pipeline fire-and-forget with a `.catch()` handler, similar to how `useCreateStudyMaterial` handles it. Rely on polling to update the UI.

---

### 5. MODERATE: `buildCombinedContent` Runs on Every Step

**File:** `supabase/functions/process-notebook/index.ts` (line 419)

Every step (tutor_notes, summaries, flashcards, questions, concept_map, complete) calls `buildCombinedContent()` which fetches all materials and their extracted content from the database. For 6 steps, that's 6 redundant full-content fetches. While functionally correct, this wastes database bandwidth and adds latency.

**Fix:** For the `complete` step, skip the `buildCombinedContent` call since it's not needed. For other steps, this is acceptable since each edge function invocation is independent (fresh memory).

---

### 6. MINOR: `FlashcardStudyDrawer` May Not Support Notebook Flashcard Shape

**File:** `src/components/notebooks/NotebookFlashcardsTab.tsx` (line 70)

The `FlashcardStudyDrawer` is imported from `src/components/materials/tabs/FlashcardStudyDrawer.tsx` and receives notebook flashcards. The drawer likely expects `material_flashcards` shape (with `material_id`), but notebook flashcards have `notebook_id` instead. Need to verify the drawer's prop types are compatible.

**Fix:** Verify the `FlashcardStudyDrawer` accepts a generic flashcard shape (front, back, hint, difficulty) without requiring `material_id`. If not, update it to accept a union type.

---

### 7. MINOR: Notebook Delete Doesn't Cascade to Orphaned Materials

**File:** `src/hooks/useNotebooks.tsx` (lines 154-174)

The migration uses `ON DELETE SET NULL` for the `notebook_id` foreign key on `study_materials`. So when a notebook is deleted, its materials become standalone (orphaned) with `notebook_id = null`. The delete confirmation says "Source materials will be kept" which is intentional. However, these orphaned materials still have individually-generated content from issue #2 -- so this is actually fine functionally, just needs consistency with whether individual processing ran.

**Status:** Acceptable behavior, no fix needed.

---

### 8. MINOR: No Search Filtering for Notebooks

**File:** `src/pages/StudyMaterialsPage.tsx` (lines 344-364)

Notebooks are displayed in a separate section but are NOT filtered by the search query. If a user searches "Biology", only materials are filtered -- notebooks titled "Cell Biology Unit 3" still show (or don't -- they're just always shown).

**Fix:** Apply `searchQuery` filtering to notebooks as well.

---

## Summary of Required Fixes

| Priority | Issue | File(s) |
|----------|-------|---------|
| CRITICAL | `notebook_id` not passed in material insert | `useStudyMaterials.tsx` |
| CRITICAL | Full pipeline runs for notebook materials (wasteful) | `useStudyMaterials.tsx` |
| MODERATE | Auto-trigger race condition in workspace | `NotebookWorkspace.tsx` |
| MODERATE | Notebook pipeline blocks client | `NotebookWorkspace.tsx`, `processNotebookPipeline.ts` |
| MODERATE | Redundant content fetch on `complete` step | `process-notebook/index.ts` |
| MINOR | FlashcardStudyDrawer prop compatibility | `NotebookFlashcardsTab.tsx` |
| MINOR | Notebooks not filtered by search | `StudyMaterialsPage.tsx` |

## Implementation Order

1. Fix `notebook_id` in material insert (critical -- nothing works without this)
2. Skip full pipeline for notebook materials (only extract)
3. Fix auto-trigger race condition with `useRef`
4. Make notebook pipeline fire-and-forget
5. Skip `buildCombinedContent` on complete step
6. Verify FlashcardStudyDrawer compatibility
7. Add search filtering for notebooks

