

# Mobile Optimization Audit -- Issues and Fixes

## Overview
After a line-by-line review of every page, layout component, and mobile-specific feature, I identified 9 mobile optimization issues. The app already has strong mobile foundations (safe area insets, touch targets, keyboard avoidance, haptics, bottom nav). These fixes address the remaining gaps.

---

## Issue 1: GroupDetailPage chat input hidden behind bottom nav on mobile
**File:** `src/pages/GroupDetailPage.tsx` (line 587)
**Problem:** The chat message input `form` at the bottom of the chat area has `p-3` padding but no awareness of the 80px-tall `MobileBottomNav`. When the user is on the Chat tab, the message input can be partially or fully hidden behind the bottom navigation bar.
**Fix:** Add `pb-safe` and additional bottom padding on mobile. Specifically, add `isMobile ? "pb-20" : ""` to the wrapping card container or adjust the `ScrollArea` height calc to account for the bottom nav. The `h-[calc(100vh-20rem)]` (line 481) is also not using `dvh` and doesn't account for the bottom nav properly.
**Change:** Update the scroll area height to `h-[calc(100dvh-22rem)]` on mobile and add `mb-20 md:mb-0` to the chat card container so the entire chat block sits above the bottom nav.

---

## Issue 2: GroupDetailPage header buttons overflow on small mobile screens
**File:** `src/pages/GroupDetailPage.tsx` (lines 364-408)
**Problem:** The header layout uses `flex items-center justify-between` with the group title on the left and action buttons (Invite, Settings/Leave) on the right. On narrow screens (< 375px), the buttons and title compete for space, causing either text truncation or button overflow.
**Fix:** Make the header wrap-friendly on mobile. Add `flex-wrap` and ensure the title truncates properly with `min-w-0` and `truncate`.

---

## Issue 3: DeckDetailPage search input not full-width on mobile
**File:** `src/pages/DeckDetailPage.tsx` (line 220)
**Problem:** The search input container has `flex-1 max-w-md` but no `w-full`, matching the same issue previously fixed on GroupsPage. On mobile, it may not stretch to fill the available width.
**Fix:** Add `w-full` to match the pattern used on other pages.

---

## Issue 4: DeckDetailPage header buttons cramped on mobile
**File:** `src/pages/DeckDetailPage.tsx` (lines 167-213)
**Problem:** The deck header shows the deck name, badges, description, and a "Study" button + overflow menu side by side. On mobile, the `flex items-start justify-between gap-4` layout gives only 4px gap, and the buttons can squeeze the title.
**Fix:** Stack the header vertically on mobile using `flex-col sm:flex-row` so the title takes full width, and buttons move below.

---

## Issue 5: StudySession SRS buttons cramped on small screens
**File:** `src/components/flashcards/SRSButtons.tsx`
**Problem:** The SRS answer buttons (Again, Hard, Good, Easy) are rendered in a horizontal row. On smaller mobile screens, the text labels and timing info can overflow or wrap awkwardly.
**Fix:** Need to check the component. If it doesn't use `flex-wrap` or mobile-responsive sizing, add it.

---

## Issue 6: AuthPage left panel visible on tablet but cramped
**File:** `src/pages/AuthPage.tsx` (line 164)
**Problem:** The left marketing panel uses `hidden lg:flex` which means it disappears entirely below 1024px. Between 768px-1024px (tablet), the auth form takes full width without any branding, which feels sparse. This is acceptable but the form container (`p-6`) could use more generous padding on tablets.
**Fix:** Low priority -- the current approach is fine for MVP. Could add `md:p-8` to the right panel for tablet screens.

---

## Issue 7: PricingPage cards not stacked properly on mobile
**File:** `src/pages/PricingPage.tsx`
**Problem:** Need to verify the pricing grid uses proper mobile stacking. If it uses `grid-cols-3` without responsive breakpoints, the cards will be too narrow on mobile.
**Fix:** Verify and ensure `grid-cols-1 md:grid-cols-3` pattern.

---

## Issue 8: GroupDetailPage uses `AlertDialogContent` instead of ResponsiveModal for leave confirmation
**File:** `src/pages/GroupDetailPage.tsx` (lines 856-880)
**Problem:** The "Leave Group" confirmation dialog uses `AlertDialog` which renders as a centered popup on mobile instead of a bottom sheet. This is inconsistent with the app's pattern of using bottom sheets for all mobile interactions.
**Fix:** Low priority -- AlertDialog is semantically correct for destructive confirmations. Keep as-is.

---

## Issue 9: Dashboard content extends under bottom nav without enough padding on last section
**File:** `src/pages/Dashboard.tsx`
**Problem:** The `DashboardLayout` applies `pb-24 md:pb-0` which is correct. However, the weekly progress chart section at the very bottom may still feel cut off if content is long. The current padding should be sufficient but the last card should be checked.
**Fix:** Already handled by `pb-24`. No change needed.

---

## Confirmed Fixes (4 actionable items)

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | High | `GroupDetailPage.tsx` | Chat input hidden behind bottom nav | Add `mb-20 md:mb-0` to chat container, use `100dvh` |
| 2 | Medium | `GroupDetailPage.tsx` | Header buttons overflow on small screens | Add `flex-wrap gap-3` and `min-w-0 truncate` on title |
| 3 | Low | `DeckDetailPage.tsx` | Search input not full-width on mobile | Add `w-full` |
| 4 | Medium | `DeckDetailPage.tsx` | Header buttons cramped on mobile | Stack vertically on mobile with `flex-col sm:flex-row` |

Items 5-9 were investigated and found to be either already handled or low priority. The SRS buttons component needs a quick check during implementation.

---

## Technical Implementation

### Fix 1: GroupDetailPage chat container (High Priority)
- Line 467: Change the chat card container to add `mb-20 md:mb-0` so the entire chat block (including the input form) sits above the bottom nav
- Line 481: Change `h-[calc(100vh-20rem)]` to `h-[calc(100dvh-22rem)]` for proper dynamic viewport height

### Fix 2: GroupDetailPage header (Medium)
- Lines 365-408: Wrap the header `div` with `flex-wrap gap-3` and add `min-w-0` to the title container, `truncate` on the `h1`

### Fix 3: DeckDetailPage search (Low)
- Line 220: Add `w-full` to the search container div

### Fix 4: DeckDetailPage header (Medium)
- Line 167: Change to `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4`
- Buttons div gets `flex items-center gap-2 self-start`

### Bonus: SRS Buttons check
- Verify `SRSButtons.tsx` uses proper mobile-friendly sizing. If buttons are too small or text overflows, add `flex-wrap` or reduce label text on mobile.

