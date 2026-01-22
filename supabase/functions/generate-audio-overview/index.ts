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
const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');

// Voice IDs for the two hosts
const HOST_1_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // George - Male
const HOST_2_VOICE = "EXAVITQu4vr4xnSDxMaL"; // Sarah - Female

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
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
    const { data: claimsData, error: authError } = await supabaseAuth.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const { materialId, style = 'deep_dive' } = await req.json();

    if (!materialId) {
      throw new Error('Material ID is required');
    }

    console.log(`Generating audio overview for material: ${materialId}, style: ${style}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if audio already exists
    const { data: existingAudio } = await supabase
      .from('audio_overviews')
      .select('*')
      .eq('material_id', materialId)
      .eq('style', style)
      .single();

    if (existingAudio?.audio_url) {
      return new Response(
        JSON.stringify({ 
          audioUrl: existingAudio.audio_url,
          script: existingAudio.script,
          cached: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch material content
    const { data: material, error: materialError } = await supabase
      .from('study_materials')
      .select('extracted_content, title, subject, topic, user_id')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      throw new Error('Material not found');
    }

    if (material.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const content = material.extracted_content || `Title: ${material.title}`;

    // Generate conversational script
    const scriptPrompt = getScriptPrompt(style, content, material.title);
    
    const scriptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: scriptPrompt },
          { role: 'user', content: `Create an engaging podcast script about this material:\n\n${content.substring(0, 30000)}` }
        ],
      }),
    });

    if (!scriptResponse.ok) {
      if (scriptResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error('Failed to generate script');
    }

    const scriptData = await scriptResponse.json();
    const script = scriptData.choices?.[0]?.message?.content || '';

    // Parse script into segments
    const segments = parseScript(script);

    // If no ElevenLabs API key, return script only
    if (!elevenLabsApiKey) {
      // Save script without audio
      await supabase
        .from('audio_overviews')
        .upsert({
          material_id: materialId,
          style,
          script,
          user_id: userId,
        });

      return new Response(
        JSON.stringify({ 
          script,
          segments,
          audioUrl: null,
          message: 'Audio generation requires ElevenLabs API key'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate audio for each segment
    const audioChunks: ArrayBuffer[] = [];
    
    for (const segment of segments) {
      const voiceId = segment.speaker === 'host1' ? HOST_1_VOICE : HOST_2_VOICE;
      
      const audioResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: segment.text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.3,
            },
          }),
        }
      );

      if (!audioResponse.ok) {
        console.error('ElevenLabs error:', await audioResponse.text());
        continue;
      }

      const audioBuffer = await audioResponse.arrayBuffer();
      audioChunks.push(audioBuffer);
    }

    // Combine audio chunks
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const combinedAudio = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of audioChunks) {
      combinedAudio.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Upload to storage
    const fileName = `${materialId}/${style}-${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('study-materials')
      .upload(fileName, combinedAudio.buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload audio');
    }

    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('study-materials')
      .createSignedUrl(fileName, 604800); // 7 days

    const audioUrl = urlData?.signedUrl;

    // Save to database
    await supabase
      .from('audio_overviews')
      .upsert({
        material_id: materialId,
        style,
        script,
        audio_url: audioUrl,
        audio_path: fileName,
        duration_seconds: Math.round(totalLength / 16000), // Rough estimate
        user_id: userId,
      });

    return new Response(
      JSON.stringify({ 
        audioUrl,
        script,
        segments,
        cached: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Audio overview error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getScriptPrompt(style: string, content: string, title: string): string {
  const basePrompt = `You are a podcast script writer creating an educational audio discussion about "${title}".
  
Write a natural, engaging conversation between two hosts:
- HOST1 (Alex): The main explainer, knowledgeable and enthusiastic
- HOST2 (Jordan): The curious learner, asks good questions and adds insights

Format the script like this:
[HOST1]: (dialogue)
[HOST2]: (dialogue)

Rules:
1. Make it sound natural and conversational, not like reading a textbook
2. Include some banter and personality
3. Explain complex concepts in accessible ways
4. Use examples and analogies
5. Keep it educational but engaging
6. Aim for 3-5 minutes of content`;

  switch (style) {
    case 'brief':
      return `${basePrompt}\n\nStyle: Brief overview - Quick 2-3 minute summary of key points. Get straight to the essentials.`;
    case 'debate':
      return `${basePrompt}\n\nStyle: Debate format - The hosts should respectfully debate different perspectives on the material. Include counterarguments and critical analysis.`;
    case 'critique':
      return `${basePrompt}\n\nStyle: Critical analysis - Examine the material critically, discussing strengths, weaknesses, and implications.`;
    default: // deep_dive
      return `${basePrompt}\n\nStyle: Deep dive - Comprehensive exploration of the material. Cover all major concepts in detail with examples.`;
  }
}

interface ScriptSegment {
  speaker: 'host1' | 'host2';
  text: string;
}

function parseScript(script: string): ScriptSegment[] {
  const segments: ScriptSegment[] = [];
  const lines = script.split('\n');
  
  for (const line of lines) {
    const host1Match = line.match(/\[HOST1\]:\s*(.*)/i);
    const host2Match = line.match(/\[HOST2\]:\s*(.*)/i);
    const alexMatch = line.match(/\[?Alex\]?:\s*(.*)/i);
    const jordanMatch = line.match(/\[?Jordan\]?:\s*(.*)/i);
    
    if (host1Match || alexMatch) {
      const text = (host1Match?.[1] || alexMatch?.[1])?.trim();
      if (text) {
        segments.push({ speaker: 'host1', text });
      }
    } else if (host2Match || jordanMatch) {
      const text = (host2Match?.[1] || jordanMatch?.[1])?.trim();
      if (text) {
        segments.push({ speaker: 'host2', text });
      }
    }
  }
  
  return segments;
}
