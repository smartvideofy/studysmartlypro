import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronRight, 
  RefreshCw, 
  BookOpen,
  Sparkles,
  Save,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTutorNotes, TutorNotes } from "@/hooks/useStudyMaterials";
import { cn } from "@/lib/utils";

interface TutorNotesTabProps {
  materialId: string;
}

export default function TutorNotesTab({ materialId }: TutorNotesTabProps) {
  const { data: tutorNotes, isLoading } = useTutorNotes(materialId);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const toggleSubtopic = (subtopicId: string) => {
    const newExpanded = new Set(expandedSubtopics);
    if (newExpanded.has(subtopicId)) {
      newExpanded.delete(subtopicId);
    } else {
      newExpanded.add(subtopicId);
    }
    setExpandedSubtopics(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const notes = tutorNotes?.[0];

  if (!notes || !notes.content?.topics?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No tutor notes yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          AI-generated tutor notes will appear here once processing is complete.
        </p>
        <Button className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Notes
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Tutor Notes</h3>
            <p className="text-sm text-muted-foreground">AI-generated study outline</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Topics */}
        <div className="space-y-3">
          {notes.content.topics.map((topic, topicIndex) => {
            const topicId = `topic-${topicIndex}`;
            const isExpanded = expandedTopics.has(topicId);

            return (
              <motion.div
                key={topicId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: topicIndex * 0.05 }}
                className="rounded-lg border border-border overflow-hidden"
              >
                {/* Topic Header */}
                <button
                  onClick={() => toggleTopic(topicId)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-semibold">{topic.title}</span>
                </button>

                {/* Topic Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border"
                    >
                      <div className="p-4 space-y-4">
                        {topic.subtopics.map((subtopic, subtopicIndex) => {
                          const subtopicId = `${topicId}-subtopic-${subtopicIndex}`;
                          const isSubtopicExpanded = expandedSubtopics.has(subtopicId);

                          return (
                            <div key={subtopicId} className="pl-4 border-l-2 border-primary/20">
                              <button
                                onClick={() => toggleSubtopic(subtopicId)}
                                className="w-full flex items-center gap-2 text-left mb-2"
                              >
                                {isSubtopicExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-primary" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="font-medium text-sm">{subtopic.title}</span>
                              </button>

                              <AnimatePresence>
                                {isSubtopicExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-3 pl-6"
                                  >
                                    {/* Content */}
                                    <p className="text-sm text-muted-foreground">
                                      {subtopic.content}
                                    </p>

                                    {/* Definitions */}
                                    {subtopic.definitions && subtopic.definitions.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                                          Key Terms
                                        </h5>
                                        {subtopic.definitions.map((def, i) => (
                                          <div key={i} className="bg-secondary/50 rounded-lg p-3">
                                            <span className="font-medium text-sm">{def.term}:</span>
                                            <span className="text-sm text-muted-foreground ml-2">
                                              {def.definition}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Examples */}
                                    {subtopic.examples && subtopic.examples.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-xs font-semibold uppercase text-muted-foreground">
                                          Examples
                                        </h5>
                                        <ul className="list-disc list-inside space-y-1">
                                          {subtopic.examples.map((example, i) => (
                                            <li key={i} className="text-sm text-muted-foreground">
                                              {example}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Exam Tips */}
                                    {subtopic.exam_tips && subtopic.exam_tips.length > 0 && (
                                      <div className="bg-accent/10 rounded-lg p-3 border border-accent/20">
                                        <h5 className="text-xs font-semibold uppercase text-accent mb-2">
                                          📝 Exam Tips
                                        </h5>
                                        <ul className="space-y-1">
                                          {subtopic.exam_tips.map((tip, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                              <span className="text-accent">•</span>
                                              {tip}
                                            </li>
                                          ))}
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
