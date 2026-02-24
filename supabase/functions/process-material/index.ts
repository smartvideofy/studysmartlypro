import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

const MAX_VISION_FILE_SIZE = 10 * 1024 * 1024; // 10MB max for vision processing

interface StudyMaterial {
  id: string;
  user_id: string;
  title: string;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  language: string;
  subject: string | null;
  topic: string | null;
  generate_tutor_notes: boolean;
  generate_flashcards: boolean;
  generate_questions: boolean;
  generate_concept_map: boolean;
}

async function extractTextFromFile(supabase: any, material: StudyMaterial): Promise<string> {
  // Handle web URLs - fetch and extract content via AI
  if (material.file_type === 'web_url' && material.file_name) {
    console.log(`Fetching web URL: ${material.file_name}`);
    try {
      const resp = await fetch(material.file_name, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StudyBot/1.0)' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      // Use AI to extract meaningful text from HTML
      const extractResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{
            role: 'user',
            content: `Extract ALL the main textual content from this web page HTML. Remove navigation, ads, footers, and boilerplate. Preserve headings, paragraphs, lists, and tables. Output clean structured text:\n\n${html.substring(0, 60000)}`,
          }],
        }),
      });
      if (!extractResp.ok) {
        if (extractResp.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
        if (extractResp.status === 402) throw new Error('PAYMENT_REQUIRED');
        throw new Error('Failed to extract web content');
      }
      const data = await extractResp.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (e) {
      console.error('Web URL extraction failed:', e);
      throw e;
    }
  }

  if (!material.file_path) {
    throw new Error('No file path provided');
  }

  console.log(`Extracting text from file: ${material.file_path}, type: ${material.file_type}`);

  // Download file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('study-materials')
    .download(material.file_path);

  if (downloadError) {
    console.error('Download error:', downloadError);
    throw new Error(`Failed to download file: ${downloadError.message}`);
  }

  const fileType = material.file_type || 'text';

  if (fileType === 'text') {
    return await fileData.text();
  }

  if (fileType === 'image') {
    const base64 = await blobToBase64(fileData);
    return await extractContentWithVision(base64, 'image', material.title);
  }

  if (fileType === 'audio') {
    return 'Audio content - transcription not yet implemented. Please provide a text-based document for AI processing.';
  }

  if (fileType === 'pdf' || fileType === 'docx' || fileType === 'pptx') {
    // Try direct text extraction first (works for text-based PDFs)
    try {
      const text = await fileData.text();
      if (text && text.length > 100 && !text.includes('\x00') && isPrintableText(text)) {
        console.log('Successfully extracted text directly from document');
        return text.substring(0, 50000);
      }
    } catch {
      console.log('Direct text extraction failed');
    }
    
    // Check file size before attempting vision (base64 causes ~4x memory amplification)
    const fileSize = material.file_size || fileData.size;
    if (fileSize > MAX_VISION_FILE_SIZE) {
      console.error(`File too large for vision processing: ${(fileSize / (1024 * 1024)).toFixed(1)}MB (max ${MAX_VISION_FILE_SIZE / (1024 * 1024)}MB)`);
      throw new Error(`This file is too large (${(fileSize / (1024 * 1024)).toFixed(0)}MB) for AI processing. Please upload a file under 10MB, or split it into smaller parts.`);
    }

    const base64 = await blobToBase64(fileData);
    return await extractContentWithVision(base64, fileType, material.title);
  }

  return 'Unable to extract content from this file type.';
}

function isPrintableText(text: string): boolean {
  const printableChars = text.match(/[\x20-\x7E\n\r\t]/g) || [];
  return printableChars.length / text.length > 0.8;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  // Process in chunks to reduce peak memory usage
  const CHUNK_SIZE = 32768;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    chunks.push(String.fromCharCode(...chunk));
  }
  return btoa(chunks.join(''));
}

