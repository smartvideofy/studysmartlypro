import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-2.5-flash';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    // Verify user authentication using getClaims
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
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

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
    if (material.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedContent = material.extracted_content 
      || `Title: ${material.title}\nSubject: ${material.subject || 'General'}\nTopic: ${material.topic || material.title}`;
    
    if (!extractedContent || extractedContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No content available to regenerate from" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const materialUserId = material.user_id;
    const subject = material.subject || "General";
    const topic = material.topic || material.title;

    // Generate content based on type
    if (contentType === "tutor_notes") {
      await regenerateTutorNotes(supabase, geminiApiKey, materialId, materialUserId, extractedContent, subject, topic);
    } else if (contentType === "summaries") {
      await regenerateSummaries(supabase, geminiApiKey, materialId, materialUserId, extractedContent, subject, topic);
    } else if (contentType === "flashcards") {
      await regenerateFlashcards(supabase, geminiApiKey, materialId, materialUserId, extractedContent, subject, topic);
    } else if (contentType === "practice_questions") {
      await regeneratePracticeQuestions(supabase, geminiApiKey, materialId, materialUserId, extractedContent, subject, topic);
    } else if (contentType === "concept_map") {
      await regenerateConceptMap(supabase, geminiApiKey, materialId, materialUserId, extractedContent, subject, topic);
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
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage === "RATE_LIMIT_EXCEEDED") {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (errorMessage === "QUOTA_EXCEEDED") {
      return new Response(
        JSON.stringify({ error: "Gemini API quota exceeded. Please check your API key usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callGeminiAI(apiKey: string, prompt: string, systemPrompt: string): Promise<string> {
  console.log("Calling Gemini AI...");
  
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }
    if (response.status === 402 || response.status === 403) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  console.log(`AI response received: ${content.length} characters`);
  return content;
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
          "content": "Detailed explanation (200-300 words minimum).",
          "definitions": [
            {"term": "Key Term 1", "definition": "Comprehensive definition"},
            {"term": "Key Term 2", "definition": "Comprehensive definition"}
          ],
          "examples": [
            "Detailed real-world example 1",
            "Detailed real-world example 2",
            "Detailed real-world example 3"
          ],
          "exam_tips": [
            "Specific exam tip",
            "Common mistake to avoid",
            "How this topic is typically tested"
          ]
        }
      ]
    }
  ]
}

Create at least 4-6 major topics with 3-5 detailed subtopics each.
Return ONLY the JSON, no markdown.`;

  const response = await callGeminiAI(apiKey, prompt, systemPrompt);
  
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
  
  await supabase.from("summaries").delete().eq("material_id", materialId);

  const systemPrompt = `You are an expert at creating clear, well-organized academic summaries.`;

  const quickPrompt = `Create a brief executive summary (150-200 words) of this ${subject} content about "${topic}":

${content.substring(0, 15000)}

Write a clear, flowing paragraph that captures the main thesis, key arguments, and conclusions. No bullet points.`;

  const quickSummary = await callGeminiAI(apiKey, quickPrompt, systemPrompt);

  const bulletPrompt = `Create a comprehensive bullet-point summary of this ${subject} content about "${topic}":

${content.substring(0, 20000)}

Format as clean bullet points:
• Main point 1
• Main point 2
  - Supporting detail
• Main point 3

Include 15-25 key points with supporting details.`;

  const bulletSummary = await callGeminiAI(apiKey, bulletPrompt, systemPrompt);

  const detailedPrompt = `Create a detailed academic summary of this ${subject} content about "${topic}":

${content.substring(0, 25000)}

Structure your response with: Overview, Key Concepts, Important Details, Relationships and Connections, Practical Applications, Key Takeaways.
Write 800-1200 words total. Use proper markdown formatting.`;

  const detailedSummary = await callGeminiAI(apiKey, detailedPrompt, systemPrompt);

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

Make answers detailed (50-150 words). Return ONLY the JSON array.`;

  const response = await callGeminiAI(apiKey, prompt, systemPrompt);
  
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
    "explanation": "Detailed explanation (100-200 words)"
  }
]

Include 8-10 MCQ, 4-5 short answer, 2-3 case-based questions.
Return ONLY the JSON array.`;

  const response = await callGeminiAI(apiKey, prompt, systemPrompt);
  
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

  const response = await callGeminiAI(apiKey, prompt, systemPrompt);
  
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
