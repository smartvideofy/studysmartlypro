

# Study Materials Pipeline Audit: NotebookLM Feature Comparison

## What NotebookLM Offers (2025)

NotebookLM is Google's AI research assistant. Its core features include:

1. **Multi-source notebooks** -- Upload up to 50 sources per notebook (PDFs, Google Docs/Slides, web URLs, YouTube videos, audio files, plain text). Sources are cross-referenced together.
2. **Grounded AI Chat** -- Chat that answers ONLY from your sources, with inline clickable citations that jump to the exact passage in the source.
3. **Audio Overview ("Deep Dive Podcast")** -- Two AI hosts discuss your material in a podcast-style conversation. Users can customize style (deep dive, brief, etc.) and even "join" the conversation to ask questions mid-playback.
4. **Notebook Guide** -- Auto-generated structured overview: FAQ, Study Guide, Table of Contents, Timeline, Briefing Doc. Each is a one-click generation.
5. **Mind Maps** -- Visual concept maps showing relationships between ideas.
6. **Source-level summaries** -- Each uploaded source gets its own auto-summary visible in a side panel.
7. **Multi-source cross-referencing** -- Ask questions that span multiple documents and get synthesized answers with per-source citations.
8. **Inline citations** -- Every AI response includes numbered citations that link directly to the exact location in the source document.
9. **Notes/Pinning** -- Save important AI responses as "notes" within the notebook for later reference.
10. **Sharing and collaboration** -- Share notebooks with others.
11. **50+ language support**
12. **Web URL and Google Docs as sources** -- Not just file uploads.

---

## Feature-by-Feature Comparison

| Feature | NotebookLM | Your App | Gap |
|---|---|---|---|
| Multi-source notebooks | Up to 50 sources per notebook, cross-referenced | 1 source per material | **Critical gap** |
| Grounded AI Chat | Inline numbered citations linking to exact source passages | Chat exists but citations are basic/non-functional regex matching | **Major gap** |
| Audio Overview | Two AI hosts, customizable style, interactive "join the conversation" | Audio overview exists with 4 styles but requires ElevenLabs key (not configured) | **Partial** -- feature exists but non-functional without API key |
| Notebook Guide (FAQ, Study Guide, Timeline, Briefing Doc) | One-click generation of 5+ output formats | Tutor Notes + 3 Summary types | **Minor gap** -- could add FAQ, Timeline, Briefing Doc as output types |
| Mind/Concept Map | Interactive mind map | React Flow concept map exists | **Parity** |
| Flashcards | Not a core feature (community workaround) | Full flashcard generation, save to deck, study mode, SRS | **Your app wins** |
| Practice Questions/Quiz | Not a core feature | MCQ, short answer, case-based, quiz mode with scoring | **Your app wins** |
| Source-level auto-summary | Each source summarized on upload | Summaries generated (quick, detailed, bullet) | **Parity** |
| Inline citations in AI responses | Precise, clickable, jumps to source passage | CitationChip component exists but regex-based and unreliable | **Major gap** |
| Save/Pin AI responses | Pin important responses as notes | Not implemented | **Gap** |
| Multi-source cross-referencing | Ask across all sources | Single-source only | **Critical gap** |
| Web URL as source | Paste any URL | YouTube URL only | **Gap** |
| Google Docs/Slides integration | Native | Not available | **Gap** (acceptable) |
| Export | Copy text | Markdown, TXT, CSV, Anki-compatible | **Your app wins** |
| Collaboration | Share notebooks | Not available for materials | **Gap** |

---

## Critical Gaps to Address (Prioritized)

### 1. Multi-Source Notebooks (Critical -- Architectural Change)
NotebookLM's killer feature is combining multiple documents into one "notebook" and asking questions across all of them. Your app treats each upload as isolated.

**Implementation:**
- Add a `notebooks` table: `id`, `user_id`, `title`, `created_at`
- Add a junction table `notebook_materials`: `notebook_id`, `material_id`
- Update the workspace to allow selecting multiple materials for a notebook
- Update the AI Chat edge function to concatenate extracted content from all materials in a notebook
- Update the upload flow: user can upload into an existing notebook or create a new one

### 2. Reliable Inline Citations in AI Chat (Major)
The `CitationChip` component and `parseCitations` function exist but use fragile regex matching (`[source: page X]`). The AI model doesn't consistently output these markers, making citations unreliable.

**Implementation:**
- Update the `material-chat` edge function system prompt to explicitly instruct the model to output citations in a specific format (e.g., `[1]`, `[2]`) referencing chunks
- Before sending to AI, chunk the extracted content into numbered passages (e.g., every 500 characters or by paragraph)
- Include the numbered chunks in the system prompt so the AI can reference them
- Parse the AI response client-side to render CitationChip components that, when clicked, scroll to or highlight the relevant passage in the MaterialViewer

