import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, RefreshCw, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotebookTutorNotes } from "@/hooks/useNotebookContent";

interface Props { notebookId: string; }

export default function NotebookTutorNotesTab({ notebookId }: Props) {
  const { data: tutorNotes, isLoading } = useNotebookTutorNotes(notebookId);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());

  const toggleTopic = (id: string) => {
    const s = new Set(expandedTopics);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedTopics(s);
  };

  const toggleSubtopic = (id: string) => {
    const s = new Set(expandedSubtopics);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedSubtopics(s);
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const notes = tutorNotes?.[0];
  if (!notes?.content?.topics?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No combined tutor notes yet</h3>
        <p className="text-muted-foreground max-w-sm">Combined tutor notes will appear here once notebook processing completes.</p>
      </div>
    );
  }

  const topics = notes.content.topics;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Combined Tutor Notes</h3>
            <p className="text-sm text-muted-foreground">{topics.length} topics • Synthesized from multiple sources</p>
          </div>
        </div>

        <div className="space-y-3">
          {topics.map((topic: any, ti: number) => {
            const topicId = `t-${ti}`;
            const isExpanded = expandedTopics.has(topicId);
            return (
              <motion.div key={topicId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ti * 0.05 }} className="rounded-lg border border-border overflow-hidden">
                <button onClick={() => toggleTopic(topicId)} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
                  <span className="font-semibold">{topic.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{topic.subtopics?.length || 0} subtopics</span>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
                      <div className="p-4 space-y-4">
                        {topic.subtopics?.map((sub: any, si: number) => {
                          const subId = `${topicId}-s-${si}`;
                          const isSubExpanded = expandedSubtopics.has(subId);
                          return (
                            <div key={subId} className="pl-4 border-l-2 border-primary/20">
                              <button onClick={() => toggleSubtopic(subId)} className="w-full flex items-center gap-2 text-left mb-2">
                                {isSubExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                <span className="font-medium text-sm">{sub.title}</span>
                              </button>
                              <AnimatePresence>
                                {isSubExpanded && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 pl-6">
                                    <p className="text-sm text-muted-foreground">{sub.content}</p>
                                    {sub.definitions?.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-xs font-semibold uppercase text-muted-foreground">Key Terms</h5>
                                        {sub.definitions.map((d: any, i: number) => (
                                          <div key={i} className="bg-secondary/50 rounded-lg p-3">
                                            <span className="font-medium text-sm">{d.term}:</span>
                                            <span className="text-sm text-muted-foreground ml-2">{d.definition}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {sub.examples?.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-xs font-semibold uppercase text-muted-foreground">Examples</h5>
                                        <ul className="list-disc list-inside space-y-1">
                                          {sub.examples.map((ex: string, i: number) => <li key={i} className="text-sm text-muted-foreground">{ex}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    {sub.exam_tips?.length > 0 && (
                                      <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                                        <h5 className="text-xs font-semibold uppercase text-accent mb-2">📝 Exam Tips</h5>
                                        <ul className="space-y-1">
                                          {sub.exam_tips.map((tip: string, i: number) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-accent">•</span>{tip}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
