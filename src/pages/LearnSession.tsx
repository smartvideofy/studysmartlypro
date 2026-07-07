import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, CheckCircle2, X, ArrowRight, Loader2, Layers, RotateCcw, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import {
  initLearnSession, currentPrompt, answer, checkTypedAnswer,
  isComplete, masteredCount, MASTERY_TARGET,
  type LearnState, type LearnCard,
} from "@/lib/learn";
import { useDeck, useFlashcards } from "@/hooks/useFlashcards";
import { useAwardXP, useUpdateDailyChallenge } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

type Feedback = { correct: boolean; answer: string } | null;

export default function LearnSession() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data: deck, isLoading: deckLoading } = useDeck(deckId || "");
  const { data: cards, isLoading: cardsLoading } = useFlashcards(deckId || "");
  const awardXP = useAwardXP();
  const updateDailyChallenge = useUpdateDailyChallenge();

  const [state, setState] = useState<LearnState | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session once cards are loaded
  useEffect(() => {
    if (!state && cards && cards.length > 0) {
      const learnCards: LearnCard[] = cards.map((c) => ({
        id: c.id, front: c.front, back: c.back,
      }));
      setState(initLearnSession(learnCards));
    }
  }, [cards, state]);

  const prompt = useMemo(() => (state ? currentPrompt(state) : null), [state]);
  const done = state ? isComplete(state) : false;
  const mastered = state ? masteredCount(state) : 0;
  const total = state?.cards.length ?? 0;
  const progressPct = total > 0 ? (mastered / total) * 100 : 0;

  // Focus typed input when a new prompt appears
  useEffect(() => {
    if (prompt?.mode === "typed" && !feedback) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [prompt?.cardId, prompt?.mode, feedback]);

  const grade = (correct: boolean) => {
    if (!state || !prompt) return;
    haptics.medium();
    setFeedback({ correct, answer: prompt.answer });
    awardXP.mutate({ amount: correct ? 10 : 3, reason: "Learn session" });
    updateDailyChallenge.mutate({ progress: 1 });
    // Advance after a short beat so the learner sees the correct answer
    setTimeout(() => {
      setState((s) => (s ? answer(s, correct) : s));
      setFeedback(null);
      setTyped("");
    }, correct ? 650 : 1300);
  };

  const handleChoice = (choice: string) => {
    if (!prompt || feedback) return;
    grade(choice === prompt.answer);
  };

  const handleTypedSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt || feedback) return;
    const ok = checkTypedAnswer(typed, prompt.answer);
    grade(ok);
  };

  const restart = () => {
    if (!cards) return;
    const learnCards: LearnCard[] = cards.map((c) => ({
      id: c.id, front: c.front, back: c.back,
    }));
    setState(initLearnSession(learnCards));
    setFeedback(null);
    setTyped("");
  };

  if (deckLoading || cardsLoading) {
    return (
      <DashboardLayout title="Learn">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!deck) {
    return (
      <DashboardLayout title="Learn">
        <div className="text-center py-12">
          <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-display text-xl font-semibold mb-2">Deck not found</h3>
          <Button variant="outline" asChild>
            <Link to="/flashcards">Back to decks</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <DashboardLayout title="Learn">
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-display text-xl font-semibold mb-2">No cards to learn yet</h3>
          <p className="text-muted-foreground mb-6">Add flashcards to this deck to start learning</p>
          <Button asChild>
            <Link to={`/flashcards/${deckId}`}>Add cards</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (done && state) {
    return (
      <DashboardLayout title="Learn — complete">
        <div className="max-w-lg mx-auto text-center py-12">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-success" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold mb-2">Mastered!</h1>
          <p className="text-muted-foreground mb-6">
            You've learned every card in {deck.name} through {state.round} round{state.round === 1 ? "" : "s"}.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to={`/flashcards/${deckId}`}>Back to deck</Link>
            </Button>
            <Button onClick={restart}>
              <RotateCcw className="w-4 h-4 mr-2" /> Learn again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!prompt || !state) return null;

  return (
    <DashboardLayout title="">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageBreadcrumb
          items={[
            { label: "Flashcards", href: "/flashcards" },
            { label: deck.name, href: `/flashcards/${deckId}` },
            { label: "Learn" },
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Round {state.round}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              {mastered} / {total} mastered
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/flashcards/${deckId}`)}>
            <X className="w-4 h-4 mr-1" /> Exit
          </Button>
        </div>

        <Progress value={progressPct} className="h-2" />

        <AnimatePresence mode="wait">
          <motion.div
            key={prompt.cardId + (feedback ? ":f" : "")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <Card className="p-6 md:p-10 min-h-[220px] flex items-center justify-center text-center">
              <p className="font-display text-xl md:text-2xl leading-relaxed">
                {prompt.front}
              </p>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* MCQ */}
        {prompt.mode === "mcq" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {prompt.choices.map((choice) => {
              const isCorrect = feedback && choice === prompt.answer;
              const isPicked = feedback && !feedback.correct && choice !== prompt.answer;
              return (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  disabled={!!feedback}
                  className={cn(
                    "rounded-xl border px-4 py-3.5 text-left text-sm transition-colors",
                    "hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "disabled:cursor-not-allowed",
                    !feedback && "bg-card",
                    isCorrect && "bg-success/10 border-success text-success-foreground",
                    isPicked && "bg-destructive/10 border-destructive/40",
                  )}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {/* Typed */}
        {prompt.mode === "typed" && (
          <form onSubmit={handleTypedSubmit} className="space-y-2">
            <Input
              ref={inputRef}
              placeholder="Type the answer…"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={!!feedback}
              autoComplete="off"
              className="h-12 text-base"
            />
            {feedback ? (
              <div
                className={cn(
                  "text-sm rounded-lg px-3 py-2",
                  feedback.correct
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {feedback.correct ? "Correct!" : (
                  <>Answer: <span className="font-semibold">{feedback.answer}</span></>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => grade(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Don't know
                </button>
                <Button type="submit" disabled={!typed.trim()}>
                  Check <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </form>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Get each card right {MASTERY_TARGET}× in a row to master it.
        </p>
      </div>
    </DashboardLayout>
  );
}
