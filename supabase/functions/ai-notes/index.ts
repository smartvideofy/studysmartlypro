import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_NOTE_CONTENT_LENGTH = 50000;
const MAX_NOTE_TITLE_LENGTH = 500;
const MIN_CARD_COUNT = 1;
const MAX_CARD_COUNT = 50;
const VALID_ACTIONS = ['summarize', 'generate-flashcards'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'mixed'];
const VALID_CARD_TYPES = ['qa', 'definition', 'fill-blank', 'mixed'];

// Validate and sanitize inputs
function validateInputs(body: Record<string, unknown>): { 
  action: string; 
  noteContent: string; 
  noteTitle: string; 
  cardCount: number; 
  difficulty: string; 
  cardType: string; 
} {
  const { action, noteContent, noteTitle, cardCount, difficulty, cardType } = body;

  // Validate action
  if (!action || typeof action !== 'string' || !VALID_ACTIONS.includes(action)) {
    throw new Error('Invalid request parameters');
  }

  // Validate noteContent
  if (!noteContent || typeof noteContent !== 'string') {
    throw new Error('Content is required');
  }
  if (noteContent.length > MAX_NOTE_CONTENT_LENGTH) {
    throw new Error(`Content exceeds maximum length of ${MAX_NOTE_CONTENT_LENGTH} characters`);
  }
  if (noteContent.trim().length === 0) {
    throw new Error('Content cannot be empty');
  }

  // Validate noteTitle
  if (!noteTitle || typeof noteTitle !== 'string') {
    throw new Error('Title is required');
  }
  if (noteTitle.length > MAX_NOTE_TITLE_LENGTH) {
    throw new Error(`Title exceeds maximum length of ${MAX_NOTE_TITLE_LENGTH} characters`);
  }

  // Validate cardCount (only for flashcard generation)
  let validatedCardCount = 10;
  if (action === 'generate-flashcards' && cardCount !== undefined) {
    const count = Number(cardCount);
    if (isNaN(count) || count < MIN_CARD_COUNT || count > MAX_CARD_COUNT) {
      throw new Error(`Card count must be between ${MIN_CARD_COUNT} and ${MAX_CARD_COUNT}`);
    }
    validatedCardCount = count;
  }

  // Validate difficulty
  let validatedDifficulty = 'mixed';
  if (difficulty !== undefined) {
    if (typeof difficulty !== 'string' || !VALID_DIFFICULTIES.includes(difficulty)) {
      throw new Error('Invalid difficulty level');
    }
    validatedDifficulty = difficulty;
  }

  // Validate cardType
  let validatedCardType = 'qa';
  if (cardType !== undefined) {
    if (typeof cardType !== 'string' || !VALID_CARD_TYPES.includes(cardType)) {
      throw new Error('Invalid card type');
    }
    validatedCardType = cardType;
  }

  return {
    action,
    noteContent: noteContent.trim(),
    noteTitle: noteTitle.trim(),
    cardCount: validatedCardCount,
    difficulty: validatedDifficulty,
    cardType: validatedCardType,
  };
}

// Verify JWT and get user
async function verifyAuth(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  console.log('Auth header present:', !!authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Missing or invalid Authorization header');
    throw new Error('Unauthorized');
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token || token === 'null' || token === 'undefined') {
    console.error('Empty or invalid token value');
    throw new Error('Unauthorized');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration');
    throw new Error('Service configuration error');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Auth verification failed:', error.message);
    throw new Error('Unauthorized');
  }
  
  if (!user) {
    console.error('No user returned from auth verification');
    throw new Error('Unauthorized');
  }

  return user.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication first
    const userId = await verifyAuth(req);
    console.log(`Authenticated request from user: ${userId.substring(0, 8)}...`);

    // Parse and validate inputs
    const body = await req.json();
    const { action, noteContent, noteTitle, cardCount, difficulty, cardType } = validateInputs(body);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('Missing API configuration');
      throw new Error('Service configuration error');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'summarize') {
      systemPrompt = `You are a helpful study assistant. Create a concise summary of the provided note content. 
Focus on key concepts, main ideas, and important details. Format using markdown with bullet points for clarity.
Keep the summary to 3-5 key points maximum.`;
      userPrompt = `Please summarize this note titled "${noteTitle}":\n\n${noteContent}`;
    } else if (action === 'generate-flashcards') {
      // Build card type instructions
      let typeInstructions = '';
      if (cardType === 'qa') {
        typeInstructions = 'Create question and answer pairs. The front should be a clear question, and the back should be a comprehensive answer.';
      } else if (cardType === 'definition') {
        typeInstructions = 'Create term-definition pairs. The front should be a key term or concept, and the back should be its definition.';
      } else if (cardType === 'fill-blank') {
        typeInstructions = 'Create fill-in-the-blank style cards. The front should be a sentence with a key word/phrase replaced by "___", and the back should be the missing word/phrase.';
      } else {
        typeInstructions = 'Mix different card types: questions, definitions, and fill-in-the-blank. Vary the format to keep learning engaging.';
      }
      
      // Build difficulty instructions
      let difficultyInstructions = '';
      if (difficulty === 'beginner') {
        difficultyInstructions = 'Focus on fundamental concepts and basic understanding. Keep questions simple and direct.';
      } else if (difficulty === 'intermediate') {
        difficultyInstructions = 'Include application and analysis questions. Expect some prior knowledge of the subject.';
      } else if (difficulty === 'advanced') {
        difficultyInstructions = 'Create challenging questions that require deep understanding, synthesis, and critical thinking.';
      } else {
        difficultyInstructions = 'Mix difficulty levels - include some basic, intermediate, and challenging questions.';
      }
      
      systemPrompt = `You are an expert educator creating flashcards for effective learning.
Generate exactly ${cardCount} flashcards based on the provided content.

${typeInstructions}

${difficultyInstructions}

IMPORTANT: Return ONLY a valid JSON array with objects containing "front" and "back" keys.
- "front": The question, term, or fill-in-the-blank prompt
- "back": The answer, definition, or missing word/phrase

Keep each card focused on a single concept. Be concise but complete.`;
      
      userPrompt = `Create ${cardCount} flashcards from this content titled "${noteTitle}":\n\n${noteContent}\n\nReturn only JSON array like: [{"front": "...", "back": "..."}]`;
    }

    console.log(`Processing ${action} request for user ${userId.substring(0, 8)}...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('AI service error:', response.status);
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Failed to generate content');
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
          throw new Error('Invalid response format');
        }
        result = { flashcards };
      } catch (parseError) {
        console.error('Failed to parse AI response');
        throw new Error('Failed to process AI response');
      }
    }

    console.log(`Successfully processed ${action} request`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Log detailed error server-side only
    console.error('Function error:', error);
    
    // Return generic messages for internal errors, specific for validation errors
    const isValidationError = errorMessage.includes('required') || 
                              errorMessage.includes('exceeds') || 
                              errorMessage.includes('must be') ||
                              errorMessage.includes('cannot be') ||
                              errorMessage.includes('Invalid');
    
    const isAuthError = errorMessage === 'Unauthorized';
    
    const statusCode = isAuthError ? 401 : (isValidationError ? 400 : 500);
    const clientMessage = isAuthError ? 'Authentication required' : 
                          (isValidationError ? errorMessage : 'An error occurred while processing your request');
    
    return new Response(JSON.stringify({ error: clientMessage }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
