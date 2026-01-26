
# Consistent "Studily" Branding Plan

## Problem Summary

The app has inconsistent branding throughout the codebase. Several legacy references to **"StudySmartly"** and **"Studyly"** need to be updated to the approved brand name **"Studily"**.

---

## Files to Update

### 1. Unsubscribe Page (`src/pages/UnsubscribePage.tsx`)

| Line | Current | New |
|------|---------|-----|
| 147 | `title="Invalid Link \| StudySmartly"` | `title="Invalid Link \| Studily"` |
| 178-179 | `title="Unsubscribed \| StudySmartly"` + description with StudySmartly | `title="Unsubscribed \| Studily"` + description with Studily |
| 213-214 | `title="Email Preferences \| StudySmartly"` + description with StudySmartly | `title="Email Preferences \| Studily"` + description with Studily |
| 224 | `receive from StudySmartly` | `receive from Studily` |

---

### 2. Settings Page (`src/pages/SettingsPage.tsx`)

| Line | Current | New |
|------|---------|-----|
| 448 | `StudySmartly Pro v{APP_VERSION}` | `Studily v{APP_VERSION}` |

---

### 3. SEO Head Component (`src/components/seo/SEOHead.tsx`)

| Line | Current | New |
|------|---------|-----|
| 3 | `SITE_URL = "https://studysmartlypro.lovable.app"` | `SITE_URL = "https://getstudily.com"` |

---

### 4. JSON-LD Utilities (`src/components/seo/jsonld.ts`)

| Line | Current | New |
|------|---------|-----|
| 1 | `SITE_URL = "https://studysmartlypro.lovable.app"` | `SITE_URL = "https://getstudily.com"` |

---

### 5. Sitemap Redirect (`src/pages/SitemapRedirect.tsx`)

| Line | Current | New |
|------|---------|-----|
| 3 | `SITEMAP_URL = 'https://studysmartlypro.lovable.app/functions/v1/generate-sitemap'` | `SITEMAP_URL = 'https://getstudily.com/functions/v1/generate-sitemap'` |

---

### 6. Robots.txt (`public/robots.txt`)

| Line | Current | New |
|------|---------|-----|
| 17 | `Sitemap: https://studysmartlypro.lovable.app/sitemap.xml` | `Sitemap: https://getstudily.com/sitemap.xml` |

---

### 7. Calendar Integration (`src/lib/calendar.ts`)

| Line | Current | New |
|------|---------|-----|
| 20 | `@studysmartly.app` | `@studily.app` |
| 33 | `PRODID:-//StudySmartly//Study Session//EN` | `PRODID:-//Studily//Study Session//EN` |

---

### 8. Push Notification Edge Function (`supabase/functions/send-push-notification/index.ts`)

These already use "studily" correctly:
- Line 47: `mailto:notifications@studily.app` ✓
- Line 257: `studily-notification` ✓

No changes needed here.

---

## Summary of Changes

| File | Priority | Instances |
|------|----------|-----------|
| `src/pages/UnsubscribePage.tsx` | High | 5 occurrences |
| `src/pages/SettingsPage.tsx` | High | 1 occurrence |
| `src/components/seo/SEOHead.tsx` | High | 1 URL |
| `src/components/seo/jsonld.ts` | High | 1 URL |
| `src/pages/SitemapRedirect.tsx` | Medium | 1 URL |
| `public/robots.txt` | Medium | 1 URL |
| `src/lib/calendar.ts` | Low | 2 occurrences |

---

## Database Content (Help Center Articles)

The Help Center articles stored in the database via migrations contain "Studyly" references. These are already in the database, so changing them requires either:

1. **Run a SQL UPDATE query** - Update the content in the `help_articles` table to replace "Studyly" with "Studily"
2. **Create a new migration** - Add a migration that fixes the content

I will create a SQL migration to fix the database content as well.

---

## Expected Outcome

After implementation:
- All UI text displays "Studily"
- All SEO meta tags reference getstudily.com
- Sitemap and robots.txt point to correct domain
- Calendar exports show "Studily" branding
- Help Center articles display correct "Studily" name
