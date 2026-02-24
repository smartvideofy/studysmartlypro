

# Notebooks: Combined Multi-Material Study Experience

## The Problem You Described

Currently, each uploaded material is processed **independently** -- it gets its own tutor notes, its own flashcards, its own quiz questions. When a student uploads 5 files for "Cell Biology Unit 3" (lecture slides, textbook chapter, past exam, professor's notes), they get 5 separate sets of everything with no cross-referencing.

What students actually need: Upload all materials for a unit/topic, and get **one unified set** of tutor notes, flashcards, quizzes, and concept maps that synthesizes knowledge across ALL sources.

## The Concept: Notebooks

A **Notebook** is a study container that groups multiple source materials and generates combined AI content from all of them together.

```text
+---------------------+
|    Notebook          |
|   "Cell Biology U3"  |
+---------------------+
     |
     +-- Source: Lecture Slides.pdf
     +-- Source: Textbook Ch5.pdf
     +-- Source: Past Exam 2024.pdf
     +-- Source: Prof Notes.docx
     |
     +-- COMBINED Tutor Notes (from all 4 sources)
     +-- COMBINED Flashcards (from all 4 sources)
     +-- COMBINED Practice Questions
     +-- COMBINED Concept Map
     +-- AI Chat (with context from all 4 sources)
```

## How It Differs From Folders

Folders are just organizational containers (like file system directories). Notebooks are **active study units** that:
- Combine extracted content from all sources before sending to AI
- Generate unified study materials that cross-reference across sources
- Provide a single chat interface with context from all sources
- Track progress at the notebook level

## Technical Plan

### Phase 1: Database Schema

**New table: `notebooks`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| title | text | e.g. "Cell Biology Unit 3" |
| description | text | Optional description |
| subject | text | Academic subject |
| topic | text | Specific topic |
| language | text | Default 'en' |
| processing_status | text | pending/processing/completed/failed |
| processing_error | text | Error details if failed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Modify `study_materials`**: Add `notebook_id` column (nullable uuid, references notebooks.id). Materials can exist standalone OR belong to a notebook.

**New content tables** (notebook-level, mirroring existing per-material tables):
- `notebook_tutor_notes` (id, notebook_id, user_id, content jsonb)
- `notebook_summaries` (id, notebook_id, user_id, summary_type, content text)
- `notebook_flashcards` (id, notebook_id, user_id, front, back, hint, difficulty)
- `notebook_practice_questions` (id, notebook_id, user_id, question_type, question, options, correct_answer, explanation)
- `notebook_concept_maps` (id, notebook_id, user_id, nodes jsonb, edges jsonb)

RLS policies: All tables secured with `auth.uid() = user_id`.

### Phase 2: Upload Flow Changes

**Modified Upload Modal:**
- Add a "Create Notebook" option alongside "Upload Material"
- When creating a notebook: user enters a notebook name, subject, topic, then drops multiple files
- All files are uploaded as individual `study_materials` records with `notebook_id` set
- Each material is extracted independently (the extract step runs per-file as today)
- Once ALL materials in the notebook finish extraction, a **notebook-level processing pipeline** runs to generate combined content

**Notebook creation flow:**
1. User clicks "Create Notebook" on the materials page
2. Enters notebook name, subject, topic
3. Drops/selects multiple files (up to 10)
4. Each file uploads and extracts independently (parallel)
5. System monitors when all extractions complete
6. Triggers combined content generation using concatenated extracted text from all sources

### Phase 3: Notebook Processing Pipeline

**New edge function logic** (or extend `process-material`):
- Collects `extracted_content` from ALL materials in the notebook
- Concatenates with source attribution markers (e.g., `[Source: Lecture Slides] ...content... [Source: Textbook Ch5] ...content...`)
- Sends combined text to Gemini for each generation step
- Stores results in notebook-level tables
- Individual materials still keep their per-material content (if generated)

**Pipeline steps** (similar to existing):
1. Wait for all material extractions to complete
2. Generate combined tutor notes
3. Generate combined summaries
4. Generate combined flashcards
5. Generate combined practice questions
6. Generate combined concept map
7. Mark notebook as completed

### Phase 4: Notebook Workspace UI

**New page: `/notebooks/:id`** -- similar to `MaterialWorkspace` but:
- **Left panel**: List of all source materials in the notebook (clickable to view each)
- **Right panel**: Combined study tools (tutor notes, flashcards, quiz, concept map, AI chat)
- AI Chat has context from ALL sources
- Can add/remove materials from a notebook after creation (triggers re-generation)

### Phase 5: Materials Page Updates

- Show notebooks as distinct cards on the materials page (with a notebook icon and source count badge)
- Clicking a notebook opens the notebook workspace
- Individual materials that belong to a notebook show a small notebook badge
- Folder filtering still works -- notebooks can optionally belong to a folder

---

## Implementation Order

1. **Database migration** -- Create `notebooks` table, add `notebook_id` to `study_materials`, create notebook content tables with RLS
2. **Notebook CRUD hooks** -- `useNotebooks`, `useCreateNotebook`, `useNotebookMaterials`
3. **Create Notebook Modal** -- UI for creating a notebook with multiple file uploads
4. **Notebook processing pipeline** -- Edge function logic to combine content from multiple sources
5. **Notebook Workspace page** -- Split-screen UI with multi-source viewer and combined study tools
6. **Materials page integration** -- Show notebooks alongside individual materials

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/` | New migration for notebooks schema |
| `src/hooks/useNotebooks.tsx` | New -- CRUD hooks for notebooks |
| `src/components/materials/CreateNotebookModal.tsx` | New -- notebook creation UI |
| `src/pages/NotebookWorkspace.tsx` | New -- notebook workspace page |
| `src/pages/StudyMaterialsPage.tsx` | Modify -- show notebooks |
| `src/components/materials/NotebookCard.tsx` | New -- notebook card component |
| `supabase/functions/process-material/index.ts` | Modify -- add notebook-level generation |
| `src/lib/processMaterialPipeline.ts` | Modify -- add notebook pipeline |
| `src/components/AnimatedRoutes.tsx` | Modify -- add notebook route |
| `src/components/materials/UploadMaterialModal.tsx` | Modify -- option to assign to notebook |

