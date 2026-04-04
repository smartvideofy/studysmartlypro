

# Fix Flashcard Overflow, Fullscreen Study Mode, and Auto-Save

## Three Issues Identified

### Issue 1: Card text overflows the card boundaries
The `.flashcard-text-viewport` has `max-height: 60%` and `overflow-y: auto`, but the text font sizes are too large for shorter cards. On the `StudyFlashcard` component (used in deck study), the card has a fixed `h-[320px]`/`h-[400px]`. On the `FlashcardStudyDrawer` (material study), it uses `aspect-[4/3]`. Long AI-generated text still overflows because the large font sizes (`text-3xl`, `text-2xl`) don't scale down to fit.

**Fix:** Add dynamic font sizing based on text length. Short text gets large fonts, long text gets smaller fonts automatically. Also increase `max-height` from 60% to 70% since the badge and hint areas only need ~15% each.

### Issue 2: Fullscreen mode doesn't truly fill the screen
The drawer uses vaul's bottom-sheet pattern (`fixed inset-x-0 bottom-0`). Setting `h-screen` on a bottom-anchored drawer doesn't produce a true fullscreen experience -- there's still the drag handle, rounded corners, and margin. 

**Fix:** When fullscreen is toggled, switch from the Drawer to a portal-based fullscreen overlay (`fixed inset-0 z-50`) with no drag handle, no rounded corners. This gives a clean, immersive card-flipping experience.

### Issue 3: Material flashcards are not auto-saved to the Flashcards section
Currently, the `process-material` edge function saves cards to `material_flashcards` only. Users must manually click "Save to Deck" to copy them to `flashcard_decks` + `flashcards`. 

**Fix:** After the flashcards step in the processing pipeline, automatically create a deck (named after the material) and copy cards into the `flashcards` table. Add a `source_material_id` column to `flashcard_decks` to link back and prevent duplicate auto-saves on reprocessing.

---

## Implementation Plan

### Step 1: Dynamic font sizing for flashcards
**Files:** `src/components/materials/tabs/FlashcardStudyDrawer.tsx`, `src/components/flashcards/StudyFlashcard.tsx`

- Create a helper function `getTextSizeClass(text: string, isMobile: boolean)` that returns smaller Tailwind classes for longer text:
  - Under 50 chars: `text-xl`/`text-2xl` (current large sizes)
  - 50-150 chars: `text-base`/`text-lg`
  - Over 150 chars: `text-sm`/`text-base`
- Apply to both front and back text in both components
- Increase `.flashcard-text-viewport` max-height from 60% to 72% in `src/index.css`

### Step 2: True fullscreen study mode
**Files:** `src/components/materials/tabs/FlashcardStudyDrawer.tsx`

- When `isFullscreen` is true, render a `fixed inset-0 z-[60]` overlay instead of the Drawer content
- Remove the drag handle, rounded corners, and border in fullscreen
- Keep the same card, controls, and keyboard navigation
- Add an Escape key handler and a close/minimize button to exit fullscreen
- The card should expand to fill available space (`max-w-4xl mx-auto`)

### Step 3: Auto-save material flashcards to decks
**Files:** `supabase/functions/process-material/index.ts`

- Add a migration: `ALTER TABLE flashcard_decks ADD COLUMN source_material_id uuid REFERENCES study_materials(id) ON DELETE SET NULL`
- In the `flashcards` step of `process-material`, after inserting into `material_flashcards`:
  1. Check if a deck with `source_material_id = materialId` already exists
  2. If not, create one with the material's title as the deck name
  3. Insert the generated cards into the `flashcards` table linked to that deck
  4. If a deck already exists (reprocessing), delete old cards and re-insert

### Step 4: Update FlashcardsTab UI to reflect auto-saved state
**Files:** `src/components/materials/tabs/FlashcardsTab.tsx`

- Query for an existing deck linked to this material (`source_material_id`)
- If found, show "Open Deck" button instead of "Save to Deck"
- Keep manual "Save to Deck" as an option for saving to a different deck

---

## Files Modified
- `src/index.css` -- Increase flashcard-text-viewport max-height
- `src/components/materials/tabs/FlashcardStudyDrawer.tsx` -- Dynamic font sizing + true fullscreen overlay
- `src/components/flashcards/StudyFlashcard.tsx` -- Dynamic font sizing
- `src/components/materials/tabs/FlashcardsTab.tsx` -- Auto-saved deck awareness
- `supabase/functions/process-material/index.ts` -- Auto-save to flashcard deck
- New migration: Add `source_material_id` column to `flashcard_decks`

