

# Fix Stuck Processing Materials

## Problem
The "daily-nation-2026-02-06" PDF (~28MB) has been stuck at "processing" status for 24+ hours. The edge function likely timed out without updating the status to "failed," leaving the material in limbo. There is no mechanism to detect or recover from this.

## Root Cause
- The `process-material` edge function timed out (edge functions have a ~60s limit, and 28MB is too large to process in time)
- The function set status to "processing" but crashed/timed out before it could set "failed"
- No client-side timeout detection exists to catch stale processing states

## Solution: Two Changes

### 1. Add Stale Processing Detection (MaterialCard.tsx)
Detect materials stuck in "processing" for more than 10 minutes and automatically show them as "failed" with a retry option. This is a client-side check using the `updated_at` timestamp.

- If `processing_status === "processing"` and `updated_at` is more than 10 minutes ago, display the card as "Stalled" instead of "Processing"
- Show a "Retry" option in the dropdown menu for stalled/failed materials

### 2. Add Retry from Material Card (MaterialCard.tsx + StudyMaterialsPage.tsx)
Allow users to retry processing directly from the materials list without needing to navigate to the detail page.

- Add an `onRetry` prop to `MaterialCard`
- Show "Retry Processing" in the dropdown menu when status is failed or stalled
- Wire up the retry logic in `StudyMaterialsPage.tsx` (reuse the same pattern from `ProcessingStatus.tsx`: reset status to "pending", invoke `process-material`)

### 3. Immediate Fix for This Specific Material
Reset the stuck material's status to "failed" so the user can see it's not processing and can retry or delete it.

## Technical Details

### Files Modified
- `src/components/materials/MaterialCard.tsx` — Add stale detection logic (compare `updated_at` with current time, >10 min = stalled). Add `onRetry` prop. Show retry in dropdown for failed/stalled items. Change status display to "Stalled" with warning icon.
- `src/pages/StudyMaterialsPage.tsx` — Add retry handler function that resets status and re-invokes `process-material`. Pass `onRetry` to `MaterialCard`.

### Stale Detection Logic
```text
const isStale = material.processing_status === "processing" 
  && new Date(material.updated_at) < new Date(Date.now() - 10 * 60 * 1000);
```

If stale, override the visual status to show "Stalled" with an `AlertCircle` icon and enable retry.

### Retry Handler (in StudyMaterialsPage)
Same pattern as `ProcessingStatus.tsx`:
1. Update material status to "pending" via `useUpdateStudyMaterial`
2. Invoke `supabase.functions.invoke('process-material', { body: { materialId } })`
3. Show toast feedback
4. Invalidate queries to refresh the list

### No Database Changes Required
Everything is client-side detection and existing edge function invocation.
