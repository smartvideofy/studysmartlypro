

# Fix Truncated Content & Card Text Overflow

## Root Cause Analysis

There are two interconnected problems:

### Problem 1: ScrollArea gets no height constraint — content truncates without scrolling

The layout chain is:
```text
Container div (flex-1 overflow-y-auto OR overflow-hidden)
  └─ TabsContent (h-full, but mt-2 default from Tabs component)
      └─ Tab component root (h-full flex flex-col)
          └─ ScrollArea (h-full or flex-1)
```

**Issue A — MaterialWorkspace desktop (line 356):** The tab content wrapper uses `overflow-y-auto`, which means it becomes the scroll container. But the child `ScrollArea` inside each tab also tries to scroll. Two nested scroll contexts fight each other — the outer one scrolls but the inner `ScrollArea` has no fixed height (`h-full` resolves to nothing because `overflow-y-auto` doesn't constrain height). Content gets cut off.

**Fix:** Change `overflow-y-auto` to `overflow-hidden` on the tab content wrapper. This gives `h-full` children a real height constraint, allowing the internal `ScrollArea` to handle scrolling properly.

**Issue B — MaterialWorkspace mobile (line 204):** Same problem — `overflow-y-auto` instead of `overflow-hidden`.

**Issue C — TabsContent default `mt-2`:** The Tabs component adds `mt-2` by default, but all TabsContent in both workspaces already override with `m-0`. However, the `mt-2` in the base component can cause 8px of content to be pushed below the container boundary in edge cases. Since workspace tabs universally pass `m-0`, this is not the primary issue but worth noting.

**Issue D — NotebookWorkspace:** Both mobile (line 344) and desktop (line 412) already use `overflow-hidden` correctly. These should be fine.

### Problem 2: Flashcard text overflows card boundaries

The `.flashcard-face` CSS uses `position: absolute; inset: 0` with `p-8` padding and `flex items-center justify-center`. Long text overflows because:
- There is no `overflow-hidden` or `overflow-y-auto` on the face
- The text container has no `max-h` or `overflow` constraint
- The `FlashcardStudyDrawer` card uses `aspect-[4/3]` which can be too small for long answers

Similarly in `StudyFlashcard.tsx`, the card has fixed heights (`h-[320px]` mobile, `h-[400px]` desktop) with no text overflow handling.

---

## Fix Plan

### 1. MaterialWorkspace — Fix scroll containers
**Files:** `src/pages/MaterialWorkspace.tsx`

- **Line 204 (mobile):** Change `overflow-y-auto` → `overflow-hidden`
- **Line 356 (desktop):** Change `overflow-y-auto` → `overflow-hidden`

This single change fixes truncation for all tabs (tutor notes, summaries, practice questions, flashcards, chat) because the child `ScrollArea` components can now properly resolve `h-full`.

### 2. Flashcard face text overflow
**File:** `src/index.css`

Add `overflow-y-auto` to `.flashcard-face` so long text scrolls within the card rather than overflowing outside. Also add `overflow-hidden` to `.flashcard-flip-container` as a safety net.

### 3. FlashcardStudyDrawer — Add text overflow safety
**File:** `src/components/materials/tabs/FlashcardStudyDrawer.tsx`

Add `overflow-y-auto` and `max-h` constraints to the text containers inside the front/back card faces (lines 247-249, 281-283) so long answers scroll within the card.

### 4. StudyFlashcard — Same overflow fix
**File:** `src/components/flashcards/StudyFlashcard.tsx`

Add `overflow-y-auto` to the text content divs so long flashcard text doesn't escape the card boundaries.

### 5. PracticeQuestionsTab — Card text overflow
**File:** `src/components/materials/tabs/PracticeQuestionsTab.tsx`

The MCQ option buttons use fixed classes but long option text can overflow. Add `break-words` to the option text `<span>` elements.

---

## Files Modified
- `src/pages/MaterialWorkspace.tsx` — Fix `overflow-y-auto` → `overflow-hidden` (2 lines)
- `src/index.css` — Add overflow handling to flashcard CSS
- `src/components/materials/tabs/FlashcardStudyDrawer.tsx` — Add text overflow constraints
- `src/components/flashcards/StudyFlashcard.tsx` — Add text overflow handling
- `src/components/materials/tabs/PracticeQuestionsTab.tsx` — Add `break-words` to option text

