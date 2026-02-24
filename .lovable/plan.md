

# Break Processing into Small Batches (Pipeline Approach)

## Problem
The `process-material` edge function does everything in one call:
1. Download file + extract text
2. Generate tutor notes (large AI call)
3. Generate 3 summaries (3 AI calls)
4. Generate 15 practice questions (large AI call)
5. Generate 20 flashcards (large AI call)
6. Generate concept map (large AI call)

This accumulates memory across all steps, hitting the WORKER_LIMIT for larger files. The text extraction may succeed, but the function crashes partway through content generation.

## Solution: Multi-Step Pipeline
Split processing into individual steps. Each step is a separate edge function invocation with its own memory budget. The client orchestrates the steps sequentially.

```text
Step 1: Extract text + save to DB        (one function call)
Step 2: Generate tutor notes              (one function call)
Step 3: Generate summaries                (one function call)
Step 4: Generate flashcards               (one function call)
Step 5: Generate practice questions       (one function call)
Step 6: Generate concept map              (one function call)
Step 7: Mark as completed                 (one function call)
```

Each step runs in a fresh edge function invocation, so memory resets between steps.

## Technical Details

### 1. Edge Function Changes (`supabase/functions/process-material/index.ts`)

Add a `step` parameter to the request body. When `step` is provided, only run that specific generation task. When no `step` is provided (legacy calls), run the full pipeline for backward compatibility but with a fallback.

Steps:
- `"extract"` -- Download file, extract text, save `extracted_content` to DB. Set status to `"processing"`.
- `"tutor_notes"` -- Read `extracted_content` from DB, generate tutor notes, save to `tutor_notes` table.
- `"summaries"` -- Read `extracted_content`, generate all 3 summary types, save to `summaries` table.
- `"flashcards"` -- Read `extracted_content`, generate flashcards, save to `material_flashcards` table.
- `"questions"` -- Read `extracted_content`, generate practice questions (Pro only), save to `practice_questions` table.
- `"concept_map"` -- Read `extracted_content`, generate concept map (Pro only), save to `concept_maps` table.
- `"complete"` -- Set `processing_status` to `"completed"`.

When no step is given, run all steps sequentially within the function (current behavior, kept for backward compat). This means existing retry buttons still work.

### 2. Client-Side Orchestration (`src/hooks/useStudyMaterials.tsx`)

Update the `useCreateStudyMaterial` mutation to call the function in steps instead of one shot:

```text
1. invoke('process-material', { materialId, step: 'extract' })
2. invoke('process-material', { materialId, step: 'tutor_notes' })
3. invoke('process-material', { materialId, step: 'summaries' })
4. invoke('process-material', { materialId, step: 'flashcards' })
5. invoke('process-material', { materialId, step: 'questions' })   // if enabled
6. invoke('process-material', { materialId, step: 'concept_map' }) // if enabled
7. invoke('process-material', { materialId, step: 'complete' })
```

Each call is awaited before the next. If any step fails, set status to "failed" with an error message indicating which step failed. Previous steps' results are already saved to DB, so partial progress is preserved.

### 3. Processing Status UI Updates (`src/components/materials/ProcessingStatus.tsx`)

Update the progress steps to reflect more granular stages. Store a `processing_step` field on the material (or use the existing `processing_status` with more values). For simplicity, we can update `processing_error` with progress info like "Generating summaries..." so the polling UI shows which step is active.

Actually, we'll add a lightweight progress mechanism: the edge function updates a `processing_progress` text field on each step (e.g., "Extracting content...", "Generating tutor notes..."). The ProcessingStatus component already polls and can display this.

### 4. Retry Behavior

The retry buttons in `ProcessingStatus.tsx` and `MaterialCard.tsx` will continue to work. When retrying, the client calls the stepped pipeline again. If `extracted_content` already exists in DB, the extract step can skip re-downloading the file and reuse the saved content.

### Files Modified
- `supabase/functions/process-material/index.ts` -- Add `step` parameter handling; each step reads `extracted_content` from DB instead of holding it in memory
- `src/hooks/useStudyMaterials.tsx` -- Update `useCreateStudyMaterial` to call steps sequentially
- `src/components/materials/ProcessingStatus.tsx` -- Update retry handler to use stepped pipeline; show current step name
- `src/pages/StudyMaterialsPage.tsx` -- Update retry handler to use stepped pipeline
- `src/pages/MaterialSettingsPage.tsx` -- Update re-process call to use stepped pipeline

### No Database Schema Changes
The `extracted_content` column already exists on `study_materials`. We'll use the existing `processing_error` field to store progress messages (cleared on completion).

### Benefits
- Each step gets a fresh 150MB+ memory budget
- Partial results are saved -- if flashcards succeed but questions fail, the user still has flashcards
- Retry can skip already-completed steps
- Large files that extract successfully will now process fully
- The 28MB PDF's extracted text is only ~65KB, so generation steps will work fine

