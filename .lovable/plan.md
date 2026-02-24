

# Fix: Allow Multiple Sequential File Uploads

## Problem
When uploading a file, the app blocks until the entire 7-step AI processing pipeline completes (extraction, tutor notes, summaries, flashcards, questions, concept map, finalization). This takes several minutes per file, during which:
- The upload modal shows a loading spinner and can't be used
- The user can't upload additional files
- If the pipeline errors, the whole upload appears to fail even though the file was saved

## Solution
Decouple the file upload/DB insert from the AI processing pipeline. The upload should complete instantly, then processing runs in the background.

## Technical Changes

### File: `src/hooks/useStudyMaterials.tsx`

In `useCreateStudyMaterial` (around line 161-169), change the processing pipeline from `await` to fire-and-forget:

**Before:**
```typescript
try {
  await runProcessingPipeline(createdMaterial.id);
} catch (processingError) {
  console.error('Pipeline error:', processingError);
  toast.info('Material uploaded but processing encountered an issue.');
}
```

**After:**
```typescript
// Fire-and-forget: don't await the pipeline so the mutation resolves immediately
runProcessingPipeline(createdMaterial.id).catch((processingError) => {
  console.error('Pipeline error:', processingError);
  toast.info('Processing encountered an issue. You can retry from the materials page.');
});
```

This single change means:
- The mutation resolves as soon as the DB record is created
- The modal closes immediately and the user can upload more files
- Processing continues in the background (the ProcessingStatus component already polls for updates)
- Errors are still caught and shown as toasts

No other files need changes -- the `ProcessingStatus` component already handles polling and displaying progress.

