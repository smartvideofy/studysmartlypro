import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Brain
} from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePracticeQuestions, PracticeQuestion } from "@/hooks/useStudyMaterials";
import { cn } from "@/lib/utils";

interface QuizModeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
}

type QuizState = "setup" | "active" | "results";

export default function QuizModeDrawer({ open, onOpenChange, materialId }: QuizModeDrawerProps) {
  const { data: allQuestions } = usePracticeQuestions(materialId);
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Filter only MCQ questions for quiz mode
  const quizQuestions = allQuestions?.filter(q => q.question_type === "mcq") || [];
  const currentQuestion = quizQuestions[currentIndex];
  const totalQuestions = quizQuestions.length;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setQuizState("setup");
        setCurrentIndex(0);
        setSelectedAnswers({});
        setShowAnswer(false);
        setTimer(0);
        setIsTimerRunning(false);
      }, 300);
    }
  }, [open]);

  const startQuiz = () => {
    setQuizState("active");
    setTimer(0);
    setIsTimerRunning(true);
    setCurrentIndex(0);
    setSelectedAnswers({});
  };

  const handleSelectAnswer = (answer: string) => {
    if (showAnswer) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setIsTimerRunning(false);
      setQuizState("results");
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correct++;
      }
    });
    return { correct, total: totalQuestions, percentage: Math.round((correct / totalQuestions) * 100) };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const restartQuiz = () => {
    setQuizState("setup");
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowAnswer(false);
    setTimer(0);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] max-h-[90vh]">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Quiz Mode
            </DrawerTitle>
            <div className="flex items-center gap-4">
              {quizState === "active" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatTime(timer)}
                </div>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {/* Setup Screen */}
            {quizState === "setup" && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Brain className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to Test Your Knowledge?</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Answer {quizQuestions.length} multiple choice questions to test your understanding of the material.
                </p>
                
                {quizQuestions.length > 0 ? (
                  <Button size="lg" className="gap-2" onClick={startQuiz}>
                    <Play className="w-5 h-5" />
                    Start Quiz
                  </Button>
                ) : (
                  <p className="text-muted-foreground">
                    No quiz questions available. Generate practice questions first.
                  </p>
                )}
              </motion.div>
            )}

            {/* Active Quiz */}
            {quizState === "active" && currentQuestion && (
              <motion.div
                key={`question-${currentIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="max-w-2xl mx-auto"
              >
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Question {currentIndex + 1} of {totalQuestions}</span>
                    <span className="text-muted-foreground">{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
                  </div>
                  <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="h-2" />
                </div>

                {/* Question */}
                <div className="bg-card rounded-xl border border-border p-6 mb-6">
                  <p className="text-lg font-medium leading-relaxed">{currentQuestion.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                  {(currentQuestion.options as string[] || []).map((option, index) => {
                    const letter = String.fromCharCode(65 + index);
                    const isSelected = selectedAnswers[currentQuestion.id] === option;
                    const isCorrect = option === currentQuestion.correct_answer;
                    
                    return (
                      <motion.button
                        key={index}
                        whileHover={!showAnswer ? { scale: 1.01 } : {}}
                        onClick={() => handleSelectAnswer(option)}
                        disabled={showAnswer}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                          isSelected && !showAnswer && "border-primary bg-primary/5",
                          showAnswer && isCorrect && "border-success bg-success/10",
                          showAnswer && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                          !isSelected && !showAnswer && "border-border hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                          isSelected && !showAnswer && "bg-primary text-primary-foreground",
                          showAnswer && isCorrect && "bg-success text-success-foreground",
                          showAnswer && isSelected && !isCorrect && "bg-destructive text-destructive-foreground",
                          !isSelected && !showAnswer && "bg-secondary"
                        )}>
                          {showAnswer && isCorrect ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : showAnswer && isSelected && !isCorrect ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            letter
                          )}
                        </span>
                        <span>{option}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {showAnswer && currentQuestion.explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-secondary/50 rounded-lg p-4 mb-6"
                    >
                      <p className="text-sm font-medium mb-1">Explanation</p>
                      <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {!showAnswer && selectedAnswers[currentQuestion.id] && (
                      <Button variant="outline" onClick={() => setShowAnswer(true)}>
                        Check Answer
                      </Button>
                    )}
                    <Button onClick={handleNext} className="gap-2">
                      {currentIndex === totalQuestions - 1 ? "Finish" : "Next"}
                      {currentIndex < totalQuestions - 1 && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Screen */}
            {quizState === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                {(() => {
                  const score = calculateScore();
                  const isGreat = score.percentage >= 80;
                  const isGood = score.percentage >= 60;

                  return (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className={cn(
                          "w-24 h-24 rounded-full flex items-center justify-center mb-6",
                          isGreat ? "bg-success/20" : isGood ? "bg-primary/20" : "bg-destructive/20"
                        )}
                      >
                        <Trophy className={cn(
                          "w-12 h-12",
                          isGreat ? "text-success" : isGood ? "text-primary" : "text-destructive"
                        )} />
                      </motion.div>

                      <h2 className="text-3xl font-bold mb-2">
                        {isGreat ? "Excellent!" : isGood ? "Good Job!" : "Keep Practicing!"}
                      </h2>

                      <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {score.percentage}%
                      </div>

                      <p className="text-muted-foreground mb-2">
                        You got {score.correct} out of {score.total} questions correct
                      </p>

                      <p className="text-sm text-muted-foreground mb-8">
                        Time: {formatTime(timer)}
                      </p>

                      <div className="flex gap-4">
                        <Button variant="outline" onClick={restartQuiz} className="gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Try Again
                        </Button>
                        <DrawerClose asChild>
                          <Button>Done</Button>
                        </DrawerClose>
                      </div>

                      {/* Question Review */}
                      <div className="mt-8 w-full max-w-md">
                        <h3 className="text-sm font-semibold mb-4 text-left">Question Review</h3>
                        <div className="space-y-2">
                          {quizQuestions.map((q, i) => {
                            const isCorrect = selectedAnswers[q.id] === q.correct_answer;
                            return (
                              <div
                                key={q.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg text-left text-sm",
                                  isCorrect ? "bg-success/10" : "bg-destructive/10"
                                )}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                )}
                                <span className="line-clamp-1">Q{i + 1}: {q.question}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
