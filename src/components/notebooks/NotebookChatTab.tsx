import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Citation, renderWithCitations } from "@/components/materials/tabs/CitationChip";
import { TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  notebookId: string;
  extractedContent?: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/material-chat`;

export default function NotebookChatTab({ notebookId, extractedContent }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`nb-chat-${notebookId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as any[];
        // Keep last 50 messages to cap storage
        return parsed.slice(-50).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [citationChunks, setCitationChunks] = useState<Citation[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCitationClick = useCallback((citation: Citation) => {
    toast.info(`Source [${citation.id}]`, { description: citation.text, duration: 6000 });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      // Store last 50 messages in localStorage
      const toStore = messages.slice(-50);
      localStorage.setItem(`nb-chat-${notebookId}`, JSON.stringify(toStore));
    }
  }, [messages, notebookId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        return [...prev, { id: crypto.randomUUID(), role: "assistant" as const, content: assistantSoFar, timestamp: new Date() }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error("Please sign in"); setIsLoading(false); return; }

      // Re-use the material-chat edge function, passing notebook's combined content
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          materialId: notebookId,
          notebookId, // explicit notebook flag for edge function
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          extractedContent,
        }),
      });

      if (resp.status === 429) { toast.error("Rate limited. Please wait."); setIsLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); setIsLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      // Parse citation chunks from header
      try {
        const chunksHeader = resp.headers.get("X-Citation-Chunks");
        if (chunksHeader) {
          const decoded = decodeURIComponent(escape(atob(chunksHeader)));
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed)) setCitationChunks(parsed);
        }
      } catch (e) { console.warn("Failed to parse citation chunks:", e); }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let ni: number;
        while ((ni = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, ni); buf = buf.slice(ni + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) upsertAssistant(c); }
          catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      toast.error("Failed to get response.");
    } finally { setIsLoading(false); }
  };

  const suggestedQuestions = [
    "Summarize all sources together",
    "What are the key differences between sources?",
    "Create a study checklist from all materials",
    "What topics appear across multiple sources?",
  ];

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border/50">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">AI Chat</h3>
        <span className="text-xs text-muted-foreground ml-auto">Multi-source context</span>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><MessageSquare className="w-8 h-8 text-primary" /></div>
            <h3 className="text-lg font-semibold mb-2">Ask about your notebook</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm">I can answer questions using content from ALL your uploaded sources.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q, i) => <Button key={i} variant="outline" size="sm" onClick={() => setInput(q)} className="text-xs">{q}</Button>)}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-primary" /></div>}
                  <div className="max-w-[85%]">
                    <div className={`rounded-lg p-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {citationChunks.length > 0
                            ? renderWithCitations(m.content, citationChunks, handleCitationClick)
                            : <ReactMarkdown>{m.content}</ReactMarkdown>}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      )}
                      <p className="text-xs opacity-60 mt-1">{m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  {m.role === "user" && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0"><User className="w-4 h-4" /></div>}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-primary" /></div>
                <div className="bg-secondary rounded-lg p-3"><div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm text-muted-foreground">Thinking...</span></div></div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t border-border pb-safe">
        <div className="flex gap-2">
          <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Ask about all your sources..." className="min-h-[44px] max-h-32 resize-none text-base sm:text-sm" rows={1} />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 h-11 w-11 min-h-[44px] min-w-[44px]">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center"><Sparkles className="w-3 h-3 inline mr-1" />AI uses context from all notebook sources</p>
      </div>
    </div>
    </TooltipProvider>
  );
}
