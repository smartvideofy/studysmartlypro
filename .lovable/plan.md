

# Fix: Content Cut Off in Notebook Workspace Tabs

## Root Cause

The previous fix (changing `overflow-y-auto` to `overflow-hidden`) was correct in intent but incomplete. The real culprit is a missing `min-h-0` on the `Tabs` component.

In CSS Flexbox, flex children default to `min-height: auto`, meaning they won't shrink smaller than their content. The `Tabs` div has `flex-1 flex flex-col` but no `min-h-0`, so when tab content is taller than the available space, the `Tabs` element overflows its parent instead of constraining itself. This breaks the entire height chain:

```text
CURRENT (broken):
  div.flex-1.flex-col.overflow-hidden     -- constrained height
    Tabs.flex-1.flex.flex-col             -- min-height: auto, REFUSES to shrink
      div (tab list)                      -- takes natural height
      div.flex-1.overflow-hidden          -- gets wrong height because Tabs overflows
        TabsContent.h-full               -- h-full = wrong value
          ScrollArea.h-full              -- clips content, no scrollbar

FIXED:
  div.flex-1.flex-col.overflow-hidden     -- constrained height
    Tabs.flex-1.flex.flex-col.min-h-0    -- NOW shrinks to available space
      div (tab list)                      -- takes natural height
      div.flex-1.overflow-hidden          -- correct constrained height
        TabsContent.h-full               -- h-full = correct pixel value
          ScrollArea.h-full              -- scrollbar activates properly
```

## Changes

**File: `src/pages/NotebookWorkspace.tsx`** (2 lines changed)

- **Line 315** (mobile): Add `min-h-0` to Tabs className
  - From: `className="flex-1 flex flex-col"`
  - To: `className="flex-1 flex flex-col min-h-0"`

- **Line 381** (desktop): Add `min-h-0` to Tabs className
  - From: `className="flex-1 flex flex-col"`
  - To: `className="flex-1 flex flex-col min-h-0"`

No other files need changes. The `overflow-hidden` on lines 344 and 410 (from the previous fix) stays as-is -- it's correct and necessary.

