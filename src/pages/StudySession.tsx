import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Clock,
  Target,
  Flame,
  X,
  Volume2,
  Loader2,
  Layers,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { 
  useDeck, 
  useDueFlashcards, 
  useFlashcards,
  useReviewFlashcard,
  Flashcard 
} from "@/hooks/useFlashcards";
import { 
  useCreateStudySession, 
  useUpdateStudySession 
} from "@/hooks/useStudySessions";

export default function StudySession() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  
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

  const handleAnswer = async (correct: boolean) => {
    if (!currentCard) return;

    // Update spaced repetition
    const quality = correct ? 4 : 1; // 4 = good, 1 = fail
    await reviewFlashcard.mutateAsync({
      id: currentCard.id,
      deckId: deckId || "",
      quality,
      currentEaseFactor: currentCard.ease_factor,
      currentInterval: currentCard.interval_days,
      currentRepetitions: currentCard.repetitions,
    });

    setResults([...results, { id: currentCard.id, correct }]);
    setIsFlipped(false);
    setShowHint(false);
    
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
    setIsFlipped(!isFlipped);
    setShowHint(false);
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
            <Card variant="elevated" className="p-4">
              <div className="text-2xl font-bold text-primary">{cards.length}</div>
              <div className="text-sm text-muted-foreground">Cards Studied</div>
            </Card>
            <Card variant="elevated" className="p-4">
              <div className="text-2xl font-bold text-success">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
            <Card variant="elevated" className="p-4">
              <div className="text-2xl font-bold">{formatTime(elapsedSeconds)}</div>
              <div className="text-sm text-muted-foreground">Time</div>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/flashcards">Back to Decks</Link>
            </Button>
            <Button 
              variant="hero" 
              onClick={() => {
                setCurrentIndex(0);
                setResults([]);
                setIsComplete(false);
                setIsFlipped(false);
              }}
            >
              Study Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Studying: ${deck.name}`}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Session Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {formatTime(elapsedSeconds)}
              </Badge>
              <Badge variant="accent">
                <Flame className="w-3 h-3 mr-1" />
                {correctCount} correct
              </Badge>
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleEndSession}>
              <X className="w-4 h-4 mr-1" />
              End Session
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Card {currentIndex + 1} of {cards.length}</span>
              <span className="flex items-center gap-2">
                <span className="text-success">{correctCount} correct</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-destructive">{results.length - correctCount} incorrect</span>
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Flashcard */}
          <div className="perspective-1000">
            <motion.div
              className="relative w-full h-[400px] cursor-pointer"
              onClick={handleFlip}
              style={{ transformStyle: "preserve-3d" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <Card 
                    variant="elevated" 
                    className={cn(
                      "h-full flex flex-col items-center justify-center p-8 text-center",
                      isFlipped ? "bg-success/5 border-success/20" : ""
                    )}
                  >
                    <Badge variant={isFlipped ? "success" : "secondary"} className="mb-4">
                      {isFlipped ? "Answer" : "Question"}
                    </Badge>
                    
                    <p className="font-display text-2xl font-semibold mb-6 max-w-lg">
                      {isFlipped ? currentCard?.back : currentCard?.front}
                    </p>
                    
                    {!isFlipped && (
                      <p className="text-sm text-muted-foreground">
                        Click to reveal answer
                      </p>
                    )}
                  </Card>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Hint Section */}
          <AnimatePresence>
            {showHint && !isFlipped && currentCard?.hint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card variant="glass" className="p-4 flex items-start gap-3">
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
          <div className="flex items-center justify-center gap-4">
            {!isFlipped ? (
              <>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowHint(true)}
                  disabled={showHint || !currentCard?.hint}
                >
                  <Lightbulb className="w-5 h-5" />
                  Hint
                </Button>
                
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={handleFlip}
                >
                  <RotateCcw className="w-5 h-5" />
                  Flip Card
                </Button>
                
                <Button variant="outline" size="lg" disabled>
                  <Volume2 className="w-5 h-5" />
                  Listen
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => handleAnswer(false)}
                  disabled={reviewFlashcard.isPending}
                >
                  <ThumbsDown className="w-5 h-5" />
                  {reviewFlashcard.isPending ? "..." : "Didn't Know"}
                </Button>
                
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={() => handleAnswer(true)}
                  disabled={reviewFlashcard.isPending}
                >
                  <ThumbsUp className="w-5 h-5" />
                  {reviewFlashcard.isPending ? "..." : "Got It!"}
                </Button>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button 
              variant="ghost" 
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex(currentIndex - 1);
                setIsFlipped(false);
                setShowHint(false);
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex gap-1">
              {cards.slice(0, 10).map((_, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentIndex 
                      ? "bg-primary" 
                      : idx < currentIndex 
                        ? results[idx]?.correct ? "bg-success" : "bg-destructive"
                        : "bg-muted"
                  )}
                />
              ))}
              {cards.length > 10 && (
                <span className="text-xs text-muted-foreground ml-1">+{cards.length - 10}</span>
              )}
            </div>
            
            <Button 
              variant="ghost"
              disabled={currentIndex === cards.length - 1}
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
                setShowHint(false);
              }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