async function extractContentWithVision(base64Data: string, fileType: string, title: string): Promise<string> {
  console.log(`Extracting content from ${fileType} using AI vision...`);
  
  const mimeType = fileType === 'pdf' ? 'application/pdf' : 
                   fileType === 'image' ? 'image/png' : 
                   'application/octet-stream';

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are analyzing a study document titled "${title}". 
              
Your task is to extract and transcribe ALL textual content from this document in a comprehensive and structured way.

Instructions:
1. Extract ALL text content visible in the document
2. Preserve the structure: headings, subheadings, paragraphs, lists, tables
3. If there are diagrams, charts, or images, describe them in detail
4. If there are formulas or equations, transcribe them clearly
5. Include any captions, footnotes, or annotations
6. Maintain the logical flow and organization of the content

Output Format:
- Use clear section headings
- Preserve bullet points and numbered lists
- Format tables as markdown tables
- Include [DIAGRAM: description] or [FIGURE: description] for visual elements

Be thorough and comprehensive. The extracted content will be used to generate study materials, so accuracy is crucial.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Data}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error:', response.status, errorText);
    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (response.status === 402) {
      throw new Error('PAYMENT_REQUIRED');
    }
    throw new Error(`Failed to extract content from ${fileType}`);
  }

  const data = await response.json();
  const extractedContent = data.choices?.[0]?.message?.content || '';
  console.log(`Extracted ${extractedContent.length} characters from ${fileType}`);
  return extractedContent;
}

