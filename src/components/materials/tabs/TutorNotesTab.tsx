import { useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw, BookOpen, Sparkles, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTutorNotes } from "@/hooks/useStudyMaterials";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";
import { cn } from "@/lib/utils";

interface TutorNotesTabProps {
  materialId: string;
}

interface TutorNoteSubtopic {
  title: string;
  content: string;
  definitions?: { term: string; definition: string }[];
  examples?: string[];
  exam_tips?: string[];
}

interface TutorNoteTopic {
  title: string;
  subtopics: TutorNoteSubtopic[];
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function TutorNotesTab({ materialId }: TutorNotesTabProps) {
  const { data: tutorNotes, isLoading } = useTutorNotes(materialId);
  const regenerate = useRegenerateContent(materialId);
  // Notes open fully expanded: students came here to read. Track what they chose to close.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const notes = tutorNotes?.[0];
  const topics: TutorNoteTopic[] = notes?.content?.topics ?? [];

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No tutor notes yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">Generate structured notes from this material.</p>
        <Button className="gap-2" onClick={() => regenerate.mutate("tutor_notes")} disabled={regenerate.isPending}>
          {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate notes
        </Button>
      </div>
    );
  }

  const subtopicCount = topics.reduce((acc, t) => acc + (t.subtopics?.length || 0), 0);
  const allIds = topics.flatMap((t, ti) => [`t${ti}`, ...(t.subtopics ?? []).map((_, si) => `t${ti}-s${si}`)]);
  const anyOpen = collapsed.size < allIds.length;

  return (
    <ScrollArea className="h-full">
      <div className="px-4 py-5 sm:px-8 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary shrink-0" />
              Tutor notes
            </h2>
            <p className="text-sm text-muted-foreground">
              {plural(topics.length, "topic")} · {plural(subtopicCount, "section")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(anyOpen ? new Set(allIds) : new Set())}>
            {anyOpen ? "Collapse all" : "Expand all"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => regenerate.mutate("tutor_notes")}
            disabled={regenerate.isPending}
            title="Regenerate notes"
          >
            {regenerate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
        </div>

        {/* Topics */}
        <div className="space-y-8">
          {topics.map((topic, ti) => {
            const topicId = `t${ti}`;
            const topicOpen = !collapsed.has(topicId);
            return (
              <section key={topicId}>
                <button
                  onClick={() => toggle(topicId)}
                  className="w-full flex items-center gap-2 text-left group"
                  aria-expanded={topicOpen}
                >
                  {topicOpen ? (
                    <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {topic.title}
                  </h3>
                </button>

                {topicOpen && (
                  <div className="mt-4 space-y-6 border-l-2 border-primary/15 pl-5 ml-2.5">
                    {(topic.subtopics ?? []).map((sub, si) => {
                      const subId = `t${ti}-s${si}`;
                      const subOpen = !collapsed.has(subId);
                      return (
                        <article key={subId}>
                          <button
                            onClick={() => toggle(subId)}
                            className="w-full flex items-center gap-2 text-left group"
                            aria-expanded={subOpen}
                          >
                            {subOpen ? (
                              <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                              {sub.title}
                            </h4>
                          </button>

                          {subOpen && (
                            <div className="mt-2 space-y-4 pl-6">
                              <p className="text-[15px] leading-7 text-foreground/90 whitespace-pre-line">{sub.content}</p>

                              {sub.definitions && sub.definitions.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    Key terms
                                  </h5>
                                  <dl className="grid gap-2 sm:grid-cols-2">
                                    {sub.definitions.map((def, i) => (
                                      <div key={i} className="rounded-lg bg-secondary/60 p-3">
                                        <dt className="font-medium text-sm text-foreground">{def.term}</dt>
                                        <dd className="text-sm text-muted-foreground mt-0.5">{def.definition}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                              )}

                              {sub.examples && sub.examples.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                    Examples
                                  </h5>
                                  <ul className="list-disc pl-5 space-y-1 text-[15px] leading-7 text-foreground/90">
                                    {sub.examples.map((example, i) => (
                                      <li key={i}>{example}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {sub.exam_tips && sub.exam_tips.length > 0 && (
                                <div className={cn("rounded-lg border border-primary/20 bg-primary/5 p-3")}>
                                  <h5 className="text-xs font-semibold uppercase tracking-wide text-primary mb-2 flex items-center gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    Exam tips
                                  </h5>
                                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
                                    {sub.exam_tips.map((tip, i) => (
                                      <li key={i}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
