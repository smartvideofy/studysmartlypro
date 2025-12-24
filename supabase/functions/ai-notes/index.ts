import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, noteContent, noteTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'summarize') {
      systemPrompt = `You are a helpful study assistant. Create a concise summary of the provided note content. 
Focus on key concepts, main ideas, and important details. Format using markdown with bullet points for clarity.
Keep the summary to 3-5 key points maximum.`;
      userPrompt = `Please summarize this note titled "${noteTitle}":\n\n${noteContent}`;
    } else if (action === 'generate-flashcards') {
      systemPrompt = `You are an expert educator creating flashcards for effective learning.
Generate 5-10 flashcards based on the note content. Each flashcard should test understanding of key concepts.
Return ONLY a valid JSON array with objects containing "front" (question) and "back" (answer) keys.
Keep questions clear and answers concise but complete.`;
      userPrompt = `Create flashcards from this note titled "${noteTitle}":\n\n${noteContent}\n\nReturn only JSON array like: [{"front": "Question?", "back": "Answer"}]`;
    } else {
      throw new Error('Invalid action. Use "summarize" or "generate-flashcards"');
    }

    console.log(`Processing ${action} request for note: ${noteTitle}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let result;
    if (action === 'summarize') {
      result = { summary: content };
    } else if (action === 'generate-flashcards') {
      // Extract JSON from response (handle markdown code blocks)
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      
      try {
        const flashcards = JSON.parse(jsonContent);
        if (!Array.isArray(flashcards)) {
          throw new Error('Response is not an array');
        }
        result = { flashcards };
      } catch (parseError) {
        console.error('Failed to parse flashcards JSON:', parseError, 'Content:', jsonContent);
        throw new Error('Failed to parse AI response as flashcards');
      }
    }

    console.log(`Successfully processed ${action} request`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in ai-notes function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
