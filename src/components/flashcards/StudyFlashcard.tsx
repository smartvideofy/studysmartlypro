import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";

interface StudyFlashcardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function StudyFlashcard({ 
  front, 
  back, 
  isFlipped, 
  onFlip,
  onSwipeLeft,
  onSwipeRight 
}: StudyFlashcardProps) {
  const isMobile = useIsMobile();
  
  // Swipe gesture for mobile navigation
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: () => {
      if (onSwipeLeft) {
        haptics.light();
        onSwipeLeft();
      }
    },
    onSwipeRight: () => {
      if (onSwipeRight) {
        haptics.light();
        onSwipeRight();
      }
    },
    threshold: 50,
  });

  const handleFlip = () => {
    haptics.medium();
    onFlip();
  };

  return (
    <div 
      className={cn(
        "flashcard-flip-container w-full cursor-pointer select-none gpu-accelerated",
        isMobile ? "h-[320px]" : "h-[400px]"
      )}
      onClick={handleFlip}
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
    >
      <div className={cn("flashcard-inner", isFlipped && "flipped")}>
        {/* Front */}
        <div className="flashcard-face">
          <div className="absolute top-4 left-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              Question
            </span>
          </div>
          
          <div className="flashcard-text-viewport px-4">
            <p className={cn(
              "font-display font-semibold leading-relaxed break-words",
              isMobile ? "text-lg" : "text-xl md:text-2xl"
            )}>
              {front}
            </p>
          </div>

          <div className="absolute bottom-6 text-sm text-muted-foreground">
            {isMobile ? "Tap to reveal" : "Click to reveal answer"}
          </div>
        </div>
        
        {/* Back */}
        <div className="flashcard-face flashcard-back">
          <div className="absolute top-4 left-4">
            <span className="text-xs font-medium uppercase tracking-wider text-primary-foreground bg-primary px-3 py-1.5 rounded-full">
              Answer
            </span>
          </div>
          
          <div className="flashcard-text-viewport px-4">
            <p className={cn(
              "font-display font-medium leading-relaxed text-foreground break-words",
              isMobile ? "text-base" : "text-lg md:text-xl"
            )}>
              {back}
            </p>
          </div>

          <div className="absolute bottom-6 text-sm text-muted-foreground">
            {isMobile ? "Tap to see question" : "Click to see question"}
          </div>
        </div>
      </div>
    </div>
  );
}