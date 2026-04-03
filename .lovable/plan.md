

# Audit: What the Previous Fixes Got Right and What's Still Broken

## What's Already Fixed (Confirmed Working)

1. **ScrollArea root** now has `min-h-0 min-w-0` -- correct
2. **MaterialWorkspace & NotebookWorkspace** both have `Tabs` with `flex-1 flex flex-col min-h-0` -- correct
3. **Content wrappers** have `flex-1 overflow-hidden min-h-0` -- correct
4. **TabsContent** uses `m-0 h-full` overriding the default `mt-2` -- correct
5. **Flashcard CSS** has `.flashcard-text-viewport` with `overflow-y: auto; max-height: 60%` -- correct
6. **Tab components** (FlashcardsTab, PracticeQuestionsTab) use `h-full flex flex-col min-h-0` -- correct

## Remaining Issues Found

### Issue 1: Radix ScrollArea Viewport is NOT the scroll target (Chat auto-scroll broken)

In `AIChatTab` and `NotebookChatTab`, the `ref={scrollRef}` is passed to `<ScrollArea>`, which forwards it to the Radix `Root` element. But the Root has `overflow: hidden` -- it is NOT the scrollable element. The actual scrollable element is the **Viewport** (a child div rendered by Radix). So `scrollRef.current.scrollTop = scrollRef.current.scrollHeight` does absolutely nothing. Chat messages stream in but the view never scrolls to show them.

**Fix:** Update `ScrollArea` to expose a `viewportRef` prop. Update both chat tabs to use `viewportRef` for auto-scrolling instead of the root ref.

### Issue 2: Mobile height calculation is wrong -- content clipped behind bottom nav

Both workspaces use `h-[calc(100dvh-9rem)]` on mobile. The actual space consumed:
- MobileHeader: ~3.5rem (56px)
- `<main>` padding-top: 1rem (from `p-4`)
- `<main>` padding-bottom: 6rem (`pb-24`, to clear the fixed bottom nav)

Total = **10.5rem**, but the calc only subtracts **9rem**. This means the container extends ~1.5rem (24px) behind the bottom navigation bar, clipping the bottom of every tab's content.

**Fix:** Change both mobile containers from `h-[calc(100dvh-9rem)]` to `h-[calc(100dvh-11rem)]` (or restructure so the workspace bypasses the `pb-24` padding by using negative bottom margin).

### Issue 3: Desktop height calculation may clip bottom content

Desktop uses `h-[calc(100vh-8rem)]` with `-m-6 mt-0`. The desktop header is 4rem, and the content area has `p-6` (1.5rem) padding. The negative margin `-m-6` removes 1.5rem on all sides except top (`mt-0`). The effective bottom edge: the container starts at ~5.5rem from viewport top, height is `100vh - 8rem`, so it ends at `100vh - 2.5rem`. With `-mb-6` compensation, it reaches `100vh - 1rem`. This leaves a ~1rem gap at the bottom where content might be hidden.

**Fix:** Adjust to `h-[calc(100vh-7rem)]` or use a more reliable approach like making the DashboardLayout content area itself a flex column with `flex-1 overflow-hidden`.

### Issue 4: TabsContent default `mt-2` still applies in some contexts

The `cn()` merging of `mt-2` (from TabsContent default) and `m-0` (from workspace usage) works correctly via Tailwind Merge. However, if any OTHER usage of TabsContent in the app (Summaries tab's inner tabs, for example) doesn't override `m-0`, those nested TabsContent elements will have `mt-2` eating into the height chain.

In `SummariesTab`, the inner `<Tabs>/<TabsContent>` at lines 200-262 do NOT have `m-0 h-full` -- these are inside a ScrollArea so it doesn't break scrolling, but it does add unnecessary top margin.

**Fix:** Minor -- not a scrolling issue since it's inside ScrollArea, but should be cleaned up.

### Issue 5: Prose content in chat can overflow horizontally

Chat assistant messages use `<ReactMarkdown>` inside a `prose prose-sm` container. Long code blocks, URLs, or pre-formatted text can exceed the bubble width. There's no `overflow-wrap: break-word` or `overflow-x: auto` on the prose container.

**Fix:** Add `break-words overflow-hidden` to the chat message bubble's prose wrapper.

---

## Plan

### Step 1: Fix ScrollArea to expose viewport ref
Update `src/components/ui/scroll-area.tsx` to accept a `viewportRef` prop and forward it to the Radix Viewport element, keeping backward compatibility.

### Step 2: Fix chat auto-scroll
Update `AIChatTab` and `NotebookChatTab` to use the new `viewportRef` instead of the root ref for scrolling to the latest message.

### Step 3: Fix mobile height calculation
Change `h-[calc(100dvh-9rem)]` to `h-[calc(100dvh-11rem)]` in both `MaterialWorkspace.tsx` and `NotebookWorkspace.tsx` to account for the `pb-24` on `<main>`.

### Step 4: Fix desktop height calculation
Change `h-[calc(100vh-8rem)]` to `h-[calc(100vh-7rem)]` in both workspace pages to prevent bottom clipping.

### Step 5: Add text overflow protection to chat
Add `break-words overflow-x-hidden` to the prose containers in both chat tabs.

## Files Modified
- `src/components/ui/scroll-area.tsx` -- Add viewportRef prop
- `src/components/materials/tabs/AIChatTab.tsx` -- Fix scroll target + text overflow
- `src/components/notebooks/NotebookChatTab.tsx` -- Fix scroll target + text overflow
- `src/pages/MaterialWorkspace.tsx` -- Fix height calcs (mobile & desktop)
- `src/pages/NotebookWorkspace.tsx` -- Fix height calcs (mobile & desktop)

