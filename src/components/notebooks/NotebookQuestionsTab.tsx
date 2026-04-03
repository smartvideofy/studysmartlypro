import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotebookPracticeQuestions, type NotebookPracticeQuestion } from "@/hooks/useNotebookContent";
import { cn } from "@/lib/utils";

interface Props { notebookId: string; }

export default function NotebookQuestionsTab({ notebookId }: Props) {
  const { data: questions, isLoading } = useNotebookPracticeQuestions(notebookId);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!questions?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Brain className="w-8 h-8 text-primary" /></div>
        <h3 className="text-lg font-semibold mb-2">No combined questions yet</h3>
        <p className="text-muted-foreground max-w-sm">Combined practice questions will appear here once notebook processing completes.</p>
      </div>
    );
  }

  const toggleReveal = (id: string) => { const s = new Set(revealedAnswers); s.has(id) ? s.delete(id) : s.add(id); setRevealedAnswers(s); };
  const toggleExplanation = (id: string) => { const s = new Set(expandedExplanations); s.has(id) ? s.delete(id) : s.add(id); setExpandedExplanations(s); };

  const mcq = questions.filter(q => q.question_type === 'mcq');
  const shortAnswer = questions.filter(q => q.question_type !== 'mcq');

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-6 border-b border-border/50">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />Combined Practice Questions</h3>
        <p className="text-sm text-muted-foreground">{questions.length} questions from all sources</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {mcq.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground">Multiple Choice ({mcq.length})</h4>
              {mcq.map((q, i) => <QuestionCard key={q.id} question={q} index={i} selected={selectedAnswers[q.id]} onSelect={(a) => setSelectedAnswers(p => ({...p, [q.id]: a}))} isRevealed={revealedAnswers.has(q.id)} onToggleReveal={() => toggleReveal(q.id)} isExpExplanded={expandedExplanations.has(q.id)} onToggleExp={() => toggleExplanation(q.id)} />)}
            </section>
          )}
          {shortAnswer.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground">Short Answer ({shortAnswer.length})</h4>
              {shortAnswer.map((q, i) => <QuestionCard key={q.id} question={q} index={i} selected={selectedAnswers[q.id]} onSelect={(a) => setSelectedAnswers(p => ({...p, [q.id]: a}))} isRevealed={revealedAnswers.has(q.id)} onToggleReveal={() => toggleReveal(q.id)} isExpExplanded={expandedExplanations.has(q.id)} onToggleExp={() => toggleExplanation(q.id)} />)}
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function QuestionCard({ question: q, index, selected, onSelect, isRevealed, onToggleReveal, isExpExplanded, onToggleExp }: {
  question: NotebookPracticeQuestion; index: number; selected?: string; onSelect: (a: string) => void;
  isRevealed: boolean; onToggleReveal: () => void; isExpExplanded: boolean; onToggleExp: () => void;
}) {
  const options = q.options as string[] | null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-lg border border-border p-4 space-y-4">
      <div className="flex gap-3">
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">{index + 1}</span>
        <p className="font-medium text-sm">{q.question}</p>
      </div>
      {options?.length ? (
        <div className="space-y-2 pl-9">
          {options.map((opt, oi) => {
            const letter = String.fromCharCode(65 + oi);
            const isSel = selected === opt;
            const isCorrect = opt === q.correct_answer;
            return (
              <button key={oi} onClick={() => onSelect(opt)} className={cn("w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all min-h-[52px]",
                isSel && !isRevealed && "border-primary bg-primary/5",
                isRevealed && isCorrect && "border-green-500 bg-green-500/10",
                isRevealed && isSel && !isCorrect && "border-destructive bg-destructive/10",
                !isSel && !isRevealed && "border-border hover:border-primary/50"
              )}>
                <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                  isSel && !isRevealed && "bg-primary text-primary-foreground",
                  isRevealed && isCorrect && "bg-green-500 text-white",
                  isRevealed && isSel && !isCorrect && "bg-destructive text-destructive-foreground",
                  !isSel && !isRevealed && "bg-secondary"
                )}>
                  {isRevealed && isCorrect ? <CheckCircle2 className="w-4 h-4" /> : isRevealed && isSel && !isCorrect ? <XCircle className="w-4 h-4" /> : letter}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex items-center gap-2 pl-9">
        <Button variant="outline" size="sm" onClick={onToggleReveal}>{isRevealed ? "Hide" : "Reveal"}</Button>
        {q.explanation && <Button variant="ghost" size="sm" onClick={onToggleExp} className="gap-1.5"><HelpCircle className="w-4 h-4" />{isExpExplanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</Button>}
      </div>
      <AnimatePresence>
        {isExpExplanded && q.explanation && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-9 p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{q.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
