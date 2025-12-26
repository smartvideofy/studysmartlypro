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

interface StudyMaterial {
  id: string;
  user_id: string;
  title: string;
  file_path: string | null;
  file_type: string | null;
  language: string;
  subject: string | null;
  topic: string | null;
  generate_tutor_notes: boolean;
  generate_flashcards: boolean;
  generate_questions: boolean;
  generate_concept_map: boolean;
}

// Using 'any' type to avoid TypeScript issues in edge function context
async function extractTextFromFile(supabase: any, material: StudyMaterial): Promise<string> {
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

  // For text and simple formats, extract text directly
  if (fileType === 'text') {
    return await fileData.text();
  }

  // For images, use AI vision to extract text
  if (fileType === 'image') {
    const base64 = await blobToBase64(fileData);
    return await extractTextFromImage(base64);
  }

  // For audio, transcribe using AI
  if (fileType === 'audio') {
    // Audio transcription would require a specialized service
    // For now, return a placeholder
    return 'Audio content - transcription not yet implemented. Please provide a text-based document for AI processing.';
  }

  // For PDFs and documents, use AI to describe/OCR the content
  if (fileType === 'pdf' || fileType === 'docx' || fileType === 'pptx') {
    // For binary documents, we'll need specialized parsing
    // For now, let's try to get text content if possible
    try {
      const text = await fileData.text();
      // If the text looks like valid content (not binary garbage), use it
      if (text && text.length > 0 && !text.includes('\x00') && isPrintableText(text)) {
        return text.substring(0, 50000); // Limit to 50k chars
      }
    } catch {
      // Ignore text extraction errors for binary files
    }
    
    // For binary PDFs/docs, we can't extract text directly in edge functions
    // Return a message indicating manual content entry is needed
    return `Document uploaded: ${material.title}. Content extraction for ${fileType} files requires additional processing. The AI will generate study materials based on the document title, subject, and topic provided.`;
  }

  return 'Unable to extract content from this file type.';
}

function isPrintableText(text: string): boolean {
  // Check if at least 80% of characters are printable ASCII
  const printableChars = text.match(/[\x20-\x7E\n\r\t]/g) || [];
  return printableChars.length / text.length > 0.8;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function extractTextFromImage(base64Image: string): Promise<string> {
  console.log('Extracting text from image using AI vision...');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text content from this image. If it contains handwritten notes, diagrams, or any educational content, describe it in detail. Format the content in a structured way that would be useful for studying.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64Image}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error('Vision API error:', response.status);
    throw new Error('Failed to extract text from image');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Unable to extract text from image';
}

async function generateTutorNotes(content: string, material: StudyMaterial): Promise<object> {
  console.log('Generating tutor notes...');
  
  const systemPrompt = `You are an expert tutor creating structured study notes. Generate comprehensive tutor notes in JSON format.
The notes should include:
- Topics and subtopics organized hierarchically
- Clear definitions for key terms
- Practical examples
- Exam tips and important points

Respond ONLY with valid JSON in this exact structure:
{
  "topics": [
    {
      "title": "Topic Title",
      "subtopics": [
        {
          "title": "Subtopic Title",
          "content": "Detailed explanation...",
          "definitions": [{"term": "Key Term", "definition": "Clear definition"}],
          "examples": ["Example 1", "Example 2"],
          "exam_tips": ["Important point for exams"]
        }
      ]
    }
  ]
}`;

  const userPrompt = `Create tutor notes for the following study material:
Title: ${material.title}
Subject: ${material.subject || 'General'}
Topic: ${material.topic || 'Not specified'}
Language: ${material.language || 'English'}

Content:
${content.substring(0, 30000)}

Generate structured tutor notes in the specified JSON format.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    console.error('AI API error:', response.status);
    throw new Error('Failed to generate tutor notes');
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || '';
  
  // Extract JSON from response
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

async function generateSummaries(content: string, material: StudyMaterial): Promise<string[]> {
  console.log('Generating summaries...');
  
  const systemPrompt = `You are an expert educator. Create a comprehensive summary of the study material.
Include:
- Key concepts and main ideas
- Important facts and figures
- Relationships between concepts
Format using clear markdown with bullet points.`;

  const userPrompt = `Summarize the following study material:
Title: ${material.title}
Subject: ${material.subject || 'General'}

Content:
${content.substring(0, 30000)}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate summaries');
  }

  const data = await response.json();
  return [data.choices?.[0]?.message?.content || 'Summary not available'];
}

