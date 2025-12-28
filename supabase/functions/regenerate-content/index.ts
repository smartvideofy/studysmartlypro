import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated client to verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { materialId, contentType } = await req.json();
    
    if (!materialId || !contentType) {
      return new Response(
        JSON.stringify({ error: "materialId and contentType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Regenerating ${contentType} for material: ${materialId}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the study material with extracted content
    const { data: material, error: materialError } = await supabase
      .from("study_materials")
      .select("*")
      .eq("id", materialId)
      .single();

    if (materialError || !material) {
      console.error("Material not found:", materialError);
      return new Response(
        JSON.stringify({ error: "Material not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns this material
    if (material.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedContent = material.extracted_content;
    if (!extractedContent) {
      return new Response(
        JSON.stringify({ error: "No extracted content available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = material.user_id;
    const subject = material.subject || "General";
    const topic = material.topic || material.title;

    // Generate content based on type
    if (contentType === "tutor_notes") {
      await regenerateTutorNotes(supabase, lovableApiKey, materialId, userId, extractedContent, subject, topic);
    } else if (contentType === "summaries") {
      await regenerateSummaries(supabase, lovableApiKey, materialId, userId, extractedContent, subject, topic);
    } else if (contentType === "flashcards") {
      await regenerateFlashcards(supabase, lovableApiKey, materialId, userId, extractedContent, subject, topic);
    } else if (contentType === "practice_questions") {
      await regeneratePracticeQuestions(supabase, lovableApiKey, materialId, userId, extractedContent, subject, topic);
    } else if (contentType === "concept_map") {
      await regenerateConceptMap(supabase, lovableApiKey, materialId, userId, extractedContent, subject, topic);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully regenerated ${contentType}`);

    return new Response(
      JSON.stringify({ success: true, contentType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Regeneration error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callLovableAI(apiKey: string, prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function regenerateTutorNotes(
  supabase: any,
  apiKey: string,
  materialId: string,
  userId: string,
  content: string,
  subject: string,
  topic: string
) {
  console.log("Regenerating tutor notes...");
  
  // Delete existing tutor notes
  await supabase.from("tutor_notes").delete().eq("material_id", materialId);

  const systemPrompt = `You are an expert academic tutor creating comprehensive study notes. Your notes should be:
- Extremely detailed and thorough (200-300 words per subtopic minimum)
- Written in clear, academic language
- Include real-world examples and applications
- Highlight key concepts that are likely to appear on exams
- Include definitions for all technical terms
- Provide multiple examples for each concept
- Add exam tips and common mistakes to avoid`;

  const prompt = `Create comprehensive, detailed tutor notes for the following ${subject} material about "${topic}".

Content to analyze:
${content.substring(0, 25000)}

Generate a JSON response with this EXACT structure:
{
  "topics": [
    {
      "title": "Major Topic Title",
      "subtopics": [
        {
          "title": "Subtopic Title",
          "content": "Detailed explanation (200-300 words minimum). Include thorough explanations of concepts, how they relate to each other, why they matter, and how they apply in practice.",
          "definitions": [
            {"term": "Key Term 1", "definition": "Comprehensive definition with context and usage examples"},
            {"term": "Key Term 2", "definition": "Comprehensive definition with context and usage examples"}
          ],
          "examples": [
            "Detailed real-world example 1 with full explanation",
            "Detailed real-world example 2 with full explanation",
            "Detailed real-world example 3 with full explanation"
          ],
          "exam_tips": [
            "Specific exam tip about what to remember",
            "Common mistake to avoid with explanation",
            "How this topic is typically tested"
          ]
        }
      ]
    }
  ]
}

Create at least 4-6 major topics with 3-5 detailed subtopics each. Each subtopic MUST have:
- Extensive content (200-300 words)
- At least 3-5 key term definitions
- At least 3-4 detailed examples
- At least 3 exam tips

Return ONLY the JSON, no markdown.`;

  const response = await callLovableAI(apiKey, prompt, systemPrompt);
  
  let tutorNotesContent;
  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
    tutorNotesContent = JSON.parse(cleanedResponse);
  } catch {
    tutorNotesContent = {
      topics: [{
        title: "Study Notes",
        subtopics: [{
          title: "Overview",
          content: response.substring(0, 2000),
          definitions: [],
          examples: [],
          exam_tips: []
        }]
      }]
    };
  }

  await supabase.from("tutor_notes").insert({
    material_id: materialId,
    user_id: userId,
    content: tutorNotesContent,
  });

  console.log("Tutor notes regenerated");
}

async function regenerateSummaries(
  supabase: any,
  apiKey: string,
  materialId: string,
  userId: string,
  content: string,
  subject: string,
  topic: string
) {
  console.log("Regenerating summaries...");
  
  // Delete existing summaries
  await supabase.from("summaries").delete().eq("material_id", materialId);

  const systemPrompt = `You are an expert at creating clear, well-organized academic summaries.`;

  // Generate quick summary
  const quickPrompt = `Create a brief executive summary (150-200 words) of this ${subject} content about "${topic}":

${content.substring(0, 15000)}

Write a clear, flowing paragraph that captures the main thesis, key arguments, and conclusions. No bullet points.`;

  const quickSummary = await callLovableAI(apiKey, quickPrompt, systemPrompt);

  // Generate bullet points
  const bulletPrompt = `Create a comprehensive bullet-point summary of this ${subject} content about "${topic}":

${content.substring(0, 20000)}

Format as clean bullet points:
• Main point 1
• Main point 2
  - Supporting detail
  - Supporting detail
• Main point 3

Include 15-25 key points with supporting details. Use clear, concise language.`;

  const bulletSummary = await callLovableAI(apiKey, bulletPrompt, systemPrompt);

  // Generate detailed summary
  const detailedPrompt = `Create a detailed academic summary of this ${subject} content about "${topic}":

${content.substring(0, 25000)}

Structure your response with these sections:
## Overview
[2-3 paragraph introduction to the topic]

## Key Concepts
[Detailed explanation of main concepts]

## Important Details
[Specific facts, figures, and examples]

## Relationships and Connections
[How concepts relate to each other]

## Practical Applications
[Real-world uses and implications]

## Key Takeaways
[Most important points to remember]

Write 800-1200 words total. Use proper markdown formatting.`;

  const detailedSummary = await callLovableAI(apiKey, detailedPrompt, systemPrompt);

  // Insert all three summary types
  await supabase.from("summaries").insert([
    { material_id: materialId, user_id: userId, summary_type: "quick", content: quickSummary },
    { material_id: materialId, user_id: userId, summary_type: "bullet_points", content: bulletSummary },
    { material_id: materialId, user_id: userId, summary_type: "detailed", content: detailedSummary },
  ]);

  console.log("Summaries regenerated");
}

async function regenerateFlashcards(
  supabase: any,
  apiKey: string,
  materialId: string,
  userId: string,
  content: string,
  subject: string,
  topic: string
) {
  console.log("Regenerating flashcards...");
  
  // Delete existing flashcards
  await supabase.from("material_flashcards").delete().eq("material_id", materialId);

  const systemPrompt = `You are an expert flashcard creator for academic study materials.`;

  const prompt = `Create 20-30 comprehensive flashcards for this ${subject} content about "${topic}":

${content.substring(0, 25000)}

Generate a JSON array of flashcards:
[
  {
    "front": "Clear, specific question",
    "back": "Comprehensive answer with explanation",
    "hint": "Optional hint to help recall",
    "difficulty": "easy|medium|hard"
  }
]

Include:
- Definition cards for key terms
- Concept explanation cards
- Application/example cards
- Comparison cards
- Process/procedure cards

Make answers detailed (50-150 words). Return ONLY the JSON array.`;

  const response = await callLovableAI(apiKey, prompt, systemPrompt);
  
  let flashcards;
  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
    flashcards = JSON.parse(cleanedResponse);
  } catch {
    flashcards = [];
  }

  if (flashcards.length > 0) {
    const flashcardRecords = flashcards.map((card: any) => ({
      material_id: materialId,
      user_id: userId,
      front: card.front,
      back: card.back,
      hint: card.hint || null,
      difficulty: card.difficulty || "medium",
    }));

    await supabase.from("material_flashcards").insert(flashcardRecords);
  }

  console.log(`Flashcards regenerated: ${flashcards.length}`);
}

async function regeneratePracticeQuestions(
  supabase: any,
  apiKey: string,
  materialId: string,
  userId: string,
  content: string,
  subject: string,
  topic: string
) {
  console.log("Regenerating practice questions...");
  
  // Delete existing questions
  await supabase.from("practice_questions").delete().eq("material_id", materialId);

  const systemPrompt = `You are an expert exam question creator.`;

  const prompt = `Create 15-20 practice questions for this ${subject} content about "${topic}":

${content.substring(0, 25000)}

Generate a JSON array:
[
  {
    "question": "Question text",
    "question_type": "mcq|short_answer|case_based",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "The correct option or answer",
    "explanation": "Detailed explanation of why this is correct (100-200 words)"
  }
]

Include:
- 8-10 MCQ questions
- 4-5 short answer questions
- 2-3 case-based questions

Make explanations thorough. Return ONLY the JSON array.`;

  const response = await callLovableAI(apiKey, prompt, systemPrompt);
  
  let questions;
  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
    questions = JSON.parse(cleanedResponse);
  } catch {
    questions = [];
  }

  if (questions.length > 0) {
    const questionRecords = questions.map((q: any) => ({
      material_id: materialId,
      user_id: userId,
      question: q.question,
      question_type: q.question_type || "mcq",
      options: q.options || null,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));

    await supabase.from("practice_questions").insert(questionRecords);
  }

  console.log(`Practice questions regenerated: ${questions.length}`);
}

async function regenerateConceptMap(
  supabase: any,
  apiKey: string,
  materialId: string,
  userId: string,
  content: string,
  subject: string,
  topic: string
) {
  console.log("Regenerating concept map...");
  
  // Delete existing concept map
  await supabase.from("concept_maps").delete().eq("material_id", materialId);

  const systemPrompt = `You are an expert at creating visual concept maps.`;

  const prompt = `Create a concept map for this ${subject} content about "${topic}":

${content.substring(0, 20000)}

Generate a JSON with nodes and edges:
{
  "nodes": [
    {"id": "1", "label": "Main Concept", "type": "main", "description": "Brief description"},
    {"id": "2", "label": "Sub Concept", "type": "sub", "description": "Brief description"}
  ],
  "edges": [
    {"source": "1", "target": "2", "label": "relates to"}
  ]
}

Create 15-25 nodes with meaningful connections. Return ONLY the JSON.`;

  const response = await callLovableAI(apiKey, prompt, systemPrompt);
  
  let conceptMap;
  try {
    const cleanedResponse = response.replace(/```json\n?|\n?```/g, "").trim();
    conceptMap = JSON.parse(cleanedResponse);
  } catch {
    conceptMap = { nodes: [], edges: [] };
  }

  await supabase.from("concept_maps").insert({
    material_id: materialId,
    user_id: userId,
    nodes: conceptMap.nodes || [],
    edges: conceptMap.edges || [],
  });

  console.log("Concept map regenerated");
}
