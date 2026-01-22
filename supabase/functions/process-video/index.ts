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

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch video metadata and transcript from YouTube
async function fetchYouTubeData(videoId: string): Promise<{ title: string; description: string; transcript: string }> {
  console.log(`Fetching YouTube data for video: ${videoId}`);
  
  // Try to get transcript using a transcript API
  // Note: YouTube's official API requires API key and doesn't provide transcripts directly
  // We'll use the video page to extract available info
  
  try {
    // Fetch video page to extract metadata
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch video page');
    }
    
    const html = await response.text();
    
    // Extract title from HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'YouTube Video';
    
    // Extract description from meta tag
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';
    
    // Try to extract captions/transcript
    // YouTube embeds caption data in the page for videos with captions
    const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
    let transcript = '';
    
    if (captionMatch) {
      try {
        // Parse caption tracks to find URL
        const captionData = JSON.parse(`[${captionMatch[1]}]`);
        if (captionData.length > 0 && captionData[0].baseUrl) {
          const captionUrl = captionData[0].baseUrl;
          const captionResponse = await fetch(captionUrl);
          if (captionResponse.ok) {
            const captionXml = await captionResponse.text();
            // Extract text from XML captions
            const textMatches = captionXml.matchAll(/<text[^>]*>([^<]+)<\/text>/g);
            const texts = [];
            for (const match of textMatches) {
              texts.push(match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
            }
            transcript = texts.join(' ');
          }
        }
      } catch (e) {
        console.log('Could not extract captions, will use AI to describe video');
      }
    }
    
    return { title, description, transcript };
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return { 
      title: 'YouTube Video', 
      description: '', 
      transcript: '' 
    };
  }
}

