import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  Keyboard,
  Maximize2,
  Minimize2,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { haptics } from "@/lib/haptics";

interface MaterialFlashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty?: string;
}

interface FlashcardStudyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcards: MaterialFlashcard[];
  initialIndex?: number;
}

export function FlashcardStudyDrawer({
  open,
  onOpenChange,
  flashcards,
  initialIndex = 0,
}: FlashcardStudyDrawerProps) {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [shuffledCards, setShuffledCards] = useState<MaterialFlashcard[]>([]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setIsFlipped(false);
      setShowHint(false);
      setShuffledCards([...flashcards]);
    }
  }, [open, initialIndex, flashcards]);

  const currentCard = shuffledCards[currentIndex] || flashcards[currentIndex];
  const progress = ((studiedCards.size) / flashcards.length) * 100;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
    haptics.light();
    if (!isFlipped && currentCard) {
      setStudiedCards((prev) => new Set(prev).add(currentCard.id));
    }
  }, [isFlipped, currentCard]);

  const handlePrevious = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
    haptics.light();
  }, [flashcards.length]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
    haptics.light();
  }, [flashcards.length]);

  const handleShuffle = useCallback(() => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    haptics.medium();
  }, [flashcards]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setStudiedCards(new Set());
    setShuffledCards([...flashcards]);
    haptics.medium();
  }, [flashcards]);

  // Swipe gestures for mobile
  const swipeHandlers = useSwipeGesture({
    threshold: 50,
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  });

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          handleFlip();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "h":
          e.preventDefault();
          setShowHint((prev) => !prev);
          break;
        case "Escape":
          onOpenChange(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleFlip, handlePrevious, handleNext, onOpenChange]);

  if (!currentCard) return null;

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-success/10 text-success border-success/20";
      case "hard":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn(
        "focus:outline-none",
        isFullscreen ? "h-screen" : "h-[90vh]"
      )}>
        <div className="flex flex-col h-full bg-gradient-hero">
          {/* Header */}
          <DrawerHeader className="flex-shrink-0 border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DrawerTitle className="text-lg font-semibold">
                  Study Session
                </DrawerTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{studiedCards.size} of {flashcards.length} studied</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="h-10 w-10 touch-target"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-10 w-10 touch-target"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
            </div>
          </DrawerHeader>

          {/* Main content */}
          <div 
            className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden"
            {...(isMobile ? swipeHandlers : {})}
          >
            {/* Card counter and difficulty */}
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <span className="text-sm font-medium text-muted-foreground">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              {currentCard.difficulty && (
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full border font-medium capitalize",
                  getDifficultyColor(currentCard.difficulty)
                )}>
                  {currentCard.difficulty}
                </span>
              )}
            </div>

            {/* Flashcard */}
            <motion.div
              className="flashcard-flip-container w-full max-w-2xl aspect-[4/3] cursor-pointer select-none"
              onClick={handleFlip}
              whileHover={!isMobile ? { scale: 1.01 } : {}}
              whileTap={{ scale: 0.99 }}
            >
              <div className={cn("flashcard-inner", isFlipped && "flipped")}>
                {/* Front */}
                <div className="flashcard-face study-flashcard-face">
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full">
                      Question
                    </span>
                  </div>
                  
                  <div className="flashcard-text-viewport px-6 md:px-8">
                    <p className="font-display text-lg md:text-xl lg:text-3xl font-semibold leading-relaxed break-words">
                      {currentCard.front}
                    </p>
                  </div>

                  <div className="absolute bottom-4 md:bottom-6 flex flex-col items-center gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">
                      {isMobile ? "Tap to reveal" : "Click or press Space to reveal"}
                    </span>
                    <AnimatePresence>
                      {showHint && currentCard.hint && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center gap-2 text-xs md:text-sm text-primary bg-primary/10 px-4 py-2 rounded-full"
                        >
                          <Lightbulb className="w-4 h-4" />
                          {currentCard.hint}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Back */}
                <div className="flashcard-face flashcard-back study-flashcard-face">
                  <div className="absolute top-4 left-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-foreground bg-primary px-3 py-1.5 rounded-full">
                      Answer
                    </span>
                  </div>
                  
                  <div className="flashcard-text-viewport px-6 md:px-8">
                    <p className="font-display text-base md:text-lg lg:text-2xl font-medium leading-relaxed break-words">
                      {currentCard.back}
                    </p>
                  </div>

                  <div className="absolute bottom-4 md:bottom-6 text-xs md:text-sm text-muted-foreground">
                    {isMobile ? "Tap to see question" : "Click or press Space to see question"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Hint button (only show if hint exists and card not flipped) */}
            {!isFlipped && currentCard.hint && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHint(!showHint);
                  haptics.light();
                }}
                className="mt-4 gap-2 text-muted-foreground hover:text-primary h-11 touch-target"
              >
                <Lightbulb className="w-4 h-4" />
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
            )}

            {/* Swipe hint for mobile */}
            {isMobile && (
              <p className="text-xs text-muted-foreground mt-4">
                Swipe left/right to navigate cards
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 border-t border-border/50 p-4 pb-safe">
            <div className={cn(
              "flex items-center justify-center gap-2 md:gap-3 mb-4",
              isMobile && "flex-wrap"
            )}>
              <Button
                variant="outline"
                size={isMobile ? "lg" : "default"}
                onClick={handlePrevious}
                className={cn(
                  "gap-2",
                  isMobile && "flex-1 h-14 text-base"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>
              
              {!isMobile && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsFlipped(false);
                      setShowHint(false);
                    }}
                    className="h-11 w-11"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShuffle}
                    className="h-11 w-11"
                  >
                    <Shuffle className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="h-11 w-11"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size={isMobile ? "lg" : "default"}
                onClick={handleNext}
                className={cn(
                  "gap-2",
                  isMobile && "flex-1 h-14 text-base"
                )}
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile action buttons */}
            {isMobile && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsFlipped(false);
                    setShowHint(false);
                  }}
                  className="h-12 w-12 touch-target"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShuffle}
                  className="h-12 w-12 touch-target"
                >
                  <Shuffle className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="h-12 w-12 touch-target"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Keyboard shortcuts - hide on mobile */}
            {!isMobile && (
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Keyboard className="w-3 h-3" />
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Space</kbd>
                  Flip
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">←</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">→</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">H</kbd>
                  Hint
                </span>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
