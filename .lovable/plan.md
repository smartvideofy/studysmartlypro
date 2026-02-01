

# Update Domain to app.getstudily.com

## Overview

The application domain needs to be updated from `getstudily.com` to `app.getstudily.com` across all SEO, sitemap, and configuration files.

---

## Files to Update

### 1. SEO Head Component
**File:** `src/components/seo/SEOHead.tsx`

| Line | Current | New |
|------|---------|-----|
| 3 | `https://getstudily.com` | `https://app.getstudily.com` |

---

### 2. JSON-LD Utilities
**File:** `src/components/seo/jsonld.ts`

| Line | Current | New |
|------|---------|-----|
| 1 | `https://getstudily.com` | `https://app.getstudily.com` |

---

### 3. Sitemap Redirect
**File:** `src/pages/SitemapRedirect.tsx`

| Line | Current | New |
|------|---------|-----|
| 3 | `https://getstudily.com/functions/v1/generate-sitemap` | `https://app.getstudily.com/functions/v1/generate-sitemap` |

---

### 4. Robots.txt
**File:** `public/robots.txt`

| Line | Current | New |
|------|---------|-----|
| 17 | `https://getstudily.com/sitemap.xml` | `https://app.getstudily.com/sitemap.xml` |

---

## Updated Article URLs

After this change, all Help Center article URLs will use the new domain:

**Categories:**
- `https://app.getstudily.com/help/category/getting-started`
- `https://app.getstudily.com/help/category/notes-editor`
- `https://app.getstudily.com/help/category/study-features`
- `https://app.getstudily.com/help/category/collaboration`
- `https://app.getstudily.com/help/category/account-billing`
- `https://app.getstudily.com/help/category/troubleshooting`

**Getting Started Articles:**
- `https://app.getstudily.com/help/article/create-first-study-set`
- `https://app.getstudily.com/help/article/quick-start-guide`
- `https://app.getstudily.com/help/article/understanding-dashboard`
- `https://app.getstudily.com/help/article/setting-up-profile`
- `https://app.getstudily.com/help/article/importing-existing-materials`

**Notes & Editor Articles:**
- `https://app.getstudily.com/help/article/creating-first-note`
- `https://app.getstudily.com/help/article/formatting-options`
- `https://app.getstudily.com/help/article/organizing-notes-folders`
- `https://app.getstudily.com/help/article/adding-images-media`

**Study Features Articles:**
- `https://app.getstudily.com/help/article/using-flashcards-effectively`
- `https://app.getstudily.com/help/article/spaced-repetition-explained`
- `https://app.getstudily.com/help/article/ai-tutor-features`
- `https://app.getstudily.com/help/article/quiz-mode-guide`

**Collaboration Articles:**
- `https://app.getstudily.com/help/article/sharing-study-sets`
- `https://app.getstudily.com/help/article/creating-study-groups`
- `https://app.getstudily.com/help/article/real-time-collaboration`

**Account & Billing Articles:**
- `https://app.getstudily.com/help/article/changing-password`
- `https://app.getstudily.com/help/article/managing-subscription`
- `https://app.getstudily.com/help/article/billing-invoices`
- `https://app.getstudily.com/help/article/deleting-account`

**Troubleshooting Articles:**
- `https://app.getstudily.com/help/article/app-not-loading`
- `https://app.getstudily.com/help/article/sync-issues`
- `https://app.getstudily.com/help/article/upload-errors`
- `https://app.getstudily.com/help/article/contact-support`

---

## Summary

4 files will be updated, each with a simple find-and-replace of the domain constant from `getstudily.com` to `app.getstudily.com`.