### 3. Save/Pin AI Chat Responses as Notes (Medium)
NotebookLM lets you "pin" an AI response to save it as a note in your notebook.

**Implementation:**
- Add a `saved_responses` table: `id`, `material_id`, `user_id`, `content`, `created_at`
- Add a "Save" button on each AI chat response bubble
- Add a "Saved Notes" section accessible from the workspace (could be a new tab or a panel within the existing Tutor Notes tab)

### 4. Web URL as Source (Medium)
NotebookLM allows pasting any web URL. Your app only supports YouTube URLs.

**Implementation:**
- Add a "Web URL" tab in the UploadMaterialModal alongside File and YouTube
- Create or extend the `process-material` edge function to fetch the URL, extract text content (using the AI gateway to summarize/extract from the HTML), and store it as `extracted_content`
- Validate URLs and handle common edge cases (paywalled content, dynamic JS sites)

### 5. Notebook Guide -- Additional Output Types (Low)
NotebookLM generates FAQ, Timeline, and Briefing Doc formats. Your app has Tutor Notes, Summaries, and Flashcards but lacks these specific formats.

**Implementation:**
- Add "FAQ" and "Timeline" as new summary types in the `summaries` table
- Update the `process-material` edge function to generate these additional formats
- Add corresponding tabs or sub-tabs in the SummariesTab component

### 6. Audio Overview -- Make Functional (Low)
The AudioOverviewTab exists with a complete UI but requires an ElevenLabs API key that isn't configured.

**Implementation:**
- Either: Configure the `ELEVENLABS_API_KEY` secret and wire up the `generate-audio-overview` function
- Or: Pivot to a text-to-speech approach using the browser's built-in `SpeechSynthesis` API for a basic but functional version
- The script generation already works via the Lovable AI Gateway -- only the audio synthesis step is blocked

---

## What Your App Already Does Better Than NotebookLM

These are strengths to preserve and highlight:

1. **Flashcards with SRS** -- Full spaced repetition system with save-to-deck, difficulty tracking, and study mode
2. **Practice Questions with Quiz Mode** -- MCQ, short answer, case-based questions with scoring and explanations
3. **Export flexibility** -- Markdown, TXT, CSV, Anki-compatible exports
4. **Tutor Notes structure** -- Hierarchical topic/subtopic notes with definitions, examples, and exam tips (more structured than NotebookLM's outputs)
5. **Concept Map** -- Interactive React Flow-based concept map (NotebookLM's mind maps are static images)

---

## Recommended Implementation Order

1. **Inline Citations in AI Chat** -- Highest impact for perceived quality, moderate effort. Update the edge function prompt + client-side parsing.
2. **Save/Pin AI Responses** -- Small effort, high UX value. New DB table + button on chat bubbles.
3. **Web URL as Source** -- Expands input types significantly. New tab in upload modal + URL fetching in edge function.
4. **Multi-Source Notebooks** -- Highest architectural effort but the most transformative feature. New DB tables, updated workspace UI, updated AI chat function.
5. **Additional Output Types (FAQ, Timeline)** -- Low effort, adds variety to generated content.
6. **Audio Overview activation** -- Depends on ElevenLabs API key availability or fallback to browser TTS.

---

## Technical Details

### Files to Create:
- `src/hooks/useNotebooks.tsx` -- CRUD hooks for notebooks (for multi-source feature)
- `src/components/materials/SaveResponseButton.tsx` -- Pin/save button for chat responses
- `src/components/materials/SavedResponsesPanel.tsx` -- Panel showing saved AI responses

### Files to Modify:
- `supabase/functions/material-chat/index.ts` -- Add chunked content with numbered references for citations; support multi-material context
- `src/components/materials/tabs/AIChatTab.tsx` -- Render CitationChips from AI responses; add save button per response
- `src/components/materials/tabs/CitationChip.tsx` -- Update `parseCitations` to use numbered reference format instead of fragile regex
- `src/components/materials/UploadMaterialModal.tsx` -- Add "Web URL" tab for pasting any URL
- `supabase/functions/process-material/index.ts` -- Add URL content extraction; add FAQ/Timeline generation
- `src/hooks/useStudyMaterials.tsx` -- Add hooks for saved responses
- `src/pages/MaterialWorkspace.tsx` -- Support notebook context (multiple materials)

### Database Migrations Needed:
1. `saved_responses` table for pinned AI chat responses
2. `notebooks` and `notebook_materials` tables for multi-source support
3. New summary types ('faq', 'timeline') added to summaries table