async function generateTutorNotes(content: string, material: StudyMaterial): Promise<object> {
  console.log('Generating comprehensive tutor notes...');
  
  const systemPrompt = `You are an expert academic tutor and curriculum designer. Your task is to create exceptionally detailed and comprehensive tutor notes that would be valuable for a student studying this material.

Your notes must be:
- DETAILED: Each subtopic should have thorough explanations (minimum 200-300 words per subtopic)
- ACADEMIC: Use precise terminology with clear definitions
- STRUCTURED: Organize hierarchically with clear topic/subtopic relationships
- PRACTICAL: Include real-world applications and examples
- EXAM-FOCUSED: Highlight key points that are likely to appear in assessments

For each subtopic, you MUST include:
1. A comprehensive explanation of the concept
2. At least 3-5 key definitions with clear, academic definitions
3. Multiple practical examples (at least 2-3)
4. Exam tips highlighting common misconceptions and key points
5. Connections to other related topics

Respond ONLY with valid JSON in this exact structure:
{
  "topics": [
    {
      "title": "Topic Title",
      "subtopics": [
        {
          "title": "Subtopic Title",
          "content": "Comprehensive explanation of 200-300 words covering the concept in depth, including background, key principles, significance, and applications...",
          "definitions": [
            {"term": "Key Term 1", "definition": "Detailed academic definition"},
            {"term": "Key Term 2", "definition": "Detailed academic definition"},
            {"term": "Key Term 3", "definition": "Detailed academic definition"}
          ],
          "examples": [
            "Detailed Example 1 with context and explanation",
            "Detailed Example 2 showing real-world application",
            "Detailed Example 3 demonstrating the concept"
          ],
          "exam_tips": [
            "Common exam question patterns related to this topic",
            "Key points examiners look for",
            "Common mistakes to avoid"
          ]
        }
      ]
    }
  ]
}`;

  const userPrompt = `Create comprehensive, detailed tutor notes for the following study material. 
Be THOROUGH and DETAILED - these notes should be sufficient for a student to learn the entire topic.

Material Details:
- Title: ${material.title}
- Subject: ${material.subject || 'General'}
- Topic: ${material.topic || 'Not specified'}
- Language: ${material.language || 'English'}

Study Material Content:
${content.substring(0, 40000)}

Generate detailed, comprehensive tutor notes covering ALL the key concepts from this material.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    if (response.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED');
    throw new Error('Failed to generate tutor notes');
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '';
  
  let jsonContent = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  }
  
  try {
    return JSON.parse(jsonContent);
  } catch {
    console.error('Failed to parse tutor notes JSON');
    return { topics: [{ title: 'Notes', subtopics: [{ title: 'Content', content: responseText }] }] };
  }
}

async function generateSummaries(content: string, material: StudyMaterial): Promise<{ type: string; content: string }[]> {
  console.log('Generating comprehensive summaries...');
  
  const summaries: { type: string; content: string }[] = [];

  // Generate Quick Summary
  const quickPrompt = `Create a concise 2-minute summary of this study material. Focus on the main idea and 3-5 key takeaways.

Title: ${material.title}
Subject: ${material.subject || 'General'}

Content:
${content.substring(0, 30000)}

Format: Write 2-3 paragraphs that capture the essence of the material. A student should be able to read this in under 2 minutes and understand the core concepts.`;

  const quickResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: quickPrompt }],
    }),
  });

  if (!quickResponse.ok && (quickResponse.status === 429 || quickResponse.status === 402)) {
    throw new Error(quickResponse.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'PAYMENT_REQUIRED');
  }

  if (quickResponse.ok) {
    const quickData = await quickResponse.json();
    summaries.push({ 
      type: 'quick', 
      content: quickData.choices?.[0]?.message?.content || '' 
    });
  }

  // Generate Detailed Summary
  const detailedPrompt = `Create a comprehensive, detailed summary of this study material.

Title: ${material.title}
Subject: ${material.subject || 'General'}
Topic: ${material.topic || 'Not specified'}

Content:
${content.substring(0, 40000)}

Structure your summary as follows:

Overview
A brief introduction to the material's main theme and purpose.

Key Concepts
Explain each major concept covered in the material with clear definitions and examples.

Important Details
Include significant facts, figures, dates, formulas, and specific information that students need to know.

Connections and Relationships
Describe how different concepts relate to each other and build upon one another.

Summary
A final paragraph consolidating the most critical points for study.

Write in clear, flowing paragraphs. Use proper headings and organize content logically. Avoid excessive formatting markers.`;

  const detailedResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: detailedPrompt }],
    }),
  });

  if (detailedResponse.ok) {
    const detailedData = await detailedResponse.json();
    summaries.push({ 
      type: 'detailed', 
      content: detailedData.choices?.[0]?.message?.content || '' 
    });
  }

  // Generate Bullet Points / Key Points
  const bulletPrompt = `Extract the key points from this study material as a numbered list.

Title: ${material.title}
Subject: ${material.subject || 'General'}

Content:
${content.substring(0, 30000)}

Create 10-15 key points that capture the most important information. Each point should be a complete, standalone statement that a student should remember.

Format each point as a simple sentence without any special formatting characters like asterisks or bullet markers. Just plain numbered points.

Example format:
1. First key point here
2. Second key point here
3. Third key point here`;

  const bulletResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: bulletPrompt }],
    }),
  });

  if (bulletResponse.ok) {
    const bulletData = await bulletResponse.json();
    summaries.push({ 
      type: 'bullet_points', 
      content: bulletData.choices?.[0]?.message?.content || '' 
    });
  }

  return summaries;
}

async function generatePracticeQuestions(content: string, material: StudyMaterial): Promise<object[]> {
  console.log('Generating comprehensive practice questions...');
  
  const systemPrompt = `You are an expert educator and assessment designer. Create 15 high-quality, diverse practice questions that thoroughly test understanding of the material.

Include a balanced mix of:
- 6 Multiple choice questions (MCQ) - with 4 plausible options
- 4 Short answer questions - requiring 2-3 sentence responses
- 3 Application-based questions - real-world scenario applications
- 2 Analytical questions - requiring critical thinking

For EACH question:
1. Make it specific to the content provided
2. Test genuine understanding, not just memorization
3. Provide a detailed explanation of the correct answer
4. For MCQs, make all options plausible (no obvious wrong answers)

Return ONLY valid JSON array:
[
  {
    "question_type": "mcq",
    "question": "Detailed question that tests understanding?",
    "options": ["Option A - plausible", "Option B - plausible", "Option C - plausible", "Option D - plausible"],
    "correct_answer": "The full correct option text",
    "explanation": "Detailed explanation of why this is correct and why other options are wrong"
  },
  {
    "question_type": "short_answer",
    "question": "Question requiring a concise response?",
    "correct_answer": "Model answer demonstrating expected response",
    "explanation": "What key points the answer should include"
  },
  {
    "question_type": "application",
    "question": "Scenario-based question applying concepts?",
    "correct_answer": "Expected application of the concept",
    "explanation": "How to approach this type of problem"
  }
]`;

  const userPrompt = `Create comprehensive practice questions for:

Title: ${material.title}
Subject: ${material.subject || 'General'}
Topic: ${material.topic || 'Not specified'}

Content:
${content.substring(0, 40000)}

Generate 15 diverse, challenging practice questions that thoroughly test understanding of this material.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED');
    throw new Error('Failed to generate practice questions');
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '[]';
  
  let jsonContent = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  }
  
  try {
    return JSON.parse(jsonContent);
  } catch {
    return [];
  }
}

