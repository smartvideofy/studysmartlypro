
Goal: fix the “not fixed yet” formatting issue in Notebook AI Chat where markdown syntax (like `**bold**`) and raw citation markers appear unformatted.

What I found
- The screenshot text (“AI Chat • Multi-source context”) matches the Notebook chat UI, not Material chat.
- `src/components/notebooks/NotebookChatTab.tsx` still renders assistant messages as plain text:
  - `&lt;p className="text-sm whitespace-pre-wrap"&gt;{m.content}&lt;/p&gt;`
- Notebook chat currently does not:
  - render markdown via `react-markdown`
  - parse `X-Citation-Chunks` header
  - use citation chip rendering
- Material chat already has this implemented in:
  - `src/components/materials/tabs/AIChatTab.tsx`
  - `src/components/materials/tabs/CitationChip.tsx`

Root cause
- The markdown/citation formatting upgrade was applied to Material chat only.
- Notebook chat still uses the older plain-text renderer, so users see raw markdown symbols (`**`, list markers, etc.) and plain `[n]` citations.

Implementation approach
1. Update Notebook chat to support markdown rendering
   - File: `src/components/notebooks/NotebookChatTab.tsx`
   - Add `ReactMarkdown` import.
   - For assistant messages:
     - wrap output in a prose container (same typography pattern used in Material chat)
     - render markdown instead of plain text
   - Keep user messages as plain text with `whitespace-pre-wrap` (unchanged behavior).

2. Add citation chunk support to Notebook chat
   - File: `src/components/notebooks/NotebookChatTab.tsx`
   - Add `citationChunks` state typed as `Citation[]`.
   - Parse `X-Citation-Chunks` response header from `material-chat` (base64 decode + JSON parse), same logic as Material chat.
   - On assistant render:
     - if citation chunks exist, use `renderWithCitations(...)`
     - otherwise fallback to `&lt;ReactMarkdown&gt;`.

3. Add citation interaction behavior
   - File: `src/components/notebooks/NotebookChatTab.tsx`
   - Add a simple `handleCitationClick` callback (toast with source preview), matching Material chat UX so notebook and material experiences are consistent.

4. Keep scope tight (no backend changes)
   - `supabase/functions/material-chat/index.ts` already emits citation header and markdown-formatted content.
   - No edge-function update required for this fix.

Technical notes
- Reuse existing citation utilities from `src/components/materials/tabs/CitationChip.tsx` to avoid duplicate parsing/render logic.
- Preserve all existing streaming behavior and message persistence logic.
- Do not alter current notebook layout/scroll fixes (`min-h-0`, `overflow-hidden`) as they are unrelated and already correct.

Validation checklist (end-to-end)
1. Open a notebook chat and ask for a response likely to include formatting:
   - “Give bullet points with bold key terms.”
2. Confirm assistant output renders as formatted markdown (not raw `**` text).
3. Ask a citation-heavy question and confirm:
   - citation chips render inline instead of plain `[1]` text
   - clicking a citation shows source preview toast
4. Regression check Material chat still renders correctly.
5. Test on mobile + desktop to ensure formatting works and tab content remains scrollable/visible.

Expected outcome
- Notebook AI chat displays clean rich text formatting (bold/lists/paragraphs) and citation chips, matching Material workspace behavior and removing the raw-symbol issue users are seeing.
