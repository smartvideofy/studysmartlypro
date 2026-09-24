// Shared AI provider helper: OpenAI primary, Google Gemini 2.5 Flash fallback.
//
// Any OpenAI failure that means "we can't serve this right now"
// (429 rate limit / no credits, 402/403 quota, 5xx, network error)
// transparently falls back to Gemini so the user-facing feature keeps working.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  // string, or OpenAI multimodal content parts
  content: any;
}

function openaiKey(): string | undefined {
  return Deno.env.get("OPENAI_API_KEY") ?? undefined;
}

function geminiKey(): string | undefined {
  return Deno.env.get("GEMINI_API_KEY") ?? undefined;
}

/** Does this OpenAI failure justify switching to Gemini? */
function shouldFallback(status: number): boolean {
  return status === 429 || status === 402 || status === 403 || status >= 500;
}

// ─── Message conversion: OpenAI shape -> Gemini shape ───

function partsFromContent(content: any): any[] {
  if (typeof content === "string") return [{ text: content }];
  if (!Array.isArray(content)) return [{ text: String(content ?? "") }];

  const parts: any[] = [];
  for (const part of content) {
    if (!part) continue;
    if (part.type === "text" && typeof part.text === "string") {
      parts.push({ text: part.text });
    } else if (part.type === "image_url" && part.image_url?.url) {
      const url: string = part.image_url.url;
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
      // Remote image URLs are not supported by Gemini inline data; skipped.
    } else if (typeof part.text === "string") {
      parts.push({ text: part.text });
    }
  }
  return parts.length > 0 ? parts : [{ text: "" }];
}

function toGeminiBody(messages: ChatMessage[], maxTokens?: number) {
  const systemTexts: string[] = [];
  const contents: any[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const parts = partsFromContent(message.content);
      systemTexts.push(parts.map((p) => p.text ?? "").join("\n"));
      continue;
    }
    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts: partsFromContent(message.content),
    });
  }

  const body: Record<string, unknown> = { contents };
  if (systemTexts.length > 0) {
    body.systemInstruction = { parts: [{ text: systemTexts.join("\n\n") }] };
  }
  if (maxTokens) {
    body.generationConfig = { maxOutputTokens: maxTokens };
  }
  return body;
}

function textFromGemini(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: any) => p?.text ?? "").join("");
}

// ─── Non-streaming completion ───

async function callGemini(messages: ChatMessage[], maxTokens?: number): Promise<string> {
  const key = geminiKey();
  if (!key) throw new Error("AI_UNAVAILABLE");

  const response = await fetch(
    `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toGeminiBody(messages, maxTokens)),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    if (response.status === 429) throw new Error("RATE_LIMIT_EXCEEDED");
    if (response.status === 402 || response.status === 403) throw new Error("QUOTA_EXCEEDED");
    throw new Error("AI_UNAVAILABLE");
  }

  const data = await response.json();
  return textFromGemini(data);
}

/**
 * Chat completion with automatic Gemini fallback.
 * Throws RATE_LIMIT_EXCEEDED / QUOTA_EXCEEDED / AI_UNAVAILABLE only when BOTH providers fail.
 */
export async function callAI(messages: ChatMessage[], maxTokens?: number): Promise<string> {
  const key = openaiKey();

  if (key) {
    try {
      const body: Record<string, unknown> = { model: OPENAI_MODEL, messages };
      if (maxTokens) body.max_tokens = maxTokens;

      const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        if (content) return content;
        console.warn("OpenAI returned empty content, falling back to Gemini");
      } else {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        if (!shouldFallback(response.status)) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
        console.warn(`OpenAI unavailable (${response.status}) - falling back to Gemini`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("OpenAI API error:")) throw error;
      console.warn("OpenAI call failed, falling back to Gemini:", message);
    }
  } else {
    console.warn("No OPENAI_API_KEY set - using Gemini directly");
  }

  console.log("Calling Gemini fallback...");
  return await callGemini(messages, maxTokens);
}

// ─── Streaming completion (OpenAI-compatible SSE out) ───

function geminiStreamToOpenAISSE(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const text = textFromGemini(JSON.parse(payload));
              if (text) {
                const chunk = {
                  choices: [{ delta: { content: text }, index: 0, finish_reason: null }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch {
              // ignore malformed chunk
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        console.error("Gemini stream error:", error);
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

/**
 * Streaming chat with automatic Gemini fallback.
 * Always resolves to an OpenAI-compatible SSE stream, whichever provider served it.
 */
export async function streamAI(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const key = openaiKey();

  if (key) {
    try {
      const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: OPENAI_MODEL, messages, stream: true }),
      });

      if (response.ok && response.body) return response.body;

      const errorText = response.ok ? "(no body)" : await response.text();
      console.error("OpenAI stream error:", response.status, errorText);
      if (response.ok || shouldFallback(response.status)) {
        console.warn("Falling back to Gemini stream");
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith("OpenAI API error:")) throw error;
      console.warn("OpenAI stream failed, falling back to Gemini:", message);
    }
  }

  const gKey = geminiKey();
  if (!gKey) throw new Error("AI_UNAVAILABLE");

  const response = await fetch(
    `${GEMINI_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${gKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toGeminiBody(messages)),
    },
  );

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    console.error("Gemini stream API error:", response.status, errorText);
    if (response.status === 429) throw new Error("RATE_LIMIT_EXCEEDED");
    if (response.status === 402 || response.status === 403) throw new Error("QUOTA_EXCEEDED");
    throw new Error("AI_UNAVAILABLE");
  }

  return geminiStreamToOpenAISSE(response.body);
}
