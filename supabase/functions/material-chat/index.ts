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

// Chunk content into numbered passages for citation references
function chunkContent(content: string, chunkSize = 800): { id: number; text: string }[] {
  const chunks: { id: number; text: string }[] = [];
  // Split by paragraphs first, then merge into chunks
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  let chunkId = 1;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > chunkSize && currentChunk.length > 0) {
      chunks.push({ id: chunkId, text: currentChunk.trim() });
      chunkId++;
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({ id: chunkId, text: currentChunk.trim() });
  }

  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { materialId, messages, extractedContent } = await req.json();

    if (!materialId) {
      throw new Error('Material ID is required');
    }

    console.log(`Chat request for material: ${materialId}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try study_materials first, then notebooks
    let content = extractedContent || '';
    
    const { data: material } = await supabase
      .from('study_materials')
      .select('extracted_content, title, subject, topic, user_id')
      .eq('id', materialId)
      .maybeSingle();

    if (material) {
      if (material.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!content) content = material.extracted_content || `Title: ${material.title}`;
    } else {
      // Check if it's a notebook
      const { data: notebook } = await supabase
        .from('notebooks')
        .select('title, user_id')
        .eq('id', materialId)
        .maybeSingle();

      if (!notebook) {
        return new Response(
          JSON.stringify({ error: 'Material not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (notebook.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!content) content = `Notebook: ${notebook.title}`;
    }

    if (!content || content.trim().length === 0) {
      content = 'No content available yet.'
    }

    // Chunk content into numbered passages for citations
    const chunks = chunkContent(content.substring(0, 40000));
    const numberedPassages = chunks
      .map(c => `[${c.id}] ${c.text}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are an expert academic tutor helping students understand their study material. You have access to the following study content, organized into numbered passages:

---BEGIN STUDY MATERIAL---
${numberedPassages}
---END STUDY MATERIAL---

IMPORTANT RULES:
1. ONLY answer questions based on the study material provided above
2. If asked about something not in the material, politely explain you can only help with the uploaded content
3. Be detailed and educational in your responses
4. Use examples from the material when possible
5. Format your responses clearly with bullet points, numbered lists, or paragraphs as appropriate
6. If the student asks for clarification, provide more detailed explanations
7. Help students understand concepts deeply, not just memorize facts

CITATION RULES (CRITICAL):
- When you reference information from the material, cite the passage number using this exact format: [1], [2], etc.
- Place citations inline at the end of the sentence or claim they support
- Use citations frequently - aim to cite at least 2-3 passages per response
- Only use passage numbers that exist in the material above
- Example: "Photosynthesis converts light energy into chemical energy [3]. This process occurs in the chloroplasts [5]."`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Gemini API quota exceeded. Please check your API key usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error('AI service error');
    }

    // Return chunks metadata in a custom header so client can map citations
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'X-Citation-Chunks': JSON.stringify(chunks.map(c => ({ id: c.id, text: c.text.substring(0, 200) }))),
    };

    return new Response(response.body, { headers: responseHeaders });
  } catch (error) {
    console.error('Chat error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let userFriendlyError = 'Failed to get AI response. Please try again.';
    
    if (errorMessage.includes('Material ID')) {
      userFriendlyError = 'Invalid request. Please refresh and try again.';
    } else if (errorMessage.includes('Access denied')) {
      userFriendlyError = 'You do not have access to this material.';
    } else if (errorMessage === 'AI service error') {
      userFriendlyError = 'AI service temporarily unavailable. Please try again.';
    }
    
    return new Response(
      JSON.stringify({ error: userFriendlyError }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
