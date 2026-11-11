-- Help centre: replace the "Notes & Editor" topic (the notes editor was removed; /notes redirects
-- to /materials) with an active "Study materials" topic describing how the app works now.
-- Data-only and idempotent: safe to run more than once.

begin;

update public.help_categories
   set is_active = true,
       title = 'Study materials',
       description = 'Uploading files and what Studily makes from them',
       display_order = 2
 where slug = 'study-materials';

update public.help_categories set is_active = false where slug = 'notes-editor';

update public.help_articles
   set category_id = (select id from public.help_categories where slug = 'study-materials'),
       slug = 'uploading-study-material',
       title = 'Uploading your study material',
       content = $md$# Uploading your study material

1. Click **Upload** at the top of any page.
2. Drop in a file, or paste a YouTube or web link.
3. Click **Upload**. The title is taken from the file name unless you type one.

Studily reads the whole document and builds your study set in about a minute. You can keep using the app while it works; the material shows **Ready** when it's done.

**More options** in the upload window lets you set the subject, folder and language, and choose what to generate.$md$
 where slug in ('creating-first-note', 'uploading-study-material');

update public.help_articles
   set category_id = (select id from public.help_categories where slug = 'study-materials'),
       slug = 'what-studily-makes',
       title = 'What Studily makes from your material',
       content = $md$# What Studily makes from your material

Open any material to find these tabs:

- **Notes**: structured tutor notes with key terms, examples and exam tips.
- **Summary**: a quick, a detailed and a key-points summary.
- **Flashcards**: cards you can review with spaced repetition.
- **Quiz**: practice questions with explanations.
- **Concept map**: how the main ideas connect.
- **Ask AI**: chat with a tutor that answers only from your material, with citations.

Use **Original file** to view your document next to the study tools. **Regenerate** on any tab makes a fresh version.$md$
 where slug in ('formatting-options', 'what-studily-makes');

update public.help_articles
   set category_id = (select id from public.help_categories where slug = 'study-materials'),
       slug = 'organizing-materials',
       title = 'Organizing materials in folders and notebooks',
       content = $md$# Organizing materials in folders and notebooks

## Folders
1. Go to **Study Materials**.
2. Click **New Folder** and give it a name.
3. Choose the folder when you upload, or move a material from its menu.

## Notebooks
A notebook combines several materials (for example all the lectures for one course) so you can study them together. Click **Create Notebook** on the Study Materials page and pick the materials to include.$md$
 where slug in ('organizing-notes-folders', 'organizing-materials');

update public.help_articles
   set category_id = (select id from public.help_categories where slug = 'study-materials'),
       slug = 'supported-files',
       title = 'Supported files and limits',
       content = $md$# Supported files and limits

- **Documents**: PDF, Word (.docx) and PowerPoint (.pptx), up to 50 MB.
- **Images**: photos or screenshots of notes and textbook pages.
- **Audio**: lecture recordings up to 25 MB (about 25 minutes).
- **Links**: YouTube videos and web articles.

**Scanned PDFs** (photos of pages) work too, up to 10 MB. If a file has no readable text, Studily tells you instead of guessing.

If a material says its notes **weren't made from your file**, open it and click **Rebuild from my file**.$md$
 where slug in ('adding-images-media', 'supported-files');

commit;
