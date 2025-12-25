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
    const { action, noteContent, noteTitle, cardCount, difficulty, cardType } = await req.json();
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
      const count = cardCount || 10;
      const diff = difficulty || 'mixed';
      const type = cardType || 'qa';
      
      // Build card type instructions
      let typeInstructions = '';
      if (type === 'qa') {
        typeInstructions = 'Create question and answer pairs. The front should be a clear question, and the back should be a comprehensive answer.';
      } else if (type === 'definition') {
        typeInstructions = 'Create term-definition pairs. The front should be a key term or concept, and the back should be its definition.';
      } else if (type === 'fill-blank') {
        typeInstructions = 'Create fill-in-the-blank style cards. The front should be a sentence with a key word/phrase replaced by "___", and the back should be the missing word/phrase.';
      } else {
        typeInstructions = 'Mix different card types: questions, definitions, and fill-in-the-blank. Vary the format to keep learning engaging.';
      }
      
      // Build difficulty instructions
      let difficultyInstructions = '';
      if (diff === 'beginner') {
        difficultyInstructions = 'Focus on fundamental concepts and basic understanding. Keep questions simple and direct.';
      } else if (diff === 'intermediate') {
        difficultyInstructions = 'Include application and analysis questions. Expect some prior knowledge of the subject.';
      } else if (diff === 'advanced') {
        difficultyInstructions = 'Create challenging questions that require deep understanding, synthesis, and critical thinking.';
      } else {
        difficultyInstructions = 'Mix difficulty levels - include some basic, intermediate, and challenging questions.';
      }
      
      systemPrompt = `You are an expert educator creating flashcards for effective learning.
Generate exactly ${count} flashcards based on the provided content.

${typeInstructions}

${difficultyInstructions}

IMPORTANT: Return ONLY a valid JSON array with objects containing "front" and "back" keys.
- "front": The question, term, or fill-in-the-blank prompt
- "back": The answer, definition, or missing word/phrase

Keep each card focused on a single concept. Be concise but complete.`;
      
      userPrompt = `Create ${count} flashcards from this content titled "${noteTitle}":\n\n${noteContent}\n\nReturn only JSON array like: [{"front": "...", "back": "..."}]`;
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
