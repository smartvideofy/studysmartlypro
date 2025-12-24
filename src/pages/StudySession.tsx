import { useState } from "react";
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
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";

const sampleCards = [
  { id: 1, front: "What is photosynthesis?", back: "The process by which plants convert sunlight, water, and CO₂ into glucose and oxygen.", hint: "Think about what plants need to survive." },
  { id: 2, front: "Define mitochondria", back: "The powerhouse of the cell - organelles that generate most of the cell's ATP through cellular respiration.", hint: "Energy production" },
  { id: 3, front: "What is the Krebs cycle?", back: "A series of chemical reactions in aerobic respiration that releases stored energy through the oxidation of acetyl-CoA.", hint: "Also called citric acid cycle" },
  { id: 4, front: "Explain osmosis", back: "The movement of water molecules from an area of lower solute concentration to higher solute concentration through a semi-permeable membrane.", hint: "Water movement" },
];

export default function StudySession() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<{id: number, correct: boolean}[]>([]);
  
  const currentCard = sampleCards[currentIndex];
  const progress = ((currentIndex + 1) / sampleCards.length) * 100;
  
  const handleAnswer = (correct: boolean) => {
    setResults([...results, { id: currentCard.id, correct }]);
    setIsFlipped(false);
    setShowHint(false);
    
    if (currentIndex < sampleCards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 200);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const correctCount = results.filter(r => r.correct).length;

  return (
    <DashboardLayout title="Study Session">
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
                5:30
              </Badge>
              <Badge variant="accent">
                <Flame className="w-3 h-3 mr-1" />
                7 streak
              </Badge>
            </div>
            
            <Button variant="ghost" size="sm">
              <X className="w-4 h-4 mr-1" />
              End Session
            </Button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Card {currentIndex + 1} of {sampleCards.length}</span>
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
                      {isFlipped ? currentCard.back : currentCard.front}
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
            {showHint && !isFlipped && (
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
                  disabled={showHint}
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
                
                <Button variant="outline" size="lg">
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
                >
                  <ThumbsDown className="w-5 h-5" />
                  Didn't Know
                </Button>
                
                <Button 
                  variant="success" 
                  size="lg"
                  onClick={() => handleAnswer(true)}
                >
                  <ThumbsUp className="w-5 h-5" />
                  Got It!
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
              {sampleCards.map((_, idx) => (
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
            </div>
            
            <Button 
              variant="ghost"
              disabled={currentIndex === sampleCards.length - 1}
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