async function generateFlashcards(content: string, material: StudyMaterial): Promise<object[]> {
  console.log('Generating comprehensive flashcards...');
  
  const systemPrompt = `You are an expert at creating effective flashcards for learning and memorization. Create 20 high-quality flashcards that cover the key concepts from the study material.

Flashcard Types to Include:
- Definition cards (term → definition)
- Concept cards (concept → explanation)
- Q&A cards (question → answer)
- Application cards (scenario → solution)

Guidelines:
1. Front should be concise and clear
2. Back should be comprehensive but focused
3. Include hints for difficult cards
4. Cover all major topics in the material
5. Progress from basic to advanced concepts

Return ONLY valid JSON array:
[
  {
    "front": "Clear question or term",
    "back": "Comprehensive answer or definition",
    "hint": "Optional hint to help recall",
    "difficulty": "easy|medium|hard"
  }
]`;

  const userPrompt = `Create 20 high-quality flashcards for:

Title: ${material.title}
Subject: ${material.subject || 'General'}
Topic: ${material.topic || 'Not specified'}

Content:
${content.substring(0, 40000)}

Generate flashcards covering all key concepts, definitions, and important facts.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED');
    throw new Error('Failed to generate flashcards');
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '[]';
  
  let jsonContent = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  }
  
  try {
    return JSON.parse(jsonContent);
  } catch {
    return [];
  }
}

async function generateConceptMap(content: string, material: StudyMaterial): Promise<object> {
  console.log('Generating comprehensive concept map...');
  
  const systemPrompt = `You are an expert at creating visual concept maps for learning. Analyze the content and create a comprehensive concept map showing how different concepts relate.

Create a map with:
- 10-15 nodes representing key concepts
- Clear relationships between connected concepts
- Hierarchical layout (main concepts at top, sub-concepts below)
- Meaningful edge labels describing relationships

Layout Guidelines:
- Main concept at center-top (x: 400, y: 50)
- Second level nodes at y: 150, spaced across x: 100-700
- Third level at y: 250
- Keep nodes evenly spaced

Return ONLY valid JSON:
{
  "nodes": [
    {"id": "1", "label": "Main Concept", "x": 400, "y": 50, "description": "Detailed description of this concept"},
    {"id": "2", "label": "Sub Concept 1", "x": 200, "y": 150, "description": "Description"},
    {"id": "3", "label": "Sub Concept 2", "x": 600, "y": 150, "description": "Description"}
  ],
  "edges": [
    {"source": "1", "target": "2", "label": "includes"},
    {"source": "1", "target": "3", "label": "leads to"}
  ]
}`;

  const userPrompt = `Create a comprehensive concept map for:

Title: ${material.title}
Subject: ${material.subject || 'General'}
Topic: ${material.topic || 'Not specified'}

Content:
${content.substring(0, 30000)}

Generate a detailed concept map with 10-15 interconnected nodes.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
    if (response.status === 402) throw new Error('PAYMENT_REQUIRED');
    throw new Error('Failed to generate concept map');
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '';
  
  let jsonContent = responseText;
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  }
  
  try {
    return JSON.parse(jsonContent);
  } catch {
    return { nodes: [], edges: [] };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify user authentication using getClaims
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create authenticated client to verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log(`Authenticated user: ${userId}`);

    const { materialId } = await req.json();
    
    if (!materialId) {
      throw new Error('Material ID is required');
    }

    console.log(`Processing material: ${materialId}`);

    // Fetch the material
    const { data: material, error: fetchError } = await supabase
      .from('study_materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (fetchError || !material) {
      throw new Error('Material not found');
    }

    const materialUserId = material.user_id;

    // Check user's plan for feature gating
    const { data: userPlan } = await supabase.rpc('get_user_plan', { p_user_id: materialUserId });
    const plan = userPlan || 'free';
    const isPremium = plan !== 'free';
    
    console.log(`User ${materialUserId} has plan: ${plan}, isPremium: ${isPremium}`);

    // Check document limit for free users
    if (!isPremium) {
      const { count, error: countError } = await supabase
        .from('study_materials')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', materialUserId);

      if (!countError && count !== null && count > 5) {
        throw new Error('Document limit reached. Please upgrade to Pro for unlimited uploads.');
      }
    }

    // Update status to processing
    await supabase
      .from('study_materials')
      .update({ processing_status: 'processing' })
      .eq('id', materialId);

    console.log('Status updated to processing');

    // Extract content from file
    let extractedContent = '';
    try {
      extractedContent = await extractTextFromFile(supabase, material);
      console.log(`Extracted ${extractedContent.length} characters`);
      
      // Save extracted content
      await supabase
        .from('study_materials')
        .update({ extracted_content: extractedContent.substring(0, 65000) })
        .eq('id', materialId);
    } catch (extractError) {
      console.error('Content extraction error:', extractError);
      // Continue with metadata-based generation
      extractedContent = `Title: ${material.title}\nSubject: ${material.subject || 'General'}\nTopic: ${material.topic || 'Not specified'}`;
      // Save fallback content so regenerate-content can use it later
      await supabase
        .from('study_materials')
        .update({ extracted_content: extractedContent })
        .eq('id', materialId);
    }

    // Generate tutor notes
    if (material.generate_tutor_notes) {
      try {
        const tutorNotes = await generateTutorNotes(extractedContent, material);
        await supabase
          .from('tutor_notes')
          .insert({
            material_id: materialId,
            user_id: materialUserId,
            content: tutorNotes,
          });
        console.log('Tutor notes generated');
      } catch (e) {
        console.error('Error generating tutor notes:', e);
      }
    }

    // Generate summaries
    try {
      const summaries = await generateSummaries(extractedContent, material);
      for (const summary of summaries) {
        await supabase
          .from('summaries')
          .insert({
            material_id: materialId,
            user_id: materialUserId,
            summary_type: summary.type,
            content: summary.content,
          });
      }
      console.log('Summaries generated');
    } catch (e) {
      console.error('Error generating summaries:', e);
    }

    // Generate practice questions (Pro feature only)
    if (material.generate_questions && isPremium) {
      try {
        const questions = await generatePracticeQuestions(extractedContent, material);
        for (const q of questions) {
          await supabase
            .from('practice_questions')
            .insert({
              material_id: materialId,
              user_id: materialUserId,
              question_type: (q as any).question_type || 'short_answer',
              question: (q as any).question,
              options: (q as any).options || null,
              correct_answer: (q as any).correct_answer || null,
              explanation: (q as any).explanation || null,
            });
        }
        console.log('Practice questions generated');
      } catch (e) {
        console.error('Error generating questions:', e);
      }
    } else if (material.generate_questions && !isPremium) {
      console.log('Skipping practice questions - requires Pro plan');
    }

    // Generate flashcards
    if (material.generate_flashcards) {
      try {
        const flashcards = await generateFlashcards(extractedContent, material);
        for (const card of flashcards) {
          await supabase
            .from('material_flashcards')
            .insert({
              material_id: materialId,
              user_id: materialUserId,
              front: (card as any).front,
              back: (card as any).back,
              hint: (card as any).hint || null,
              difficulty: (card as any).difficulty || 'medium',
            });
        }
        console.log('Flashcards generated');
      } catch (e) {
        console.error('Error generating flashcards:', e);
      }
    }

    // Generate concept map (Pro feature only)
    if (material.generate_concept_map && isPremium) {
      try {
        const conceptMap = await generateConceptMap(extractedContent, material);
        await supabase
          .from('concept_maps')
          .insert({
            material_id: materialId,
            user_id: materialUserId,
            nodes: (conceptMap as any).nodes || [],
            edges: (conceptMap as any).edges || [],
          });
        console.log('Concept map generated');
      } catch (e) {
        console.error('Error generating concept map:', e);
      }
    } else if (material.generate_concept_map && !isPremium) {
      console.log('Skipping concept map - requires Pro plan');
    }

    // Update status to completed
    await supabase
      .from('study_materials')
      .update({ 
        processing_status: 'completed',
        processing_error: null
      })
      .eq('id', materialId);

    console.log('Processing completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Material processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', error);
    
    // Map technical errors to user-friendly messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userFriendlyError = errorMessage;
    
    if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
      userFriendlyError = 'AI service is busy. Please try again in a few moments.';
    } else if (errorMessage === 'PAYMENT_REQUIRED') {
      userFriendlyError = 'AI credits exhausted. Please contact support to continue.';
    } else if (errorMessage.includes('No file path')) {
      userFriendlyError = 'No file was uploaded. Please upload a document to process.';
    } else if (errorMessage.includes('Failed to download')) {
      userFriendlyError = 'Could not access the uploaded file. Please try uploading again.';
    } else if (errorMessage.includes('extract content')) {
      userFriendlyError = 'Unable to read content from this file format. Try a PDF, image, or text document.';
    } else if (errorMessage.includes('Material not found')) {
      userFriendlyError = 'Study material not found. It may have been deleted.';
    }
    
    // Try to update material status to failed
    try {
      const { materialId } = await req.clone().json();
      if (materialId) {
        await supabase
          .from('study_materials')
          .update({ 
            processing_status: 'failed',
            processing_error: userFriendlyError
          })
          .eq('id', materialId);
      }
    } catch {
      console.error('Failed to update material status');
    }

    return new Response(
      JSON.stringify({ error: userFriendlyError }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
