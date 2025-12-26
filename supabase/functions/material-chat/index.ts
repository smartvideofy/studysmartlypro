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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materialId, messages, extractedContent } = await req.json();

    if (!materialId) {
      throw new Error('Material ID is required');
    }

    console.log(`Chat request for material: ${materialId}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get material content if not provided
    let content = extractedContent;
    if (!content) {
      const { data: material, error } = await supabase
        .from('study_materials')
        .select('extracted_content, title, subject, topic')
        .eq('id', materialId)
        .single();

      if (error) throw error;
      content = material?.extracted_content || `Title: ${material?.title}`;
    }

    const systemPrompt = `You are an expert academic tutor helping students understand their study material. You have access to the following study content:

---BEGIN STUDY MATERIAL---
${content?.substring(0, 40000) || 'No content available'}
---END STUDY MATERIAL---

IMPORTANT RULES:
1. ONLY answer questions based on the study material provided above
2. If asked about something not in the material, politely explain you can only help with the uploaded content
3. Be detailed and educational in your responses
4. Use examples from the material when possible
5. Format your responses clearly with bullet points, numbered lists, or paragraphs as appropriate
6. If the student asks for clarification, provide more detailed explanations
7. Help students understand concepts deeply, not just memorize facts
8. Reference specific parts of the material when answering
9. Keep responses focused and relevant to the question asked`;

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
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
