# Add "Get the Android App" CTA

Promote the Play Store listing (`https://play.google.com/store/apps/details?id=com.studily.app`) inside the web app — without cluttering the UI for users who can't act on it.

## What we'll build

### 1. Dashboard banner (Android devices only)
A premium, dismissible banner at the top of the Dashboard that only renders on Android phones/tablets.

- Bold Pink accent (matches brand), Play Store icon, single-line headline + sub-copy.
- Primary CTA: **"Get it on Google Play"** → opens Play Store link in a new tab.
- Secondary action: **dismiss (✕)** — hides the banner for **7 days**, then it returns.
- Persisted in `localStorage` (key: `android_cta_dismissed_until`) — no DB schema changes, no extra server calls.

```text
┌──────────────────────────────────────────────────────────┐
│ 📱  Studily is on Android                            ✕  │
│     Take your flashcards & notes anywhere.              │
│                          [ Get it on Google Play ]      │
└──────────────────────────────────────────────────────────┘
```

### 2. Persistent entry — always reachable
For users who dismissed the banner or want to share the link later:

- **Desktop sidebar**: a small "Get the Android app" row above/below the existing upgrade CTA in `SidebarUpgradeCTA` area.
- **Mobile menu drawer** (`MobileMenuDrawer`): a list item with the Play Store icon.
- Both open the same Play Store URL in a new tab. Shown to **everyone**, not just Android — so iPhone users can send the link to a friend or open it on their other device.

### 3. Android detection
Single helper `isAndroidDevice()` reading `navigator.userAgent` (matches `/Android/i`, excludes `Windows`). Used only to decide whether the Dashboard banner renders. The sidebar/drawer entries don't gate on device.

## Files to add / edit

**New**
- `src/lib/device.ts` — `isAndroidDevice()` helper.
- `src/components/cta/AndroidAppBanner.tsx` — the dismissible Dashboard banner (uses `localStorage` for 7-day re-show logic).
- `src/components/cta/AndroidAppLink.tsx` — small reusable row for sidebar/drawer (icon + label + external-link affordance).

**Edited**
- `src/pages/Dashboard.tsx` — mount `<AndroidAppBanner />` at the top of the content area.
- `src/components/layout/MobileMenuDrawer.tsx` — add `<AndroidAppLink />` near the bottom of the drawer.
- `src/components/layout/sidebar/SidebarUpgradeCTA.tsx` (or the sidebar index that renders it) — add `<AndroidAppLink />` underneath the upgrade card.

## Technical details

- **No DB changes.** Dismissal lives in `localStorage` — keeps it simple and per-device, which is appropriate since the banner targets the device, not the account.
- **Dismissal logic**: on dismiss, write `Date.now() + 7 * 24 * 60 * 60 * 1000`. On mount, read the timestamp; hide banner if `Date.now() < storedTimestamp`.
- **Link**: `https://play.google.com/store/apps/details?id=com.studily.app`, opened with `target="_blank"` + `rel="noopener noreferrer"`.
- **Styling**: uses existing semantic tokens (`bg-primary`, `text-primary-foreground`, etc.) per the Bold Pink design system — no hardcoded colors, no glassmorphism.
- **A11y**: banner has an accessible label, dismiss button has `aria-label="Dismiss"`, CTA is a real `<a>` for keyboard/screen-reader support.

## Out of scope (can add later if you want)
- Server-side dismissal sync across devices (would need a `user_ui_state` table or a column on `profiles`).
- iOS App Store CTA (no iOS app yet — `/install` already covers PWA on iOS).
- Install attribution / click tracking (can layer in via an `email_logs`-style `cta_clicks` table later).
