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
  HelpCircle,
  Play,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePracticeQuestions, PracticeQuestion } from "@/hooks/useStudyMaterials";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";
import { cn } from "@/lib/utils";
import QuizModeDrawer from "./QuizModeDrawer";

interface PracticeQuestionsTabProps {
  materialId: string;
}

export default function PracticeQuestionsTab({ materialId }: PracticeQuestionsTabProps) {
  const { data: questions, isLoading } = usePracticeQuestions(materialId);
  const regenerate = useRegenerateContent(materialId);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());
  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set());
  const [showQuizMode, setShowQuizMode] = useState(false);

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
    <div className="h-full flex flex-col">
      {/* Header with Quiz Mode CTA */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Practice Questions
            </h3>
            <p className="text-sm text-muted-foreground">
              {questions.length} questions • {mcqQuestions.length} MCQ
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

        {/* Primary Quiz Mode Button */}
        {mcqQuestions.length > 0 && (
          <Button 
            variant="hero"
            size="lg"
            className="w-full gap-3 h-14 text-base"
            onClick={() => setShowQuizMode(true)}
          >
            <Trophy className="w-5 h-5" />
            Start Quiz Mode
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-2">
              {mcqQuestions.length} questions
            </span>
          </Button>
        )}
      </div>

      {/* Questions List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* MCQ Section */}
          {mcqQuestions.length > 0 && (
            <section className="space-y-4">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                  {mcqQuestions.length}
                </span>
                Multiple Choice
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
              <h4 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                  {shortAnswerQuestions.length}
                </span>
                Short Answer
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
              <h4 className="text-sm font-semibold uppercase text-muted-foreground flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center">
                  {caseBasedQuestions.length}
                </span>
                Case-Based
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

      <QuizModeDrawer 
        open={showQuizMode} 
        onOpenChange={setShowQuizMode} 
        materialId={materialId} 
      />
    </div>
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
        <p className="font-medium text-sm">{question.question}</p>
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
                  "w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-all min-h-[52px]",
                  isSelected && !isRevealed && "border-primary bg-primary/5",
                  isRevealed && isCorrectOption && "border-success bg-success/10",
                  isRevealed && isSelected && !isCorrectOption && "border-destructive bg-destructive/10",
                  !isSelected && !isRevealed && "border-border hover:border-primary/50 active:bg-secondary/50"
                )}
              >
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
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
      <div className="flex items-center gap-2 pl-9 flex-wrap">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToggleReveal}
          className="h-9 min-h-[36px]"
        >
          {isRevealed ? "Hide" : "Reveal"}
        </Button>
        
        {question.explanation && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleExplanation}
            className="gap-1.5 h-9 min-h-[36px]"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Explain</span>
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