// Generate content from video using AI
async function generateVideoContent(
  videoUrl: string,
  title: string,
  description: string,
  transcript: string,
  subject: string | null,
  topic: string | null,
  language: string
): Promise<{
  extractedContent: string;
  tutorNotes: object;
  summaries: { type: string; content: string }[];
  flashcards: object[];
  questions: object[];
}> {
  console.log('Generating study content from video...');
  
  // Build context from available data
  let context = `Video Title: ${title}\n\n`;
  if (description) {
    context += `Description: ${description}\n\n`;
  }
  if (transcript) {
    context += `Transcript:\n${transcript.substring(0, 30000)}\n\n`;
  }
  
  // If no transcript, ask AI to work with available metadata
  if (!transcript) {
    context += `Note: No transcript available. Please generate educational content based on the video title and description provided.\n`;
  }
  
  const extractedContent = context;
  
  // Generate tutor notes
  const tutorNotesPrompt = `You are an expert academic tutor. Create comprehensive study notes for this video content.

Subject: ${subject || 'General'}
Topic: ${topic || 'Not specified'}
Language: ${language}

Video Content:
${context.substring(0, 25000)}

Create detailed tutor notes in JSON format:
{
  "topics": [
    {
      "title": "Topic Title",
      "subtopics": [
        {
          "title": "Subtopic",
          "content": "Detailed explanation (200-300 words)...",
          "definitions": [{"term": "Term", "definition": "Definition"}],
          "examples": ["Example 1", "Example 2"],
          "exam_tips": ["Tip 1", "Tip 2"]
        }
      ]
    }
  ]
}

Return ONLY valid JSON.`;

  const tutorResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: tutorNotesPrompt }],
    }),
  });

  let tutorNotes = { topics: [] };
  if (tutorResponse.ok) {
    const data = await tutorResponse.json();
    const text = data.choices?.[0]?.message?.content || '';
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      tutorNotes = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.log('Failed to parse tutor notes JSON');
    }
  }

  // Generate summaries
  const summaryPrompt = `Create a comprehensive summary of this video content.

${context.substring(0, 20000)}

Provide a detailed summary covering the main concepts, key points, and important takeaways.`;

  const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: summaryPrompt }],
    }),
  });

  const summaries = [];
  if (summaryResponse.ok) {
    const data = await summaryResponse.json();
    summaries.push({
      type: 'detailed',
      content: data.choices?.[0]?.message?.content || '',
    });
  }

  // Generate flashcards
  const flashcardsPrompt = `Create 15 educational flashcards from this video content.

${context.substring(0, 20000)}

Return ONLY a JSON array:
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "hint": "Optional hint",
    "difficulty": "easy|medium|hard"
  }
]`;

  const flashcardsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: flashcardsPrompt }],
    }),
  });

  let flashcards: object[] = [];
  if (flashcardsResponse.ok) {
    const data = await flashcardsResponse.json();
    const text = data.choices?.[0]?.message?.content || '[]';
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      flashcards = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.log('Failed to parse flashcards JSON');
    }
  }

  // Generate practice questions
  const questionsPrompt = `Create 10 practice questions from this video content.

${context.substring(0, 20000)}

Return ONLY a JSON array with mixed question types:
[
  {
    "question_type": "mcq",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Correct option text",
    "explanation": "Why this is correct"
  },
  {
    "question_type": "short_answer",
    "question": "Question requiring a short response?",
    "correct_answer": "Model answer",
    "explanation": "Key points to include"
  }
]`;

  const questionsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: questionsPrompt }],
    }),
  });

  let questions: object[] = [];
  if (questionsResponse.ok) {
    const data = await questionsResponse.json();
    const text = data.choices?.[0]?.message?.content || '[]';
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      questions = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.log('Failed to parse questions JSON');
    }
  }

  return {
    extractedContent,
    tutorNotes,
    summaries,
    flashcards,
    questions,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authError } = await supabaseAuth.auth.getClaims(token);
    
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { videoUrl, title, subject, topic, language = 'en', folderId } = await req.json();

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: 'Video URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing video: ${videoUrl}`);

    // Extract video ID if YouTube
    const youtubeId = extractYouTubeId(videoUrl);
    let videoTitle = title || 'Video Material';
    let videoDescription = '';
    let transcript = '';

    if (youtubeId) {
      const ytData = await fetchYouTubeData(youtubeId);
      videoTitle = title || ytData.title;
      videoDescription = ytData.description;
      transcript = ytData.transcript;
    }

    // Create study material record
    const { data: material, error: createError } = await supabase
      .from('study_materials')
      .insert({
        user_id: userId,
        title: videoTitle,
        file_type: 'video',
        file_name: videoUrl,
        file_path: null,
        subject,
        topic,
        language,
        folder_id: folderId || null,
        processing_status: 'processing',
        generate_tutor_notes: true,
        generate_flashcards: true,
        generate_questions: true,
        generate_concept_map: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create material:', createError);
      throw new Error('Failed to create study material');
    }

    console.log(`Created material: ${material.id}`);

    // Generate content from video
    try {
      const content = await generateVideoContent(
        videoUrl,
        videoTitle,
        videoDescription,
        transcript,
        subject,
        topic,
        language
      );

      // Update extracted content
      await supabase
        .from('study_materials')
        .update({ extracted_content: content.extractedContent })
        .eq('id', material.id);

      // Insert tutor notes
      if (content.tutorNotes && Object.keys(content.tutorNotes).length > 0) {
        await supabase
          .from('tutor_notes')
          .insert({
            material_id: material.id,
            user_id: userId,
            content: content.tutorNotes,
          });
      }

      // Insert summaries
      for (const summary of content.summaries) {
        await supabase
          .from('summaries')
          .insert({
            material_id: material.id,
            user_id: userId,
            summary_type: summary.type,
            content: summary.content,
          });
      }

      // Insert flashcards
      for (const card of content.flashcards) {
        await supabase
          .from('material_flashcards')
          .insert({
            material_id: material.id,
            user_id: userId,
            front: (card as any).front,
            back: (card as any).back,
            hint: (card as any).hint || null,
            difficulty: (card as any).difficulty || 'medium',
          });
      }

      // Insert practice questions
      for (const question of content.questions) {
        await supabase
          .from('practice_questions')
          .insert({
            material_id: material.id,
            user_id: userId,
            question: (question as any).question,
            question_type: (question as any).question_type,
            options: (question as any).options || null,
            correct_answer: (question as any).correct_answer,
            explanation: (question as any).explanation || null,
          });
      }

      // Mark as completed
      await supabase
        .from('study_materials')
        .update({ processing_status: 'completed' })
        .eq('id', material.id);

      console.log(`Video processing completed for material: ${material.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          materialId: material.id,
          message: 'Video processed successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (processingError: unknown) {
      console.error('Processing error:', processingError);
      
      const errorMessage = processingError instanceof Error 
        ? processingError.message 
        : 'Failed to process video';
      
      await supabase
        .from('study_materials')
        .update({ 
          processing_status: 'failed',
          processing_error: errorMessage
        })
        .eq('id', material.id);

      throw processingError;
    }

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process video';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
