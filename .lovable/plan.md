

# Groups UI/UX Redesign -- Premium Minimalist

## Overview
The Groups experience has two pages: **GroupsPage** (listing) and **GroupDetailPage** (chat/collaboration). Both have visual clutter that contradicts the premium minimalist direction. This plan addresses both pages with specific, actionable changes.

---

## GroupsPage Improvements

### 1. Remove the "Discover Study Groups" wrapper card (High)
**Current:** Public groups are wrapped inside an elevated Card with a large header (icon box + title + description + badge) and 8 category filter pills.
**Fix:** Remove the Card wrapper entirely. Render "Discover" as a simple section heading (like "My Groups") with the count as muted text. Public group cards render directly in a grid below, same as "My Groups".

### 2. Remove the 8-category filter pills (High)
**Current:** A horizontal scroll of 8 subject category buttons (All, Science, Math, Languages, Humanities, Technology, Arts, Business).
**Problem:** These filters don't actually filter by a database field -- they rely on keyword matching in the group name/description, which is unreliable. They add interaction complexity for marginal value.
**Fix:** Remove entirely. The search bar already handles filtering.

### 3. Remove colored background variants from public group cards (Medium)
**Current:** Each public group card gets a colored background like `bg-primary/8`, `bg-success/8`, `bg-accent/8` via the `getGroupBg()` function.
**Fix:** Remove the `getGroupBg()` function. Use the same plain `Card variant="interactive"` styling as "My Groups" cards. This creates visual consistency.

### 4. Simplify public group card layout to match My Groups cards (Medium)
**Current:** Public group cards have a 48px icon box, name, member count, description, and a full-width "Join Group" button -- a completely different layout from My Groups cards.
**Fix:** Use the same card layout as My Groups cards. Replace the large icon box with a simple inline icon. Add a "Join" button instead of "Open". This creates a uniform grid where the only difference between My Groups and Discover groups is the action button.

### 5. Remove the `getGroupIcon()` keyword-matching function (Low)
**Current:** Assigns icons based on keyword matching in group name/description (e.g., "science" gets a flask icon).
**Fix:** Remove this function. Use a single consistent icon (Users or GraduationCap) for all groups, or no icon at all. Keyword-matching is fragile and inconsistent.

### 6. Simplify the empty state for My Groups (Low)
**Current:** Large 80px dashed-border icon container with text and a tip linking to /materials.
**Fix:** Reduce the icon container to 48px. Remove the "Tip" text -- it's noise. Keep the CTA button.

### 7. Clean up the "more" button on My Groups cards (Low)
**Current:** Each My Groups card has a `MoreHorizontal` button that doesn't actually do anything (no dropdown menu attached).
**Fix:** Remove this non-functional button entirely.

---

## GroupDetailPage Improvements

### 8. Reduce tab count -- merge Polls into Chat (Medium)
**Current:** 5 horizontal tabs: Chat, Shared Notes, Polls, Sessions, Members. This is a lot of tabs, especially on mobile where they require horizontal scrolling.
**Fix:** Polls are infrequent and lightweight. Render polls inline within the Chat tab (they already feel like chat content). Remove the dedicated Polls tab, reducing to 4 tabs: Chat, Notes, Sessions, Members. Polls can be created via the attachment/action menu in the chat input area.

### 9. Simplify the header action buttons (Low)
**Current:** Owner sees "Invite" + "Settings" buttons. Non-owner sees "Leave" button. The "Invite" button only shows for private groups.
**Fix:** Collapse all header actions into a single overflow menu (three-dot icon). The menu contains: Invite Link (if owner + private), Group Settings (if owner), Leave Group (if not owner). This declutters the header significantly.

### 10. Remove the UpcomingSessions banner from above tabs (Low)
**Current:** A banner showing upcoming study sessions renders between the header and tabs, pushing tabs down.
**Fix:** Move this information into the Sessions tab itself. The banner adds vertical noise on every visit, even when the user is focused on chat.

---

## Summary of Changes

| # | File | Change | Impact |
|---|------|--------|--------|
| 1 | GroupsPage | Remove Discover card wrapper | High -- cleaner layout |
| 2 | GroupsPage | Remove 8 category filter pills | High -- less clutter |
| 3 | GroupsPage | Remove colored card backgrounds | Medium -- visual consistency |
| 4 | GroupsPage | Unify public/private card layout | Medium -- consistency |
| 5 | GroupsPage | Remove keyword icon matching | Low -- simplification |
| 6 | GroupsPage | Simplify empty state | Low -- cleaner |
| 7 | GroupsPage | Remove non-functional more button | Low -- bug fix |
| 8 | GroupDetailPage | Merge Polls tab into Chat | Medium -- fewer tabs |
| 9 | GroupDetailPage | Collapse header buttons to overflow menu | Low -- cleaner header |
| 10 | GroupDetailPage | Move sessions banner into Sessions tab | Low -- less noise |

---

## Technical Details

### GroupsPage.tsx changes:
- Remove `subjectCategories` array, `getGroupBg()`, `getGroupIcon()`, `selectedCategory` state
- Remove imports: `FlaskConical`, `Calculator`, `Languages`, `Palette`, `Code`, `TrendingUp`, `Sparkles`, `BookOpen`, `GraduationCap`, `ScrollArea`, `ScrollBar`
- Replace the entire Discover `Card` block (lines 316-435) with a simple section heading + grid of cards using the same layout as My Groups
- Remove the `MoreHorizontal` button from My Groups cards (line 250-252) since it has no attached menu
- Simplify empty state icon size

### GroupDetailPage.tsx changes:
- Remove the Polls `TabsTrigger` and `TabsContent`
- Render polls inline at the top of the Chat tab content
- Remove the `UpcomingSessionsBanner` from above the tabs; move it inside the Sessions `TabsContent`
- Replace the header buttons (Invite, Settings, Leave) with a single `DropdownMenu` triggered by a three-dot icon button
- Remove `BarChart3` import (polls icon), add `MoreHorizontal` if not already imported

