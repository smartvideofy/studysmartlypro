
The earlier patch only fixed part of the problem. I checked the current code, and the outer `overflow-hidden` changes are already there, but the real scroll chain is still incomplete.

```text
Workspace panel
  -> Tabs
     -> TabsContent
        -> tab body (flex column)
           -> ScrollArea
              -> Radix viewport
```

Right now, that chain still breaks in two places:
- `MaterialWorkspace` tabs are still missing key `min-h-0` flex constraints.
- The shared `ScrollArea` primitive itself does not have `min-h-0`, so in flex layouts it can grow to content height instead of becoming the scrollable area.

That is why Notes, Summaries, Questions, Flashcards, and Chat can still look clipped with no usable vertical scroll.

The flashcard issue is separate: text is still rendered inside a centered card face with top/bottom overlays, so long AI wording can collide with the badge/hint area and spill outside.

Plan

1. Fix the shared scroll foundation
- Update `src/components/ui/scroll-area.tsx` so the root always includes `min-h-0 min-w-0`.
- Expose a viewport ref/hook so chat tabs can scroll the actual Radix viewport, not the outer root.
- Only make a small shared `TabsContent` adjustment if needed; avoid broad risky styling changes.

2. Repair the workspace height chain
- `src/pages/MaterialWorkspace.tsx`: add `min-h-0` to the mobile and desktop study-tool wrappers, the `Tabs` roots, the inner `flex-1 overflow-hidden` containers, and the `TabsContent` blocks.
- Apply the same height-chain hardening in `src/pages/NotebookWorkspace.tsx` for consistency.
- Keep the outer wrappers `overflow-hidden` so each tab has one clear internal scroll container.

3. Harden the tab bodies that depend on scrolling
- Add `min-h-0` to tab components that use a fixed header plus a scrollable body:
  - `PracticeQuestionsTab`
  - `FlashcardsTab`
  - `AIChatTab`
  - notebook equivalents
- Let Tutor Notes and Summaries keep using full-height `ScrollArea`, but make sure their parents now provide a real constrained height.

4. Fix chat behavior properly
- In `AIChatTab` and `NotebookChatTab`, move auto-scroll logic to the ScrollArea viewport so new streamed messages remain reachable.
- Add stronger text wrapping to chat markdown/bubbles so long AI answers do not overflow narrow panels.
- Keep the input/footer pinned while only the message list scrolls.

5. Rebuild flashcard text handling
- In `src/index.css`, change `.flashcard-face` to keep the card shell fixed (`overflow-hidden`) and move scrolling to an inner text viewport.
- Reserve space for the top badge and bottom hint so content never overlaps those areas.
- Slightly reduce the largest text sizes and enforce wrapping on card text.
- Apply the same structure to:
  - `src/components/materials/tabs/FlashcardStudyDrawer.tsx`
  - `src/components/flashcards/StudyFlashcard.tsx`

6. Close the remaining overflow gaps
- `src/components/notebooks/NotebookQuestionsTab.tsx`: add `break-words` to answer option text; the material version already has this, but the notebook version still does not.
- Review chat bubbles and narrow card/question text blocks for `min-w-0` + wrapping where needed.

Files likely touched
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/tabs.tsx` if a minimal shared fix is needed
- `src/pages/MaterialWorkspace.tsx`
- `src/pages/NotebookWorkspace.tsx`
- `src/components/materials/tabs/PracticeQuestionsTab.tsx`
- `src/components/materials/tabs/FlashcardsTab.tsx`
- `src/components/materials/tabs/AIChatTab.tsx`
- `src/components/notebooks/NotebookQuestionsTab.tsx`
- `src/components/notebooks/NotebookFlashcardsTab.tsx`
- `src/components/notebooks/NotebookChatTab.tsx`
- `src/components/materials/tabs/FlashcardStudyDrawer.tsx`
- `src/components/flashcards/StudyFlashcard.tsx`
- `src/index.css`

Success criteria
- Tutor Notes, Summaries, Questions, Flashcards, and Chat all scroll fully on desktop and mobile.
- No clipped content at the bottom of tabs.
- No double-scroll conflict between workspace wrappers and tab bodies.
- Chat always reaches the latest streamed message.
- Long flashcard text stays inside the card and becomes internally scrollable when necessary.
- Long MCQ options wrap cleanly instead of escaping their buttons/cards.
