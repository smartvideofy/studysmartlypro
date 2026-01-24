import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lightbulb,
  Clock,
  Flame,
  X,
  Loader2,
  Layers,
  CheckCircle2,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { StudyFlashcard } from "@/components/flashcards/StudyFlashcard";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  useDeck, 
  useDueFlashcards, 
  useFlashcards,
  useReviewFlashcard
} from "@/hooks/useFlashcards";
import { 
  useCreateStudySession, 
  useUpdateStudySession 
} from "@/hooks/useStudySessions";
import { SRSButtons, calculateNextReviewExtended } from "@/components/flashcards/SRSButtons";
import { useAwardXP, useUpdateDailyChallenge } from "@/hooks/useGamification";

export default function StudySession() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<{id: string, correct: boolean}[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { data: deck, isLoading: deckLoading } = useDeck(deckId || "");
  const { data: dueCards, isLoading: dueCardsLoading } = useDueFlashcards(deckId || "");
  const { data: allCards } = useFlashcards(deckId || "");
  
  const reviewFlashcard = useReviewFlashcard();
  const createSession = useCreateStudySession();
  const updateSession = useUpdateStudySession();
  const awardXP = useAwardXP();
  const updateDailyChallenge = useUpdateDailyChallenge();

  // Use due cards if available, otherwise use all cards
  const cards = (dueCards && dueCards.length > 0) ? dueCards : (allCards || []);
  const currentCard = cards[currentIndex];

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Create session on mount
  useEffect(() => {
    if (deckId && !sessionId) {
      createSession.mutateAsync({ deck_id: deckId })
        .then((session) => {
          setSessionId(session.id);
        })
        .catch(() => {
          // Continue without session tracking
        });
    }
  }, [deckId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = async (quality: number) => {
    if (!currentCard) return;

    // Update spaced repetition with extended algorithm
    const updates = calculateNextReviewExtended(
      quality,
      currentCard.ease_factor,
      currentCard.interval_days,
      currentCard.repetitions
    );

    await reviewFlashcard.mutateAsync({
      id: currentCard.id,
      deckId: deckId || "",
      quality,
      currentEaseFactor: currentCard.ease_factor,
      currentInterval: currentCard.interval_days,
      currentRepetitions: currentCard.repetitions,
    });

    const correct = quality >= 3;
    setResults([...results, { id: currentCard.id, correct }]);
    setIsFlipped(false);
    setShowHint(false);

    // Award XP for studying
    awardXP.mutate({ amount: correct ? 15 : 5, reason: "Flashcard study" });
    updateDailyChallenge.mutate({ progress: 1 });
    
    if (currentIndex < cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 200);
    } else {
      // Session complete
      setIsComplete(true);
      
      // Update session with final stats
      if (sessionId) {
        const correctCount = [...results, { id: currentCard.id, correct }].filter(r => r.correct).length;
        await updateSession.mutateAsync({
          id: sessionId,
          cards_studied: cards.length,
          correct_count: correctCount,
          total_time_seconds: elapsedSeconds,
          ended_at: new Date().toISOString(),
        });
      }
    }
  };

  const handleFlip = () => {
    haptics.medium();
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      haptics.light();
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < cards.length - 1) {
      haptics.light();
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleEndSession = async () => {
    if (sessionId && results.length > 0) {
      const correctCount = results.filter(r => r.correct).length;
      await updateSession.mutateAsync({
        id: sessionId,
        cards_studied: results.length,
        correct_count: correctCount,
        total_time_seconds: elapsedSeconds,
        ended_at: new Date().toISOString(),
      });
    }
    navigate("/flashcards");
  };

  const correctCount = results.filter(r => r.correct).length;
  const progress = cards.length > 0 ? ((currentIndex + (isComplete ? 1 : 0)) / cards.length) * 100 : 0;
  const isLoading = deckLoading || dueCardsLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Study Session">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!deck) {
    return (
      <DashboardLayout title="Study Session">
        <div className="text-center py-12">
          <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-display text-xl font-semibold mb-2">Deck not found</h3>
          <p className="text-muted-foreground mb-6">Select a deck to start studying</p>
          <Button variant="outline" asChild>
            <Link to="/flashcards">Browse Decks</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <DashboardLayout title="Study Session">
        <div className="text-center py-12">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
          <h3 className="font-display text-xl font-semibold mb-2">No cards to review</h3>
          <p className="text-muted-foreground mb-6">
            {allCards && allCards.length > 0 
              ? "All cards are up to date. Come back later for more reviews!"
              : "Add some flashcards to this deck to start studying"
            }
          </p>
          <Button variant="outline" asChild>
            <Link to={`/flashcards/${deckId}`}>
              {allCards && allCards.length > 0 ? "View Deck" : "Add Cards"}
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Session Complete Screen
  if (isComplete) {
    const accuracy = cards.length > 0 ? Math.round((correctCount / cards.length) * 100) : 0;
    
    return (
      <DashboardLayout title="Session Complete">
        <div className="max-w-lg mx-auto text-center py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Great job!</h1>
            <p className="text-muted-foreground">
              You completed your study session for {deck.name}
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <div className="text-3xl font-bold font-display text-primary">{cards.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Cards Studied</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-success/5 to-transparent border-success/20">
              <div className="text-3xl font-bold font-display text-success">{accuracy}%</div>
              <div className="text-sm text-muted-foreground mt-1">Accuracy</div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
              <div className="text-3xl font-bold font-display">{formatTime(elapsedSeconds)}</div>
              <div className="text-sm text-muted-foreground mt-1">Time Spent</div>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" asChild>
              <Link to="/flashcards">Back to Decks</Link>
            </Button>
            <Button 
              variant="hero" 
              size="lg"
              onClick={() => {
                setCurrentIndex(0);
                setResults([]);
                setIsComplete(false);
                setIsFlipped(false);
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Study Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Breadcrumb */}
          <PageBreadcrumb 
            items={[
              { label: "Flashcards", href: "/flashcards" },
              { label: deck.name, href: `/flashcards/${deckId}` },
              { label: "Study" }
            ]} 
          />

          {/* Session Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(elapsedSeconds)}
              </Badge>
              <Badge variant="accent" className="gap-1.5 px-3 py-1.5">
                <Flame className="w-3.5 h-3.5" />
                {correctCount} correct
              </Badge>
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleEndSession}>
              <X className="w-4 h-4" />
              End Session
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                Card {currentIndex + 1} of {cards.length}
              </span>
              <span className="flex items-center gap-3">
                <span className="text-success font-medium">{correctCount} correct</span>
                <span className="text-destructive font-medium">{results.length - correctCount} incorrect</span>
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Flashcard with swipe support */}
          <StudyFlashcard
            front={currentCard?.front || ""}
            back={currentCard?.back || ""}
            isFlipped={isFlipped}
            onFlip={handleFlip}
            onSwipeLeft={handleNextCard}
            onSwipeRight={handlePrevCard}
          />

          {/* Hint Section */}
          <AnimatePresence>
            {showHint && !isFlipped && currentCard?.hint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="p-4 flex items-start gap-3 bg-accent/5 border-accent/20">
                  <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Hint</p>
                    <p className="text-sm text-muted-foreground">{currentCard.hint}</p>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className={cn(
            "flex items-center justify-center",
            isMobile ? "gap-3 px-2" : "gap-4"
          )}>
            {!isFlipped ? (
              <>
                <Button 
                  variant="outline" 
                  size={isMobile ? "lg" : "lg"}
                  className={cn(
                    "gap-2",
                    isMobile && "flex-1 min-h-[56px]"
                  )}
                  onClick={() => {
                    haptics.light();
                    setShowHint(true);
                  }}
                  disabled={showHint || !currentCard?.hint}
                >
                  <Lightbulb className="w-5 h-5" />
                  {isMobile ? "Hint" : "Show Hint"}
                </Button>
                
                <Button 
                  variant="hero" 
                  size="lg"
                  className={cn(
                    "gap-2",
                    isMobile ? "flex-1 min-h-[56px]" : "min-w-[140px]"
                  )}
                  onClick={handleFlip}
                >
                  <RotateCcw className="w-5 h-5" />
                  {isMobile ? "Reveal" : "Reveal Answer"}
                </Button>
              </>
            ) : (
              <SRSButtons
                onAnswer={handleAnswer}
                isLoading={reviewFlashcard.isPending}
                currentEaseFactor={currentCard?.ease_factor || 2.5}
                currentInterval={currentCard?.interval_days || 0}
                currentRepetitions={currentCard?.repetitions || 0}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button 
              variant="ghost" 
              size={isMobile ? "icon" : "default"}
              className={cn(isMobile && "w-12 h-12")}
              disabled={currentIndex === 0}
              onClick={handlePrevCard}
            >
              <ChevronLeft className={cn(isMobile ? "w-6 h-6" : "w-4 h-4")} />
              {!isMobile && "Previous"}
            </Button>
            
            <div className="flex gap-1.5">
              {cards.slice(0, isMobile ? 8 : 10).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    haptics.selection();
                    setCurrentIndex(idx);
                    setIsFlipped(false);
                    setShowHint(false);
                  }}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    isMobile ? "w-3 h-3" : "w-2.5 h-2.5",
                    idx === currentIndex 
                      ? "bg-primary scale-125" 
                      : idx < currentIndex 
                        ? results[idx]?.correct ? "bg-success" : "bg-destructive"
                        : "bg-muted"
                  )}
                />
              ))}
              {cards.length > (isMobile ? 8 : 10) && (
                <span className="text-xs text-muted-foreground ml-1">+{cards.length - (isMobile ? 8 : 10)}</span>
              )}
            </div>
            
            <Button 
              variant="ghost"
              size={isMobile ? "icon" : "default"}
              className={cn(isMobile && "w-12 h-12")}
              disabled={currentIndex === cards.length - 1}
              onClick={handleNextCard}
            >
              {!isMobile && "Next"}
              <ChevronRight className={cn(isMobile ? "w-6 h-6" : "w-4 h-4")} />
            </Button>
          </div>

          {/* Mobile swipe hint */}
          {isMobile && currentIndex === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Swipe left/right to navigate between cards
            </p>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
