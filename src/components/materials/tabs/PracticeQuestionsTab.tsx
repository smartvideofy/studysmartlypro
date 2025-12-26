import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  RefreshCw,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePracticeQuestions, PracticeQuestion } from "@/hooks/useStudyMaterials";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";
import { cn } from "@/lib/utils";

interface PracticeQuestionsTabProps {
  materialId: string;
}

export default function PracticeQuestionsTab({ materialId }: PracticeQuestionsTabProps) {
  const { data: questions, isLoading } = usePracticeQuestions(materialId);
  const regenerate = useRegenerateContent(materialId);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());

  const handleRegenerate = () => {
    regenerate.mutate("practice_questions");
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const toggleReveal = (questionId: string) => {
    const newRevealed = new Set(revealedAnswers);
    if (newRevealed.has(questionId)) {
      newRevealed.delete(questionId);
    } else {
      newRevealed.add(questionId);
    }
    setRevealedAnswers(newRevealed);
  };

  const toggleExplanation = (questionId: string) => {
    const newExpanded = new Set(expandedExplanations);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedExplanations(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No practice questions yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Generate practice questions to test your understanding.
        </p>
        <Button className="gap-2" onClick={handleRegenerate} disabled={regenerate.isPending}>
          {regenerate.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate Questions
        </Button>
      </div>
    );
  }

  const mcqQuestions = questions.filter(q => q.question_type === 'mcq');
  const shortAnswerQuestions = questions.filter(q => q.question_type === 'short_answer');
  const caseBasedQuestions = questions.filter(q => q.question_type === 'case_based');

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Practice Questions</h3>
            <p className="text-sm text-muted-foreground">
              {questions.length} questions generated
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate
          </Button>
        </div>

        {/* MCQ Section */}
        {mcqQuestions.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">
              Multiple Choice ({mcqQuestions.length})
            </h4>
            {mcqQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                selectedAnswer={selectedAnswers[question.id]}
                onSelectAnswer={(answer) => handleSelectAnswer(question.id, answer)}
                isRevealed={revealedAnswers.has(question.id)}
                onToggleReveal={() => toggleReveal(question.id)}
                isExplanationExpanded={expandedExplanations.has(question.id)}
                onToggleExplanation={() => toggleExplanation(question.id)}
              />
            ))}
          </section>
        )}

        {/* Short Answer Section */}
        {shortAnswerQuestions.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">
              Short Answer ({shortAnswerQuestions.length})
            </h4>
            {shortAnswerQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                selectedAnswer={selectedAnswers[question.id]}
                onSelectAnswer={(answer) => handleSelectAnswer(question.id, answer)}
                isRevealed={revealedAnswers.has(question.id)}
                onToggleReveal={() => toggleReveal(question.id)}
                isExplanationExpanded={expandedExplanations.has(question.id)}
                onToggleExplanation={() => toggleExplanation(question.id)}
              />
            ))}
          </section>
        )}

        {/* Case-Based Section */}
        {caseBasedQuestions.length > 0 && (
          <section className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-muted-foreground">
              Case-Based ({caseBasedQuestions.length})
            </h4>
            {caseBasedQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                selectedAnswer={selectedAnswers[question.id]}
                onSelectAnswer={(answer) => handleSelectAnswer(question.id, answer)}
                isRevealed={revealedAnswers.has(question.id)}
                onToggleReveal={() => toggleReveal(question.id)}
                isExplanationExpanded={expandedExplanations.has(question.id)}
                onToggleExplanation={() => toggleExplanation(question.id)}
              />
            ))}
          </section>
        )}
      </div>
    </ScrollArea>
  );
}

interface QuestionCardProps {
  question: PracticeQuestion;
  index: number;
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
  isRevealed: boolean;
  onToggleReveal: () => void;
  isExplanationExpanded: boolean;
  onToggleExplanation: () => void;
}

function QuestionCard({
  question,
  index,
  selectedAnswer,
  onSelectAnswer,
  isRevealed,
  onToggleReveal,
  isExplanationExpanded,
  onToggleExplanation,
}: QuestionCardProps) {
  const isCorrect = selectedAnswer === question.correct_answer;
  const options = question.options as string[] | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border border-border p-4 space-y-4"
    >
      {/* Question */}
      <div className="flex gap-3">
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <p className="font-medium">{question.question}</p>
      </div>

      {/* Options (for MCQ) */}
      {options && options.length > 0 && (
        <div className="space-y-2 pl-9">
          {options.map((option, optIndex) => {
            const letter = String.fromCharCode(65 + optIndex);
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === question.correct_answer;
            
            return (
              <button
                key={optIndex}
                onClick={() => onSelectAnswer(option)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                  isSelected && !isRevealed && "border-primary bg-primary/5",
                  isRevealed && isCorrectOption && "border-success bg-success/10",
                  isRevealed && isSelected && !isCorrectOption && "border-destructive bg-destructive/10",
                  !isSelected && !isRevealed && "border-border hover:border-primary/50"
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                  isSelected && !isRevealed && "bg-primary text-primary-foreground",
                  isRevealed && isCorrectOption && "bg-success text-success-foreground",
                  isRevealed && isSelected && !isCorrectOption && "bg-destructive text-destructive-foreground",
                  !isSelected && !isRevealed && "bg-secondary"
                )}>
                  {isRevealed && isCorrectOption ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isRevealed && isSelected && !isCorrectOption ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    letter
                  )}
                </span>
                <span className="text-sm">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pl-9">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToggleReveal}
        >
          {isRevealed ? "Hide Answer" : "Reveal Answer"}
        </Button>
        
        {question.explanation && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleExplanation}
            className="gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Explain
            {isExplanationExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {isExplanationExpanded && question.explanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-9 p-3 bg-secondary/50 rounded-lg"
          >
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
