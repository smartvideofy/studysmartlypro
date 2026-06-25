# Feature comparison — web app vs Play Store Android app

Based on the Play Store listing for **Studily: AI Study App** (`com.studily.app`, updated Jun 23 2026) versus the current web app in this repo. This is a feature-level diff only — no native hardware capabilities (push, camera, biometrics, etc.).

## Verdict

Web has near-complete feature parity with the advertised Android feature set. The only meaningful gap is **in-app purchases / Google Play billing**, which is a platform mechanic the web cannot match (web uses Paystack). Everything else listed on the Play Store is present in the web app.

## Feature-by-feature

| Play Store feature | Web app today | Status |
| --- | --- | --- |
| AI study notes from PDFs / Word / lecture notes | `StudyMaterialsPage`, `UploadMaterialModal`, `processNotebookPipeline` | Present |
| AI flashcards with spaced repetition | `FlashcardsPage`, `DeckDetailPage`, `StudySession` (SM-2 engine) | Present |
| AI quizzes / practice questions | Quiz tab in `MaterialWorkspace`, `StudySession` | Present |
| Concept maps | `ConceptMapTab`, `NotebookConceptMapTab` | Present |
| Personal AI tutor (ask questions about uploads) | `AIChatTab`, `TutorNotesTab` | Present |
| Progress tracking, streaks, XP, achievements | `ProgressPage`, `AchievementsPage`, gamification system | Present |
| Study groups / collaboration | `GroupsPage`, `GroupDetailPage`, `JoinGroupPage` | Present |
| Onboarding | `OnboardingPage` | Present |
| Pricing / Pro upgrade | `PricingPage`, Paystack integration | Present (different billing) |
| 7-day Pro trial | Trial logic in `useSubscription` (currently 3-day per project memory) | **Mismatch — see below** |
| Live upload generation progress (latest release note) | `ProcessingStatus` component | Present |
| Delete a single tool's content per material (latest release note) | Need to verify in `DeleteMaterialModal` | **Likely gap — verify** |
| Redesigned onboarding (latest release note) | `OnboardingPage` exists; not necessarily the same redesign | **Possible drift** |
| In-app purchases (Google Play billing) | Paystack only | **Platform gap — won't fix** |

## What this means

Three small things actually worth deciding on:

1. **Free-trial length mismatch** — Play Store advertises a **7-day** Pro trial; project memory and web app are on a **3-day** trial. Pick one number and align the web copy (or update the Play listing). 
2. **Per-tool content deletion** — Play Store release notes say users can delete a single tool's content (notes only, or quiz only, etc.) without removing the whole material. Need to check whether the web `DeleteMaterialModal` exposes this; if not, add a per-tab "Clear this content" action in `MaterialWorkspace`.
3. **Onboarding parity** — confirm the web `OnboardingPage` matches the "smoother, redesigned" Android onboarding so new web signups don't get a worse first impression.

No native-hardware items are in scope here per your direction.

## Suggested next step

Pick which (if any) of the three to act on:
- **A.** Align free-trial length (web ↔ Play Store) — quick copy + config change.
- **B.** Add per-tool content delete in `MaterialWorkspace` — small feature.
- **C.** Audit and refresh `OnboardingPage` to match the Android redesign — needs a reference (screenshots from the Android app).
- **D.** None — comparison only, no build.
