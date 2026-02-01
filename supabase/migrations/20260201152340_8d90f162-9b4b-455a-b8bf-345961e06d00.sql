-- Help Center Restructure: Clean up and add constraints properly

-- Step 0: Delete duplicate articles keeping only the most recent one
DELETE FROM help_articles a
USING help_articles b
WHERE a.slug = b.slug
AND a.id < b.id;

-- Step 1: Add unique constraints using DO blocks
DO $$ BEGIN
  ALTER TABLE help_categories ADD CONSTRAINT help_categories_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE help_articles ADD CONSTRAINT help_articles_slug_key UNIQUE (slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Step 2: Deactivate ALL existing articles and redundant categories
UPDATE help_articles SET is_active = false;
UPDATE help_categories SET is_active = false WHERE slug IN ('study-materials', 'flashcards', 'ai-features', 'account', 'groups');

-- Step 3: Upsert the 6 main categories
INSERT INTO help_categories (slug, title, description, icon, display_order, is_active) VALUES 
('getting-started', 'Getting Started', 'Learn the basics', 'book', 1, true),
('notes-editor', 'Notes & Editor', 'Creating and organizing notes', 'help-circle', 2, true),
('study-features', 'Study Features', 'Flashcards and spaced repetition', 'sparkles', 3, true),
('collaboration', 'Collaboration', 'Groups and sharing', 'users', 4, true),
('account-billing', 'Account & Billing', 'Manage your account and payments', 'credit-card', 5, true),
('troubleshooting', 'Troubleshooting', 'Find solutions to common issues', 'zap', 6, true)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, icon = EXCLUDED.icon, display_order = EXCLUDED.display_order, is_active = true, updated_at = now();

-- Step 4: Delete old articles and insert fresh 24 articles
DELETE FROM help_articles;

-- Getting Started (5)
INSERT INTO help_articles (slug, title, summary, content, category_id, display_order, is_active) VALUES
('create-first-study-set', 'How to create your first study set', 'Learn how to upload materials and create your first AI-powered study set', '# How to Create Your First Study Set

Creating your first study set in Studily is quick and easy.

## Step 1: Navigate to Study Materials
From your dashboard, click on **Study Materials** in the sidebar.

## Step 2: Upload Your Content
Click **Upload** and select your materials (PDF, Word, text files, or images).

## Step 3: Configure AI Generation
Choose what to generate: Flashcards, Practice Questions, Summary Notes, or Concept Maps.

## Step 4: Start Studying
Once processing is complete, start studying with your personalized materials.

## Related Articles
- [[quick-start-guide]]
- [[understanding-dashboard]]', (SELECT id FROM help_categories WHERE slug = 'getting-started'), 1, true),

('quick-start-guide', 'Quick start guide for new users', 'Get up and running with Studily in just 5 minutes', '# Quick Start Guide

Welcome to Studily! Get started in just 5 minutes.

## Step 1: Create Your Account
Sign up with email or Google.

## Step 2: Set Up Your Profile
Add your name and study preferences in Settings.

## Step 3: Upload Materials
Go to Study Materials and upload your first document.

## Step 4: Explore Features
Check out Flashcards, Practice Questions, and AI Tutor.

## Related Articles
- [[create-first-study-set]]
- [[understanding-dashboard]]', (SELECT id FROM help_categories WHERE slug = 'getting-started'), 2, true),

('understanding-dashboard', 'Understanding your dashboard', 'Navigate your Studily dashboard like a pro', '# Understanding Your Dashboard

Your dashboard is your command center for productive studying.

## Key Features
- **Study Streak** - Track consecutive study days
- **XP & Level** - Earn points by studying
- **Quick Actions** - Fast access to common tasks

## Navigation
Use the sidebar to access Study Materials, Notes, Flashcards, Groups, and Progress.

## Related Articles
- [[quick-start-guide]]
- [[setting-up-profile]]', (SELECT id FROM help_categories WHERE slug = 'getting-started'), 3, true),

('setting-up-profile', 'Setting up your profile', 'Personalize your Studily experience', '# Setting Up Your Profile

Personalize Studily to match your study style.

## Profile Settings
1. Go to **Settings** > **Profile**
2. Add your display name and avatar
3. Set your study goal and preferences

## Study Preferences
- Preferred study time (morning/evening)
- Daily study goal in minutes
- Notification settings

## Related Articles
- [[quick-start-guide]]
- [[changing-password]]', (SELECT id FROM help_categories WHERE slug = 'getting-started'), 4, true),

('importing-existing-materials', 'Importing existing materials', 'Import your existing study materials from other apps', '# Importing Existing Materials

Bring your existing study content into Studily.

## Supported Formats
- PDF, Word (.docx), Text files
- Images with text (OCR enabled)

## How to Import
1. Go to Study Materials
2. Click Upload or drag files
3. Configure AI options
4. Click Process

## Related Articles
- [[create-first-study-set]]
- [[upload-errors]]', (SELECT id FROM help_categories WHERE slug = 'getting-started'), 5, true),

-- Notes & Editor (4)
('creating-first-note', 'Creating your first note', 'Learn to create and format notes in Studily', '# Creating Your First Note

## Getting Started
1. Click **Notes** in the sidebar
2. Click **+ New Note**
3. Give your note a title and start writing

## Features
- Rich text formatting
- Auto-save
- AI tools (summarize, generate flashcards)

## Related Articles
- [[formatting-options]]
- [[organizing-notes-folders]]', (SELECT id FROM help_categories WHERE slug = 'notes-editor'), 1, true),

('formatting-options', 'Formatting options', 'Format notes for better organization', '# Formatting Options

## Text Styles
- **Bold** (Ctrl+B), *Italic* (Ctrl+I), Underline (Ctrl+U)

## Structure
- Headers (H1, H2, H3)
- Bullet and numbered lists
- Checklists

## Related Articles
- [[creating-first-note]]
- [[adding-images-media]]', (SELECT id FROM help_categories WHERE slug = 'notes-editor'), 2, true),

('organizing-notes-folders', 'Organizing notes in folders', 'Keep your notes organized with folders', '# Organizing Notes in Folders

## Creating Folders
1. Go to Notes
2. Click **+ Folder**
3. Name and color your folder

## Moving Notes
Drag notes onto folders or use right-click menu.

## Related Articles
- [[creating-first-note]]', (SELECT id FROM help_categories WHERE slug = 'notes-editor'), 3, true),

('adding-images-media', 'Adding images and media', 'Add images and media to your notes', '# Adding Images and Media

## Adding Images
- Click the Image icon in toolbar
- Drag and drop files
- Paste from clipboard (Ctrl+V)

## Supported Formats
JPEG, PNG, GIF, WebP (max 5MB)

## Related Articles
- [[creating-first-note]]
- [[upload-errors]]', (SELECT id FROM help_categories WHERE slug = 'notes-editor'), 4, true),

-- Study Features (4)
('using-flashcards-effectively', 'Using flashcards effectively', 'Master the flashcard study mode', '# Using Flashcards Effectively

## Creating Flashcards
1. Go to Flashcards
2. Create a deck
3. Add cards with front/back content

## Study Mode
Rate yourself: Again, Hard, Good, or Easy. The spaced repetition algorithm optimizes your review schedule.

## Related Articles
- [[spaced-repetition-explained]]
- [[quiz-mode-guide]]', (SELECT id FROM help_categories WHERE slug = 'study-features'), 1, true),

('spaced-repetition-explained', 'Spaced repetition explained', 'How Studily optimizes your learning with spaced repetition', '# Spaced Repetition Explained

## What Is It?
A learning technique that shows information at increasing intervals based on your performance.

## How It Works
- Cards you know appear less frequently
- Difficult cards appear more often
- Algorithm adjusts based on your ratings

## Related Articles
- [[using-flashcards-effectively]]', (SELECT id FROM help_categories WHERE slug = 'study-features'), 2, true),

('ai-tutor-features', 'AI Tutor features', 'Get personalized explanations from the AI tutor', '# AI Tutor Features

## Accessing AI Tutor
1. Open any Study Material
2. Click the AI Chat tab
3. Ask questions about your content

## Capabilities
- Explain concepts
- Answer questions
- Provide examples
- Simplify complex topics

## Related Articles
- [[create-first-study-set]]
- [[quiz-mode-guide]]', (SELECT id FROM help_categories WHERE slug = 'study-features'), 3, true),

('quiz-mode-guide', 'Quiz mode guide', 'Test your knowledge with quiz mode', '# Quiz Mode Guide

## Starting a Quiz
1. Open a Study Material
2. Go to Practice Questions tab
3. Click Start Quiz

## Question Types
Multiple choice, True/False, Short answer

## Related Articles
- [[using-flashcards-effectively]]
- [[ai-tutor-features]]', (SELECT id FROM help_categories WHERE slug = 'study-features'), 4, true),

-- Collaboration (3)
('sharing-study-sets', 'Sharing study sets', 'Share your study sets with friends and classmates', '# Sharing Study Sets

## Sharing Flashcard Decks
1. Open a deck
2. Click Share
3. Copy and send the link

## Sharing Notes
Make notes public in Settings or share directly in study groups.

## Related Articles
- [[creating-study-groups]]', (SELECT id FROM help_categories WHERE slug = 'collaboration'), 1, true),

('creating-study-groups', 'Creating study groups', 'Learn together with study groups', '# Creating Study Groups

## Create a Group
1. Go to Groups
2. Click Create Group
3. Add name, description, privacy settings

## Features
- Real-time chat
- Shared notes
- Study sessions
- Polls

## Related Articles
- [[sharing-study-sets]]
- [[real-time-collaboration]]', (SELECT id FROM help_categories WHERE slug = 'collaboration'), 2, true),

('real-time-collaboration', 'Real-time collaboration', 'Work together on notes in real-time', '# Real-Time Collaboration

## Features
- Instant messaging
- Typing indicators
- Online status
- Read receipts

## Study Sessions
Schedule group study sessions with meeting links and RSVP tracking.

## Related Articles
- [[creating-study-groups]]', (SELECT id FROM help_categories WHERE slug = 'collaboration'), 3, true),

-- Account & Billing (4)
('changing-password', 'Changing your password', 'Update your account password', '# Changing Your Password

## Steps
1. Go to Settings > Security
2. Click Change Password
3. Enter current and new password
4. Click Update

## Forgot Password?
Use the Forgot Password link on the login page.

## Related Articles
- [[setting-up-profile]]
- [[contact-support]]', (SELECT id FROM help_categories WHERE slug = 'account-billing'), 1, true),

('managing-subscription', 'Managing subscription', 'Upgrade, downgrade, or cancel your plan', '# Managing Subscription

## View Your Plan
Go to Settings > Subscription

## Upgrading
Click Upgrade to Pro and enter payment details.

## Canceling
Click Cancel Subscription. Access continues until period ends.

## Related Articles
- [[billing-invoices]]', (SELECT id FROM help_categories WHERE slug = 'account-billing'), 2, true),

('billing-invoices', 'Billing and invoices', 'View and download your invoices', '# Billing and Invoices

## View History
Settings > Subscription > Billing History

## Download Invoices
Click the download icon next to any payment.

## Related Articles
- [[managing-subscription]]', (SELECT id FROM help_categories WHERE slug = 'account-billing'), 3, true),

('deleting-account', 'Deleting your account', 'How to permanently delete your account', '# Deleting Your Account

## Steps
1. Go to Settings
2. Scroll to Danger Zone
3. Click Delete Account
4. Confirm with password

**Warning:** This permanently removes all your data.

## Related Articles
- [[contact-support]]', (SELECT id FROM help_categories WHERE slug = 'account-billing'), 4, true),

-- Troubleshooting (4)
('app-not-loading', 'App not loading', 'Troubleshoot loading issues', '# App Not Loading

## Quick Fixes
1. Refresh the page (Ctrl+R)
2. Clear browser cache
3. Try a different browser
4. Check internet connection

## Related Articles
- [[sync-issues]]
- [[contact-support]]', (SELECT id FROM help_categories WHERE slug = 'troubleshooting'), 1, true),

('sync-issues', 'Sync issues', 'Fix problems with data synchronization', '# Sync Issues

## Troubleshooting
1. Check internet connection
2. Refresh the page
3. Log out and back in
4. Clear browser cache

## Related Articles
- [[app-not-loading]]
- [[contact-support]]', (SELECT id FROM help_categories WHERE slug = 'troubleshooting'), 2, true),

('upload-errors', 'Upload errors', 'Resolve file upload problems', '# Upload Errors

## Common Issues
- **File Too Large** - Compress or split files
- **Unsupported Format** - Convert to PDF/JPG/PNG
- **Upload Failed** - Check connection, retry

## Size Limits
Study materials: 25MB, Images: 5MB

## Related Articles
- [[importing-existing-materials]]
- [[contact-support]]', (SELECT id FROM help_categories WHERE slug = 'troubleshooting'), 3, true),

('contact-support', 'Contact support', 'Get help from our support team', '# Contact Support

## Email
support@studily.app

## Include
- Account email
- Issue description
- Screenshots if applicable

## Response Times
- Free: 48 hours
- Pro: 24 hours

## Related Articles
- [[app-not-loading]]
- [[sync-issues]]', (SELECT id FROM help_categories WHERE slug = 'troubleshooting'), 4, true);