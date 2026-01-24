import { motion } from "framer-motion";
import { RotateCcw, ChevronRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { useIsMobile } from "@/hooks/use-mobile";

export interface SRSButtonConfig {
  quality: number;
  label: string;
  shortLabel: string;
  interval: string;
  icon: React.ReactNode;
  variant: "destructive" | "warning" | "success" | "accent";
}

interface SRSButtonsProps {
  onAnswer: (quality: number) => void;
  isLoading?: boolean;
  currentEaseFactor: number;
  currentInterval: number;
  currentRepetitions: number;
}

// Calculate predicted intervals for each button
function calculatePredictedInterval(
  quality: number,
  easeFactor: number,
  interval: number,
  repetitions: number
): string {
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // Failed - reset
    if (quality === 1) {
      return "1m"; // Again
    }
    return "10m"; // Hard after fail
  } else {
    newRepetitions += 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      // Adjust based on quality
      let modifier = 1;
      if (quality === 2) modifier = 0.8; // Hard
      if (quality === 3) modifier = 1.0; // Good
      if (quality === 4) modifier = 1.3; // Easy
      if (quality === 5) modifier = 1.5; // Very Easy
      
      newInterval = Math.round(interval * easeFactor * modifier);
    }
  }

  return formatInterval(newInterval);
}

function formatInterval(days: number): string {
  if (days < 1) return "<1d";
  if (days === 1) return "1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

export function SRSButtons({
  onAnswer,
  isLoading = false,
  currentEaseFactor,
  currentInterval,
  currentRepetitions,
}: SRSButtonsProps) {
  const isMobile = useIsMobile();
  
  const buttons: SRSButtonConfig[] = [
    {
      quality: 1,
      label: "Again",
      shortLabel: "Again",
      interval: "1m",
      icon: <RotateCcw className="w-4 h-4" />,
      variant: "destructive",
    },
    {
      quality: 2,
      label: "Hard",
      shortLabel: "Hard",
      interval: calculatePredictedInterval(2, currentEaseFactor, currentInterval, currentRepetitions),
      icon: <ChevronRight className="w-4 h-4" />,
      variant: "warning",
    },
    {
      quality: 3,
      label: "Good",
      shortLabel: "Good",
      interval: calculatePredictedInterval(3, currentEaseFactor, currentInterval, currentRepetitions),
      icon: <Check className="w-4 h-4" />,
      variant: "success",
    },
    {
      quality: 4,
      label: "Easy",
      shortLabel: "Easy",
      interval: calculatePredictedInterval(4, currentEaseFactor, currentInterval, currentRepetitions),
      icon: <Zap className="w-4 h-4" />,
      variant: "accent",
    },
  ];

  const handleAnswer = (quality: number) => {
    // Haptic feedback based on answer type
    if (quality === 1) {
      haptics.error();
    } else if (quality === 4) {
      haptics.success();
    } else {
      haptics.medium();
    }
    onAnswer(quality);
  };

  return (
    <div className={cn(
      "flex items-stretch justify-center gap-2",
      isMobile ? "w-full" : "gap-3"
    )}>
      {buttons.map((button, index) => (
        <motion.div
          key={button.quality}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(isMobile && "flex-1")}
        >
          <Button
            variant="outline"
            size="lg"
            disabled={isLoading}
            onClick={() => handleAnswer(button.quality)}
            className={cn(
              "flex flex-col items-center gap-1 h-auto transition-all duration-200 active:scale-[0.97]",
              isMobile 
                ? "py-4 px-2 w-full min-h-[72px]" 
                : "py-3 px-4 sm:px-6 min-w-[70px] sm:min-w-[90px]",
              button.variant === "destructive" && "border-destructive/50 hover:bg-destructive/10 hover:border-destructive",
              button.variant === "warning" && "border-warning/50 hover:bg-warning/10 hover:border-warning",
              button.variant === "success" && "border-success/50 hover:bg-success/10 hover:border-success",
              button.variant === "accent" && "border-accent/50 hover:bg-accent/10 hover:border-accent"
            )}
          >
            <span className={cn(
              "flex items-center gap-1.5 font-semibold",
              isMobile ? "text-base" : "text-sm",
              button.variant === "destructive" && "text-destructive",
              button.variant === "warning" && "text-warning",
              button.variant === "success" && "text-success",
              button.variant === "accent" && "text-accent"
            )}>
              {button.icon}
              <span>{isMobile ? button.shortLabel : button.label}</span>
            </span>
            <span className={cn(
              "text-muted-foreground",
              isMobile ? "text-sm" : "text-xs"
            )}>
              {button.interval}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// Extended SM-2 algorithm supporting qualities 1-4
export function calculateNextReviewExtended(
  quality: number, // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
) {
  let newEaseFactor = currentEaseFactor;
  let newInterval = currentInterval;
  let newRepetitions = currentRepetitions;

  if (quality === 1) {
    // Again - reset completely
    newRepetitions = 0;
    newInterval = 0; // Will be due again immediately (or in minutes)
    // Decrease ease factor significantly
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
  } else if (quality === 2) {
    // Hard - don't reset but extend less
    if (newRepetitions === 0) {
      newInterval = 1;
    } else {
      newInterval = Math.max(1, Math.round(currentInterval * 1.2));
    }
    newRepetitions += 1;
    // Slightly decrease ease factor
    newEaseFactor = Math.max(1.3, currentEaseFactor - 0.15);
  } else if (quality === 3) {
    // Good - standard SM-2 progression
    newRepetitions += 1;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
    // Keep ease factor the same
  } else if (quality === 4) {
    // Easy - boost interval
    newRepetitions += 1;
    
    if (newRepetitions === 1) {
      newInterval = 4;
    } else if (newRepetitions === 2) {
      newInterval = 10;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor * 1.3);
    }
    // Increase ease factor
    newEaseFactor = Math.min(3.0, currentEaseFactor + 0.1);
  }

  const nextReview = new Date();
  if (quality === 1) {
    // Again - review in 1 minute (for the session)
    nextReview.setMinutes(nextReview.getMinutes() + 1);
  } else {
    nextReview.setDate(nextReview.getDate() + newInterval);
  }

  return {
    ease_factor: newEaseFactor,
    interval_days: newInterval,
    repetitions: newRepetitions,
    next_review: nextReview.toISOString(),
  };
}
