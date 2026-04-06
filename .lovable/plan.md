

# Soften Paywall: View-Only Mode for Expired Users

## Current Problem
When a user's trial expires, the entire app is blocked with a full-screen `SubscriptionBlock`. Users cannot view their dashboard, study materials, flashcards, progress, achievements, or settings. This is too aggressive.

## New Behavior
Expired trial users can freely:
- Log in, log out, navigate the entire app
- View dashboard, progress stats, achievements
- View existing study materials and all generated content (summaries, tutor notes, flashcards, questions, concept maps)
- View existing flashcard decks and study them
- View settings, help, groups

Expired trial users are blocked (with upgrade prompt) only when they try to:
- Upload new study materials
- Create new flashcard decks or notebooks
- Generate/regenerate AI content (summaries, flashcards, questions, etc.)
- Use AI Chat
- Start new AI-powered actions

## Implementation

### Step 1: Remove the full-screen block from DashboardLayout
**File: `src/components/layout/DashboardLayout.tsx`**
- Remove the `useIsBlocked` import and usage
- Remove the `SubscriptionBlock` import and the conditional render at line 114
- Keep the `ExpiredTrialBanner` -- it provides a non-blocking nudge to subscribe

### Step 2: Create a reusable `useActionGate` hook
**File: `src/hooks/useActionGate.tsx` (new)**
- A hook that returns a `guardAction(callback)` function
- If the user is on an expired trial, it shows a toast/dialog prompting upgrade instead of executing the action
- If the user has access, it runs the callback normally

### Step 3: Gate creation/upload actions on StudyMaterialsPage
**File: `src/pages/StudyMaterialsPage.tsx`**
- Wrap the "Upload" button's onClick with the action gate
- Users can still see and open their existing materials

### Step 4: Gate creation actions on FlashcardsPage
**File: `src/pages/FlashcardsPage.tsx`**
- Wrap "Create Deck" and "AI Generate" button actions with the gate
- Users can still view and study existing decks

### Step 5: Gate regeneration actions in MaterialWorkspace
**File: `src/pages/MaterialWorkspace.tsx`**
- Remove `PremiumGate` wrappers from tabs (so users can VIEW all generated content)
- Gate the "Regenerate" buttons in each tab with the action gate
- Gate the AI Chat tab's message sending (viewing previous chats is fine, sending new messages is blocked)

### Step 6: Gate notebook creation
**File: `src/pages/NotesPage.tsx` or equivalent**
- Wrap "Create Notebook" / "Create Note" actions with the gate

### Step 7: Gate AI actions in note editor
**File: `src/pages/NoteEditor.tsx`**
- Gate "AI Summary", "AI Flashcards" generation buttons
- Users can still view and edit existing notes

### Step 8: Update PremiumGate for tab-level use (AI Chat only)
**File: `src/components/subscription/PremiumGate.tsx`**
- Keep PremiumGate but only use it for AI Chat (which is inherently a generation action)
- Or better: let users see chat history but disable the input field

## Technical Details

### useActionGate hook
```typescript
export function useActionGate() {
  const { isBlocked } = useIsBlocked();
  const navigate = useNavigate();

  const guardAction = (action: () => void) => {
    if (isBlocked) {
      toast.error("Subscribe to unlock this feature", {
        description: "Your trial has ended. Subscribe to create and generate new content.",
        action: { label: "View Plans", onClick: () => navigate("/pricing") },
      });
      return;
    }
    action();
  };

  return { guardAction, isExpired: isBlocked };
}
```

### Where gates are placed (action-level, not view-level)
- Upload material button
- Create deck / Create notebook buttons
- AI Generate buttons (flashcards, summaries, questions)
- Regenerate content buttons
- AI Chat send message
- Import document button
- Export actions (optional -- could allow exports)

### What remains freely accessible
- All navigation and page views
- Dashboard with stats
- Progress page with charts
- Achievements page
- Study material viewer (all tabs: summaries, tutor notes, flashcards, questions, concept maps)
- Flashcard study mode (flip through existing cards)
- Settings page
- Help center
- Groups (viewing)

## Files Modified
- `src/components/layout/DashboardLayout.tsx` -- Remove full-screen block
- `src/hooks/useActionGate.tsx` -- New hook for action-level gating
- `src/pages/StudyMaterialsPage.tsx` -- Gate upload
- `src/pages/FlashcardsPage.tsx` -- Gate create deck
- `src/pages/MaterialWorkspace.tsx` -- Remove PremiumGate wrappers, gate regenerate + chat send
- `src/pages/NotesPage.tsx` -- Gate create note/folder
- `src/pages/NoteEditor.tsx` -- Gate AI actions
- `src/components/materials/tabs/AIChatTab.tsx` -- Gate message sending
- `src/components/materials/tabs/FlashcardsTab.tsx` -- Gate save-to-deck action
- `src/components/subscription/SubscriptionBlock.tsx` -- Keep but no longer used in layout (can be removed or kept for pricing page reference)