async function generatePracticeQuestions(content: string, material: StudyMaterial): Promise<object[]> {
  console.log('Generating practice questions...');
  
  const systemPrompt = `You are an expert educator creating practice questions. Generate 10 diverse practice questions.
Include a mix of:
- Multiple choice questions (with 4 options)
- Short answer questions
- Application-based questions

Return ONLY valid JSON array:
[
  {
    "question_type": "mcq",
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "Why this is correct"
  },
  {
    "question_type": "short_answer",
    "question": "Question text?",
    "correct_answer": "Expected answer",
    "explanation": "Explanation"
  }
]`;

  const userPrompt = `Create practice questions for:
Title: ${material.title}
Subject: ${material.subject || 'General'}

Content:
${content.substring(0, 30000)}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
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

async function generateConceptMap(content: string, material: StudyMaterial): Promise<object> {
  console.log('Generating concept map...');
  
  const systemPrompt = `You are an expert at creating visual concept maps. Analyze the content and create a concept map.
Return ONLY valid JSON:
{
  "nodes": [
    {"id": "1", "label": "Main Concept", "x": 400, "y": 50, "description": "Description"},
    {"id": "2", "label": "Sub Concept", "x": 200, "y": 150, "description": "Description"}
  ],
  "edges": [
    {"source": "1", "target": "2", "label": "relates to"}
  ]
}
Create 5-10 nodes with meaningful connections. Arrange x/y coordinates in a tree layout (center at x=400).`;

  const userPrompt = `Create a concept map for:
Title: ${material.title}
Subject: ${material.subject || 'General'}

Content:
${content.substring(0, 20000)}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
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
    }

    // Generate AI content based on user preferences
    const userId = material.user_id;

    // Generate tutor notes
    if (material.generate_tutor_notes) {
      try {
        const tutorNotes = await generateTutorNotes(extractedContent, material);
        await supabase
          .from('tutor_notes')
          .insert({
            material_id: materialId,
            user_id: userId,
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
            user_id: userId,
            summary_type: 'detailed',
            content: summary,
          });
      }
      console.log('Summaries generated');
    } catch (e) {
      console.error('Error generating summaries:', e);
    }

    // Generate practice questions
    if (material.generate_questions) {
      try {
        const questions = await generatePracticeQuestions(extractedContent, material);
        for (const q of questions) {
          await supabase
            .from('practice_questions')
            .insert({
              material_id: materialId,
              user_id: userId,
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
    }

    // Generate concept map
    if (material.generate_concept_map) {
      try {
        const conceptMap = await generateConceptMap(extractedContent, material);
        await supabase
          .from('concept_maps')
          .insert({
            material_id: materialId,
            user_id: userId,
            nodes: (conceptMap as any).nodes || [],
            edges: (conceptMap as any).edges || [],
          });
        console.log('Concept map generated');
      } catch (e) {
        console.error('Error generating concept map:', e);
      }
    }

    // Update status to completed
    await supabase
      .from('study_materials')
      .update({ processing_status: 'completed' })
      .eq('id', materialId);

    console.log('Processing completed successfully');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Processing error:', error);
    
    // Try to update status to failed
    try {
      const { materialId } = await req.json();
      if (materialId) {
        await supabase
          .from('study_materials')
          .update({ 
            processing_status: 'failed',
            processing_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', materialId);
      }
    } catch {
      // Ignore cleanup errors
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Processing failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
