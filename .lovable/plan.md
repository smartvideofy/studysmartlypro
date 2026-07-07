# Web ↔ Native Mobile Audit

Uploaded `src.zip` = the Studily **React Native / Expo** app source (95 files, `src/screens/*`, `src/navigation`, RevenueCat IAP, expo-image-manipulator, expo-audio, react-navigation). Comparing against this repo (`src/pages/*`, `src/components/*`).

## Shell / navigation

| Area | Mobile | Web | Notes |
|---|---|---|---|
| Bottom tabs | Home, Library, Cards, Groups, Settings | `MobileBottomNav` + sidebar | Parity |
| Drawer | `DrawerMenu` | `MobileMenuDrawer` + `Sidebar` | Parity |
| Splash → Auth → Onboarding → Main | same | same | Parity |
| Global search | `SearchScreen` (dedicated route) | `GlobalSearch` (command palette) | Parity, different UX |

## Feature-by-feature

| Feature | Mobile | Web | Gap |
|---|---|---|---|
| Materials list & upload | `MaterialsScreen`, `UploadMaterialScreen` | `StudyMaterialsPage`, `UploadMaterialModal` | — |
| Material workspace tabs | Summary, Notes, Cards, Concept map | Summaries, TutorNotes, Flashcards, Quiz, ConceptMap, AIChat, AudioOverview, PracticeQuestions | **Web is richer** |
| Notebooks (multi-source synthesis) | ❌ absent | ✅ `NotebookWorkspace` + tabs | Web-only |
| Flashcards + SRS | `FlashcardsScreen`, `DeckDetailScreen`, `StudySessionScreen`, `LearnSessionScreen` | `FlashcardsPage`, `DeckDetailPage`, `StudySession` | Mobile has a **separate "Learn" mode** distinct from SRS review |
| Import / Export deck | `ImportDeckScreen`, `ExportDeckScreen` (CSV/Anki) | ❌ | **Web gap** |
| Groups chat | `GroupsScreen`, `GroupDetailScreen` | full parity + polls, scheduled sessions, voice notes, reactions, pinning, mentions, shared notes, invite links | Web is richer |
| Report / block users (Play UGC) | `useModeration`, `ReportModal`, `BlockedAccountsModal` | ❌ | **Web gap** (needed if web ever surfaces UGC to non-members) |
| Camera doc scan (multi-page → PDF) | `ScanReviewModal` (expo-camera + expo-image-manipulator) | ❌ | Mobile-only by nature; web could use `getUserMedia` if desired |
| Audio note recording for upload | `AudioRecorderModal` | ❌ (web has AudioOverview playback, not record-to-upload) | Mobile-only |
| Onboarding pickers | `StudyGoalScreen`, `SubjectsScreen`, `ExperienceLevelScreen` (dedicated screens, editable from Settings) | `OnboardingPage` collects them inline; not all re-editable from Settings | Verify parity of edit surface |
| Exam countdown | `ExamCountdown` on Dashboard | ❌ | **Web gap** |
| Progress / Achievements / Pricing / Help | present | present | Parity |
| Paywall | `PaywallScreen` + RevenueCat (`useRevenueCat`, `iap.ts`, entitlement "Studily Pro") | `PricingPage` + Paystack, trial gate | Platform-appropriate; **can't unify** |
| Delete account | `DeleteAccountModal` → `useDeleteAccount` (`request_account_deletion` RPC) | `DeleteAccountPage` (same RPC) | Parity ✅ |
| Offline / resume stalled | `useResumeStalledProcessing`, `useReviewQueueSync`, react-query persist | web has `useOfflineStorage` + IndexedDB for flashcards | Different tech, roughly equivalent |
| Push notifications | `lib/notifications.ts` (expo-notifications) | `usePushNotifications` (web push) | Parity per platform |

## Web-only that mobile lacks (informational)
Notebooks, richer material tabs (AIChat, TutorNotes, PracticeQuestions, AudioOverview, ConceptMap tab UI), Help article pages, PWA install page, Unsubscribe page, JoinGroup via invite URL, group polls / scheduled sessions / voice notes / reactions / pinning / mentions / shared notes.

## Mobile-only that web lacks (candidates to close)
1. **Deck Import / Export** (Anki `.apkg`-lite / CSV) — real user value, purely frontend + a download.
2. **Exam countdown badge** on the dashboard — small UI addition tied to profile `exam_date`.
3. **Report / block user** for group chat — needed if abuse becomes an issue; mobile already has the tables/policies.
4. **Learn mode** (separate from SRS review) — new study flow in `StudySession`.
5. **Editable Study Preferences in Settings** (goal / subjects / experience) matching mobile pickers.

## What to actually do

I recommend picking from these, roughly ordered by ROI:

- **A. Add Deck Import / Export to `FlashcardsPage` / `DeckDetailPage`** — port `lib/deckImport.ts` + `lib/deckExport.ts` from mobile (they're already framework-agnostic TS).
- **B. Add `ExamCountdown` to web Dashboard** — port the component, drop `Animated` for framer-motion; wire to existing profile field if present, otherwise add one.
- **C. Add editable Study Preferences section in `SettingsPage`** (goal / subjects / experience) mirroring mobile.
- **D. Add Learn mode** to `StudySession` (bigger; adds a new session type).
- **E. Add report / block for group members** — needs new tables `content_reports`, `user_blocks` + RLS + UI in `MemberManagementPanel` / message menus.
- **F. None** — accept current parity; audit only.

### Technical notes (for whoever implements)
- Mobile's `lib/*` files that are RN-free and reusable in web: `deckImport.ts`, `deckExport.ts`, `srs.ts`, `learn.ts`, `subjects.ts`, `subscriptionSelectors.ts`, `format.ts`, `materialStatus.ts`, `processingProgress.ts`, `noteToMarkdown.ts`. They can be copied into `src/lib/` with only import-path changes.
- Anything using `react-native`, `expo-*`, `@react-navigation`, `Animated`, or `Ionicons` must be rewritten with web equivalents (`framer-motion`, `lucide-react`, `react-router-dom`).
- RevenueCat/IAP is intentionally not portable — web stays on Paystack (per project memory).

**Reply with which of A–F (any combination) to build, and I'll produce a build-mode plan for just those.**
