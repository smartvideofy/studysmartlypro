

# Switch from Lovable AI Gateway to Google Gemini API

## Overview
Replace all Lovable AI Gateway calls across 6 edge functions with direct Google Gemini API calls. This eliminates dependency on Lovable AI credits and uses your own Gemini API key instead.

## Step 1: Add Gemini API Key Secret
- You'll need a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- Store it as a Supabase secret called `GEMINI_API_KEY`

## Step 2: Update All 6 Edge Functions

Each function currently calls:
```text
POST https://ai.gateway.lovable.dev/v1/chat/completions
Authorization: Bearer {LOVABLE_API_KEY}
Body: { model: "google/gemini-3-flash-preview", messages: [...] }
```

Will be changed to:
```text
POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
Authorization: Bearer {GEMINI_API_KEY}
Body: { model: "gemini-2.5-flash", messages: [...] }
```

Google's Gemini API supports the OpenAI-compatible endpoint, so the request/response format stays almost identical -- only the URL, API key, and model name change.

### Files to modify:
1. **`supabase/functions/process-material/index.ts`** -- Main material processing (extraction + 6 generation steps)
2. **`supabase/functions/regenerate-content/index.ts`** -- Content regeneration
3. **`supabase/functions/ai-notes/index.ts`** -- AI note summarization and flashcard generation
4. **`supabase/functions/process-video/index.ts`** -- YouTube video processing
5. **`supabase/functions/material-chat/index.ts`** -- Chat with materials
6. **`supabase/functions/generate-audio-overview/index.ts`** -- Audio overview script generation

### Changes per file:
- Replace `LOVABLE_API_KEY` with `GEMINI_API_KEY` in env reads
- Replace gateway URL with `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- Update model names from `google/gemini-3-flash-preview` to `gemini-2.5-flash`
- Keep error handling for 429 (rate limit) and 402 (quota) as Gemini returns similar status codes

## Step 3: Update Error Messages
Change user-facing error messages from "Lovable AI credits" references to "Gemini API quota" so they make sense with the new provider.

## Model Mapping
| Current (Lovable Gateway)         | New (Direct Gemini)    |
|-----------------------------------|------------------------|
| google/gemini-3-flash-preview     | gemini-2.5-flash       |
| google/gemini-2.5-pro             | gemini-2.5-pro         |

Using `gemini-2.5-flash` as the default -- it's fast, capable, and cost-effective.

## No Frontend Changes Needed
All AI calls happen in edge functions. The frontend only calls the edge functions via `supabase.functions.invoke()`, so no client-side code changes are required.

## Prerequisites
- A Google Gemini API key (free tier available at [Google AI Studio](https://aistudio.google.com/apikey))
