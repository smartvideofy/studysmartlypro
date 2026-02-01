
# Help Center Articles Implementation Plan

## Overview

Based on the provided screenshots, we need to restructure the Help Center with 6 categories and 24 total articles matching the exact structure shown.

---

## Category Structure (from screenshots)

| # | Category | Icon | Description | Articles |
|---|----------|------|-------------|----------|
| 1 | Getting Started | `book` (open book icon) | Learn the basics | 5 |
| 2 | Notes & Editor | `help-circle` (question mark) | Creating and organizing notes | 4 |
| 3 | Study Features | `sparkles` (lightbulb) | Flashcards and spaced repetition | 4 |
| 4 | Collaboration | `users` | Groups and sharing | 3 |
| 5 | Account & Billing | `credit-card` | Manage your account and payments | 4 |
| 6 | Troubleshooting | `zap` (wrench icon) | Find solutions to common issues | 4 |

---

## Article Details (Exact from Screenshots)

### Category 1: Getting Started (5 articles)
| # | Slug | Title | Summary |
|---|------|-------|---------|
| 1 | `create-first-study-set` | How to create your first study set | Learn how to upload materials and create your first AI-powered study set |
| 2 | `quick-start-guide` | Quick start guide for new users | Get up and running with Studily in just 5 minutes |
| 3 | `understanding-dashboard` | Understanding your dashboard | Navigate your Studily dashboard like a pro |
| 4 | `setting-up-profile` | Setting up your profile | Personalize your Studily experience |
| 5 | `importing-existing-materials` | Importing existing materials | Import your existing study materials from other apps |

### Category 2: Notes & Editor (4 articles)
| # | Slug | Title | Summary |
|---|------|-------|---------|
| 1 | `creating-first-note` | Creating your first note | Learn to create and format notes in Studily |
| 2 | `formatting-options` | Formatting options | Format notes for better organization |
| 3 | `organizing-notes-folders` | Organizing notes in folders | Keep your notes organized with folders |
| 4 | `adding-images-media` | Adding images and media | Add images and media to your notes |

### Category 3: Study Features (4 articles)
| # | Slug | Title | Summary |
|---|------|-------|---------|
| 1 | `using-flashcards-effectively` | Using flashcards effectively | Master the flashcard study mode |
| 2 | `spaced-repetition-explained` | Spaced repetition explained | How Studily optimizes your learning with spaced repetition |
| 3 | `ai-tutor-features` | AI Tutor features | Get personalized explanations from the AI tutor |
| 4 | `quiz-mode-guide` | Quiz mode guide | Test your knowledge with quiz mode |

### Category 4: Collaboration (3 articles)
| # | Slug | Title | Summary |
|---|------|-------|---------|
| 1 | `sharing-study-sets` | Sharing study sets | Share your study sets with friends and classmates |
| 2 | `creating-study-groups` | Creating study groups | Learn together with study groups |
| 3 | `real-time-collaboration` | Real-time collaboration | Work together on notes in real-time |

### Category 5: Account & Billing (4 articles)
| # | Slug | Title | Summary |
|---|------|-------|---------|
| 1 | `changing-password` | Changing your password | Update your account password |
| 2 | `managing-subscription` | Managing subscription | Upgrade, downgrade, or cancel your plan |
| 3 | `billing-invoices` | Billing and invoices | View and download your invoices |
| 4 | `deleting-account` | Deleting your account | How to permanently delete your account |

### Category 6: Troubleshooting (4 articles)
| # | Slug | Title | Summary |
|---|------|-------|---------|
| 1 | `app-not-loading` | App not loading | Troubleshoot loading issues |
| 2 | `sync-issues` | Sync issues | Fix problems with data synchronization |
| 3 | `upload-errors` | Upload errors | Resolve file upload problems |
| 4 | `contact-support` | Contact support | Get help from our support team |

---

## Database Changes Required

### Step 1: Update/Create Categories
We need to consolidate the current 9 categories into 6 categories matching the screenshots:

```text
Current categories to keep (with updates):
- getting-started -> Update description to "Learn the basics", icon to "book"
- notes-editor -> Keep, update description to "Creating and organizing notes"  
- account-billing -> Keep, update description to "Manage your account and payments"

Current categories to consolidate/update:
- study-features -> Keep as "Study Features" with description "Flashcards and spaced repetition", icon "sparkles"
- groups -> Rename slug to "collaboration", title to "Collaboration", description "Groups and sharing"

Categories to add:
- troubleshooting -> New category with icon "zap", description "Find solutions to common issues"

Categories to deactivate:
- study-materials (consolidate content into getting-started)
- flashcards (consolidate into study-features)
- ai-features (consolidate into study-features)
- account (consolidate into account-billing)
```

### Step 2: Clean Up Orphaned Articles
Multiple articles have `category_id = NULL` - these need to be either:
- Assigned to the correct category
- Deactivated if duplicates

### Step 3: Insert New Articles
Create all 24 articles with proper content matching the screenshots.

---

## Migration SQL Structure

The migration will:

1. **Update existing categories** to match new structure
2. **Create "Troubleshooting" category** if not exists
3. **Rename "Study Groups" to "Collaboration"**
4. **Deactivate redundant categories** (study-materials, flashcards, ai-features, account)
5. **Deactivate all existing articles** (clean slate approach for consistency)
6. **Insert all 24 articles** with full markdown content

---

## Icon Mapping Update

The HelpCategoryCard component needs an additional icon added:

| Icon Key | Lucide Icon | Used For |
|----------|-------------|----------|
| `book` | `Book` | Getting Started |
| `help-circle` | `HelpCircle` | Notes & Editor |
| `sparkles` | `Sparkles` | Study Features |
| `users` | `Users` | Collaboration |
| `credit-card` | `CreditCard` | Account & Billing |
| `zap` | `Zap` | Troubleshooting (wrench in screenshot, but zap works) |

The existing iconMap already supports all these icons.

---

## Files to Create/Modify

| File | Type | Description |
|------|------|-------------|
| `supabase/migrations/[timestamp]_help_center_restructure.sql` | Create | SQL migration with all category and article changes |

---

## Article Content Structure

Each article will include:

- Proper markdown formatting with headers
- Step-by-step instructions where applicable
- Tips and best practices
- Cross-references to related articles using `[[slug]]` syntax
- Consistent Studily branding throughout

---

## Expected Outcome

After implementation:
- 6 categories displayed on Help Center main page
- Exact article counts: 5, 4, 4, 3, 4, 4 = 24 total articles
- All articles have proper category assignments
- Consistent branding with "Studily" throughout
- Clean navigation matching the provided screenshots
