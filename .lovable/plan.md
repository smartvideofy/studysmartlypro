
# Advanced SEO Audit — Findings & Fixes

## CRITICAL Issues

### 1. Public SEO pages are behind `ProtectedRoute` (blocks crawlers)
**Impact: SEVERE** — Google cannot crawl Help Center, Help Articles, Help Categories, or Pricing. These are the only indexable content pages and they're invisible to search engines.

**Fix:** Remove `ProtectedRoute` wrapper from `/help`, `/help/category/:slug`, `/help/article/:slug`, and `/pricing` in `AnimatedRoutes.tsx`. These pages already use `DashboardLayout` which handles auth-optional UI gracefully.

### 2. Sitemap uses wrong domain
`supabase/functions/generate-sitemap/index.ts` line 8 uses `https://studysmartlypro.lovable.app` instead of `https://app.getstudily.com`. Every URL in the sitemap points to the wrong domain.

**Fix:** Update `SITE_URL` to `https://app.getstudily.com`.

### 3. OG image uses relative path in `index.html`
Lines 28 and 32 use `/og-image.png` — social crawlers need absolute URLs to fetch preview images.

**Fix:** Change to `https://app.getstudily.com/og-image.png`.

## HIGH Priority Issues

### 4. Missing SEOHead on key pages
These pages have no `<title>` or meta tags beyond the default `index.html`:
- `AuthPage` — should have "Sign In | Studily" 
- `SplashScreen` — should have default site title
- `StudyMaterialsPage` — needs title + noindex
- `ProgressPage` — needs title + noindex
- `SettingsPage` — needs title + noindex
- `AchievementsPage` — needs title + noindex
- `GroupsPage` / `GroupDetailPage` — needs title + noindex

### 5. Missing `noindex` on private/authenticated pages
Dashboard, materials, flashcards, progress, settings, achievements, groups — none of these set `noindex`. If Google somehow crawls them (via a leaked link), they'd pollute the index with auth-wall pages.

**Fix:** Add `noindex` to all authenticated-only page `SEOHead` components.

### 6. Missing semantic HTML
- No `<h1>` tag audit — several pages may use `<h2>` or styled divs as primary headings instead of proper `<h1>`.

## MEDIUM Priority Issues

### 7. No `<link rel="alternate">` or `hreflang` tags
Not critical for a single-language app, but worth noting.

### 8. Missing `aria-label` on icon-only buttons
Accessibility/SEO overlap — not blocking but worth improving over time.

---

## Implementation Plan

### Step 1: Make Help & Pricing public routes
**File: `src/components/AnimatedRoutes.tsx`**
- Remove `ProtectedRoute` from `/help`, `/help/category/:categorySlug`, `/help/article/:articleSlug`, `/pricing`

### Step 2: Fix sitemap domain
**File: `supabase/functions/generate-sitemap/index.ts`**
- Change SITE_URL to `https://app.getstudily.com`

### Step 3: Fix OG image absolute URLs in index.html
**File: `index.html`**
- Update og:image and twitter:image to absolute URLs

### Step 4: Add SEOHead with noindex to all private pages
**Files:** `AuthPage.tsx`, `StudyMaterialsPage.tsx`, `ProgressPage.tsx`, `SettingsPage.tsx`, `AchievementsPage.tsx`, `GroupsPage.tsx`
- Add `<SEOHead title="..." noindex />` to each

### Step 5: Deploy updated sitemap
- Redeploy `generate-sitemap` edge function

## Files Modified
- `src/components/AnimatedRoutes.tsx`
- `supabase/functions/generate-sitemap/index.ts`
- `index.html`
- `src/pages/AuthPage.tsx`
- `src/pages/StudyMaterialsPage.tsx`
- `src/pages/ProgressPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/AchievementsPage.tsx`
- `src/pages/GroupsPage.tsx`
