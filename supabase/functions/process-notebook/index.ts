import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-2.5-flash';

type NotebookStep = 'tutor_notes' | 'summaries' | 'flashcards' | 'questions' | 'concept_map' | 'complete';

async function callGeminiAI(messages: any[]): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${geminiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: GEMINI_MODEL, messages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    if (response.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
    if (response.status === 402 || response.status === 403) throw new Error('QUOTA_EXCEEDED');
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseJSON(text: string): any {
  let jsonContent = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonContent = jsonMatch[1].trim();
  return JSON.parse(jsonContent);
}

/**
 * Build the combined content string from all materials in a notebook.
 * Each material's extracted content is prefixed with a source attribution marker.
 */
async function buildCombinedContent(supabase: any, notebookId: string): Promise<{ combinedContent: string; materialCount: number }> {
  const { data: materials, error } = await supabase
    .from('study_materials')
    .select('id, title, file_name, extracted_content')
    .eq('notebook_id', notebookId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Failed to fetch notebook materials: ' + error.message);
  if (!materials || materials.length === 0) throw new Error('No materials found in this notebook');

  const parts: string[] = [];
  for (const m of materials) {
    const sourceName = m.title || m.file_name || 'Untitled';
    const content = m.extracted_content || '(No content extracted)';
    parts.push(`[Source: ${sourceName}]\n${content}`);
  }

  // Truncate total to ~120k chars to stay within context limits
  let combined = parts.join('\n\n---\n\n');
  if (combined.length > 120000) {
    combined = combined.substring(0, 120000) + '\n\n[Content truncated due to length]';
  }

  return { combinedContent: combined, materialCount: materials.length };
}

// ─── Generation Functions (notebook-level) ───

async function generateNotebookTutorNotes(combinedContent: string, notebook: any): Promise<object> {
  const systemPrompt = `You are an expert academic tutor. Create comprehensive tutor notes that SYNTHESIZE knowledge across multiple sources. Cross-reference information from different sources to build a unified understanding.

When information from different sources overlaps, merge them into the best explanation. When sources provide unique perspectives, include all of them.

Your notes must be DETAILED (200-300 words per subtopic), ACADEMIC, STRUCTURED, and EXAM-FOCUSED.

For each subtopic, include:
1. Comprehensive explanation synthesized across ALL sources
2. At least 3-5 key definitions
3. Multiple examples (at least 2-3)
4. Exam tips
5. Source references where relevant (e.g., "As covered in [Source: Lecture Notes]...")

Respond ONLY with valid JSON:
{
  "topics": [
    {
      "title": "Topic Title",
      "subtopics": [
        {
          "title": "Subtopic Title",
          "content": "Comprehensive explanation synthesized from multiple sources...",
          "definitions": [{"term": "Term", "definition": "Definition"}],
          "examples": ["Example 1", "Example 2"],
          "exam_tips": ["Tip 1", "Tip 2"]
        }
      ]
    }
  ]
}`;

  const userPrompt = `Create comprehensive, synthesized tutor notes from these ${notebook.material_count || 'multiple'} study sources.

Notebook: ${notebook.title}
Subject: ${notebook.subject || 'General'}
Topic: ${notebook.topic || 'Not specified'}

Combined Sources:
${combinedContent.substring(0, 50000)}

Generate unified notes that cross-reference and synthesize ALL sources.`;

  const responseText = await callGeminiAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try {
    return parseJSON(responseText);
  } catch {
    return { topics: [{ title: 'Notes', subtopics: [{ title: 'Content', content: responseText }] }] };
  }
}

async function generateNotebookSummaries(combinedContent: string, notebook: any): Promise<{ type: string; content: string }[]> {
  const summaries: { type: string; content: string }[] = [];

  const quickPrompt = `Create a concise 2-minute summary that synthesizes the key takeaways across ALL sources in this notebook.

Notebook: ${notebook.title}
Subject: ${notebook.subject || 'General'}

Sources:
${combinedContent.substring(0, 30000)}

Write 2-3 paragraphs capturing the unified essence across all sources.`;

  try {
    const quickContent = await callGeminiAI([{ role: 'user', content: quickPrompt }]);
    summaries.push({ type: 'quick', content: quickContent });
  } catch (e) {
    console.error('Quick summary failed:', e);
    throw e;
  }

  const detailedPrompt = `Create a comprehensive, detailed summary that synthesizes ALL sources in this notebook.

Notebook: ${notebook.title}
Subject: ${notebook.subject || 'General'}
Topic: ${notebook.topic || 'Not specified'}

Sources:
${combinedContent.substring(0, 50000)}

Structure: Overview, Key Concepts (merged across sources), Important Details, Cross-Source Connections, Summary.`;

  try {
    const detailedContent = await callGeminiAI([{ role: 'user', content: detailedPrompt }]);
    summaries.push({ type: 'detailed', content: detailedContent });
  } catch (e) { console.error('Detailed summary failed:', e); }

  const bulletPrompt = `Extract the key points from ALL sources in this notebook as a numbered list.

Notebook: ${notebook.title}
Sources:
${combinedContent.substring(0, 30000)}

Create 15-20 key points that span across all sources. Note which source each point comes from when relevant.`;

  try {
    const bulletContent = await callGeminiAI([{ role: 'user', content: bulletPrompt }]);
    summaries.push({ type: 'bullet_points', content: bulletContent });
  } catch (e) { console.error('Bullet summary failed:', e); }

  return summaries;
}

async function generateNotebookFlashcards(combinedContent: string, notebook: any): Promise<object[]> {
  const systemPrompt = `You are an expert at creating effective flashcards. Create 30 high-quality flashcards that cover key concepts ACROSS ALL sources. Prioritize concepts that appear in multiple sources, then add unique concepts from individual sources.

Return ONLY valid JSON array:
[
  {
    "front": "Clear question or term",
    "back": "Comprehensive answer synthesized from multiple sources",
    "hint": "Optional hint",
    "difficulty": "easy|medium|hard"
  }
]`;

  const userPrompt = `Create 30 flashcards synthesized from all sources in this notebook.

Notebook: ${notebook.title}
Subject: ${notebook.subject || 'General'}
Topic: ${notebook.topic || 'Not specified'}

Sources:
${combinedContent.substring(0, 50000)}`;

  const responseText = await callGeminiAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try { return parseJSON(responseText); } catch { return []; }
}

async function generateNotebookQuestions(combinedContent: string, notebook: any): Promise<object[]> {
  const systemPrompt = `You are an expert educator. Create 20 high-quality practice questions that test understanding ACROSS multiple sources. Include questions that require synthesizing information from different sources.

Include a mix: 8 MCQ (4 options each), 5 short answer, 4 application, 3 analytical.

Return ONLY valid JSON array:
[
  {
    "question_type": "mcq",
    "question": "Question that may draw from multiple sources?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "The correct option text",
    "explanation": "Explanation referencing relevant sources"
  },
  {
    "question_type": "short_answer",
    "question": "Question?",
    "correct_answer": "Model answer",
    "explanation": "Key points"
  }
]`;

  const userPrompt = `Create 20 practice questions from all sources:

Notebook: ${notebook.title}
Subject: ${notebook.subject || 'General'}
Topic: ${notebook.topic || 'Not specified'}

Sources:
${combinedContent.substring(0, 50000)}`;

  const responseText = await callGeminiAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try { return parseJSON(responseText); } catch { return []; }
}

async function generateNotebookConceptMap(combinedContent: string, notebook: any): Promise<object> {
  const systemPrompt = `You are an expert at creating concept maps. Create a comprehensive concept map with 15-20 nodes that shows how concepts connect ACROSS different sources.

Return ONLY valid JSON:
{
  "nodes": [
    {"id": "1", "label": "Concept", "x": 400, "y": 50, "description": "Description with source references"}
  ],
  "edges": [
    {"source": "1", "target": "2", "label": "relationship"}
  ]
}`;

  const userPrompt = `Create a concept map that connects ideas across all sources:

Notebook: ${notebook.title}
Subject: ${notebook.subject || 'General'}
Topic: ${notebook.topic || 'Not specified'}

Sources:
${combinedContent.substring(0, 40000)}`;

  const responseText = await callGeminiAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try { return parseJSON(responseText); } catch { return { nodes: [], edges: [] }; }
}

// ─── Step handlers ───

async function handleTutorNotesStep(supabase: any, notebookId: string, userId: string, combinedContent: string, notebook: any) {
  console.log('Generating notebook tutor notes...');
  const tutorNotes = await generateNotebookTutorNotes(combinedContent, notebook);
  
  // Delete existing then insert
  await supabase.from('notebook_tutor_notes').delete().eq('notebook_id', notebookId);
  await supabase.from('notebook_tutor_notes').insert({
    notebook_id: notebookId,
    user_id: userId,
    content: tutorNotes,
  });
  console.log('Notebook tutor notes generated');
}

async function handleSummariesStep(supabase: any, notebookId: string, userId: string, combinedContent: string, notebook: any) {
  console.log('Generating notebook summaries...');
  const summaries = await generateNotebookSummaries(combinedContent, notebook);
  
  await supabase.from('notebook_summaries').delete().eq('notebook_id', notebookId);
  for (const summary of summaries) {
    await supabase.from('notebook_summaries').insert({
      notebook_id: notebookId,
      user_id: userId,
      summary_type: summary.type,
      content: summary.content,
    });
  }
  console.log('Notebook summaries generated');
}

async function handleFlashcardsStep(supabase: any, notebookId: string, userId: string, combinedContent: string, notebook: any) {
  console.log('Generating notebook flashcards...');
  const flashcards = await generateNotebookFlashcards(combinedContent, notebook);
  
  await supabase.from('notebook_flashcards').delete().eq('notebook_id', notebookId);
  for (const card of flashcards) {
    await supabase.from('notebook_flashcards').insert({
      notebook_id: notebookId,
      user_id: userId,
      front: (card as any).front,
      back: (card as any).back,
      hint: (card as any).hint || null,
      difficulty: (card as any).difficulty || 'medium',
    });
  }
  console.log('Notebook flashcards generated');
}

async function handleQuestionsStep(supabase: any, notebookId: string, userId: string, combinedContent: string, notebook: any) {
  console.log('Generating notebook practice questions...');
  const questions = await generateNotebookQuestions(combinedContent, notebook);
  
  await supabase.from('notebook_practice_questions').delete().eq('notebook_id', notebookId);
  for (const q of questions) {
    await supabase.from('notebook_practice_questions').insert({
      notebook_id: notebookId,
      user_id: userId,
      question_type: (q as any).question_type || 'short_answer',
      question: (q as any).question,
      options: (q as any).options || null,
      correct_answer: (q as any).correct_answer || null,
      explanation: (q as any).explanation || null,
    });
  }
  console.log('Notebook practice questions generated');
}

async function handleConceptMapStep(supabase: any, notebookId: string, userId: string, combinedContent: string, notebook: any) {
  console.log('Generating notebook concept map...');
  const conceptMap = await generateNotebookConceptMap(combinedContent, notebook);
  
  await supabase.from('notebook_concept_maps').delete().eq('notebook_id', notebookId);
  await supabase.from('notebook_concept_maps').insert({
    notebook_id: notebookId,
    user_id: userId,
    nodes: (conceptMap as any).nodes || [],
    edges: (conceptMap as any).edges || [],
  });
  console.log('Notebook concept map generated');
}

// ─── Main handler ───

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const { notebookId, step } = await req.json();

    if (!notebookId) throw new Error('Notebook ID is required');
    if (!step) throw new Error('Step is required');

    console.log(`Processing notebook: ${notebookId}, step: ${step}`);

    // Fetch notebook
    const { data: notebook, error: nbError } = await supabase
      .from('notebooks')
      .select('*')
      .eq('id', notebookId)
      .single();

    if (nbError || !notebook) throw new Error('Notebook not found');

    // Ownership check — prevent IDOR
    if (notebook.user_id !== userId) {
      console.error(`Ownership mismatch: user ${userId} tried to process notebook owned by ${notebook.user_id}`);
      return new Response(
        JSON.stringify({ error: 'You do not have permission to process this notebook' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For the 'complete' step, skip fetching combined content — it's not needed
    if (step === 'complete') {
      await supabase.from('notebooks').update({
        processing_status: 'completed',
        processing_error: null,
      }).eq('id', notebookId);
      console.log('Notebook processing completed');
    } else {
      // Build combined content from all materials
      const { combinedContent, materialCount } = await buildCombinedContent(supabase, notebookId);
      const notebookWithCount = { ...notebook, material_count: materialCount };

      console.log(`Combined content from ${materialCount} materials: ${combinedContent.length} chars`);

      // Update status to processing
      await supabase.from('notebooks').update({ processing_status: 'processing' }).eq('id', notebookId);

      switch (step as NotebookStep) {
        case 'tutor_notes':
          await handleTutorNotesStep(supabase, notebookId, userId, combinedContent, notebookWithCount);
          break;
        case 'summaries':
          await handleSummariesStep(supabase, notebookId, userId, combinedContent, notebookWithCount);
          break;
        case 'flashcards':
          await handleFlashcardsStep(supabase, notebookId, userId, combinedContent, notebookWithCount);
          break;
        case 'questions':
          await handleQuestionsStep(supabase, notebookId, userId, combinedContent, notebookWithCount);
          break;
        case 'concept_map':
          await handleConceptMapStep(supabase, notebookId, userId, combinedContent, notebookWithCount);
          break;
        default:
          throw new Error(`Unknown step: ${step}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, step }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notebook processing error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userFriendlyError = errorMessage;
    let statusCode = 500;

    if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
      userFriendlyError = 'AI service is busy. Please try again in a few moments.';
      statusCode = 429;
    } else if (errorMessage === 'QUOTA_EXCEEDED') {
      userFriendlyError = 'Gemini API quota exceeded. Please check your API key usage.';
      statusCode = 402;
    }

    try {
      const { notebookId } = await req.clone().json();
      if (notebookId) {
        await supabase.from('notebooks').update({
          processing_status: 'failed',
          processing_error: userFriendlyError,
        }).eq('id', notebookId);
      }
    } catch { /* best effort */ }

    return new Response(
      JSON.stringify({ error: userFriendlyError }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
