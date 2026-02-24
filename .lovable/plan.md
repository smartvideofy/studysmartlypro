

# Fix: Notebook Tab Content Cut Off / Not Scrollable

## Root Cause

The parent wrapper around `TabsContent` (line 344 mobile, line 410 desktop in `NotebookWorkspace.tsx`) uses `overflow-y-auto`:

```text
div.flex-1.overflow-y-auto        <-- scrolls itself
  TabsContent.h-full              <-- tries to match parent height
    ScrollArea.h-full             <-- ALSO tries to scroll, but height resolves incorrectly
```

The problem: `overflow-y-auto` on the parent means the parent can grow to fit content, so `h-full` on `TabsContent` and `ScrollArea` does not produce a fixed constraint. The `ScrollArea` (Radix) sets `overflow: hidden` on its root element, which clips the content, but since the height is not properly constrained, the scrollable viewport inside never activates -- content gets cut off with no scrollbar.

## The Fix

Change the parent wrapper from `overflow-y-auto` to `overflow-hidden` in both mobile and desktop layouts. This gives the `TabsContent` and inner `ScrollArea` a fixed height to fill, enabling proper scrolling inside each tab.

### File: `src/pages/NotebookWorkspace.tsx`

**Mobile layout (line 344):**
- Change `className="flex-1 overflow-y-auto"` to `className="flex-1 overflow-hidden"`

**Desktop layout (line 410):**
- Change `className="flex-1 overflow-y-auto"` to `className="flex-1 overflow-hidden"`

That is the only change needed. Each tab component already has its own `ScrollArea` with `h-full` (TutorNotes, Summaries) or `flex-1` (Flashcards, Questions) which will correctly handle scrolling once the parent provides a fixed height boundary.

### Why This Works

```text
BEFORE (broken):
  div.flex-1.overflow-y-auto    -- grows to fit content, no fixed height
    TabsContent.h-full          -- h-full = undefined/auto
      ScrollArea.h-full         -- h-full = undefined, overflow:hidden clips content

AFTER (fixed):
  div.flex-1.overflow-hidden    -- fixed height from flex layout
    TabsContent.h-full          -- h-full = parent's actual pixel height
      ScrollArea.h-full         -- h-full = constrained, viewport scrolls properly
```

### Files Modified

| File | Change |
|------|--------|
| `src/pages/NotebookWorkspace.tsx` | 2 lines: change `overflow-y-auto` to `overflow-hidden` on lines 344 and 410 |

