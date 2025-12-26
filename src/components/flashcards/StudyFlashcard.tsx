import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StudyFlashcardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export function StudyFlashcard({ front, back, isFlipped, onFlip }: StudyFlashcardProps) {
  return (
    <div 
      className="flashcard-flip-container w-full h-[400px] cursor-pointer select-none"
      onClick={onFlip}
    >
      <div className={cn("flashcard-inner", isFlipped && "flipped")}>
        {/* Front */}
        <div className="flashcard-face">
          <div className="absolute top-4 left-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              Question
            </span>
          </div>
          
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <p className="font-display text-2xl md:text-3xl font-semibold leading-relaxed">
              {front}
            </p>
          </div>
          
          <div className="absolute bottom-6 text-sm text-muted-foreground">
            Click to reveal answer
          </div>
        </div>
        
        {/* Back */}
        <div className="flashcard-face flashcard-back">
          <div className="absolute top-4 left-4">
            <span className="text-xs font-medium uppercase tracking-wider text-primary-foreground bg-primary px-3 py-1.5 rounded-full">
              Answer
            </span>
          </div>
          
          <div className="flex-1 flex items-center justify-center text-center px-4">
            <p className="font-display text-xl md:text-2xl font-medium leading-relaxed text-foreground">
              {back}
            </p>
          </div>
          
          <div className="absolute bottom-6 text-sm text-muted-foreground">
            Click to see question
          </div>
        </div>
      </div>
    </div>
  );
}
