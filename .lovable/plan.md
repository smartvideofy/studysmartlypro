

# Offline Study Mode with IndexedDB Caching

## Overview
Add offline capability so users can read their notes and study flashcards without an internet connection. When online, data syncs automatically from Supabase into IndexedDB. When offline, the app serves cached data seamlessly.

## What users will experience
- Notes, flashcards, and decks are automatically cached in the background after loading
- When internet drops, users see an "Offline Mode" indicator banner
- They can still browse cached notes and study cached flashcard decks
- Flashcard review results (SRS updates) are queued offline and synced when back online
- Read-only for notes (no offline editing to avoid complex conflict resolution)

## Technical approach

### 1. IndexedDB storage layer (`src/lib/offlineStorage.ts`)
Create a lightweight IndexedDB wrapper (no extra dependencies) with object stores for:
- `notes` -- cached note objects
- `flashcard_decks` -- cached deck objects
- `flashcards` -- cached flashcard objects, indexed by `deck_id`
- `pending_reviews` -- queued SRS review updates for sync
- `sync_meta` -- last sync timestamps per store

### 2. Offline-aware hooks (`src/hooks/useOfflineStorage.tsx`)
- `useOfflineStatus()` -- monitors `navigator.onLine` and emits online/offline events
- `useOfflineNotes()` -- wraps `useNotes` to write results to IndexedDB on success, and fall back to IndexedDB when the Supabase query fails
- `useOfflineDecks()` -- same pattern for flashcard decks
- `useOfflineFlashcards(deckId)` -- same for individual cards
- `useOfflineReview()` -- wraps `useReviewFlashcard` to queue reviews in IndexedDB when offline, and flush the queue when back online

### 3. Background sync on reconnect
When the app detects it's back online:
- Flush all `pending_reviews` from IndexedDB to Supabase via the existing `useReviewFlashcard` mutation
- Re-fetch fresh data and update the IndexedDB cache
- Show a toast: "Back online -- your progress has been synced"

### 4. Offline banner component (`src/components/ui/offline-banner.tsx`)
A slim, fixed banner at the top of the app that appears when offline:
- Yellow/amber background with a wifi-off icon
- Text: "You're offline -- viewing cached data"
- Auto-dismisses when back online

### 5. Integration points
- **`useNotes` hook**: Add IndexedDB caching after successful fetch, fallback on error
- **`useFlashcards` hook**: Same caching/fallback pattern for decks, cards, and due cards
- **`useReviewFlashcard` hook**: Queue reviews when offline
- **`DashboardLayout`**: Render the offline banner
- **`App.tsx`**: Initialize IndexedDB on app startup, register online/offline listeners for sync

### 6. Cache management
- Cache up to 100 most recent notes and all flashcard decks/cards
- Refresh cache on every successful online fetch (overwrite strategy, no merge)
- Clear offline cache on sign-out (add to existing auth cleanup in `useAuth`)
- Respect the existing `CacheBuster` version system -- clear IndexedDB on version bump

## Files to create
| File | Purpose |
|---|---|
| `src/lib/offlineStorage.ts` | IndexedDB wrapper with CRUD for each store |
| `src/hooks/useOfflineStorage.tsx` | Offline-aware hooks and sync logic |
| `src/components/ui/offline-banner.tsx` | Visual offline indicator |

## Files to modify
| File | Change |
|---|---|
| `src/hooks/useNotes.tsx` | Wrap `useNotes` query with IndexedDB cache/fallback |
| `src/hooks/useFlashcards.tsx` | Wrap deck/card/review queries with IndexedDB cache/fallback |
| `src/hooks/useAuth.tsx` | Clear IndexedDB on sign-out |
| `src/components/layout/DashboardLayout.tsx` | Add offline banner |
| `src/App.tsx` | Clear IndexedDB on version bump |

## Scope boundaries
- **Read-only offline for notes** -- no offline note editing (avoids conflict resolution complexity)
- **Offline flashcard reviews are queued** -- SRS updates sync when reconnected
- **No offline creation** of new notes/decks/cards (keeps it simple and reliable)
- **No additional npm dependencies** -- uses the native IndexedDB API

