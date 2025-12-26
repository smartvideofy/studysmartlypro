import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  Plus, 
  Save,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface FlashcardsTabProps {
  materialId: string;
}

interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
}

export default function FlashcardsTab({ materialId }: FlashcardsTabProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fetch flashcards linked to this material via flashcard_decks
  const { data: flashcards, isLoading } = useQuery({
    queryKey: ['material-flashcards', materialId],
    queryFn: async () => {
      // First get decks linked to this material's note
      const { data: decks } = await supabase
        .from('flashcard_decks')
        .select('id')
        .eq('note_id', materialId);

      if (!decks || decks.length === 0) return [];

      const deckIds = decks.map(d => d.id);
      const { data: cards, error } = await supabase
        .from('flashcards')
        .select('*')
        .in('deck_id', deckIds);

      if (error) throw error;
      return cards as GeneratedFlashcard[];
    },
    enabled: !!user && !!materialId,
  });

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : (flashcards?.length || 1) - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < (flashcards?.length || 1) - 1 ? prev + 1 : 0));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lightbulb className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Generate flashcards from your material to help with memorization.
        </p>
        <Button className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Flashcards
        </Button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold">Flashcards</h3>
          <p className="text-sm text-muted-foreground">
            {flashcards.length} cards generated
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add to Deck
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Save className="w-4 h-4" />
            Save All
          </Button>
        </div>
      </div>

      {/* Flashcard Display */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Progress */}
        <div className="text-sm text-muted-foreground mb-4">
          Card {currentIndex + 1} of {flashcards.length}
        </div>

        {/* Card */}
        <div 
          className="flashcard-flip-container w-full max-w-md aspect-[3/2] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* Front */}
            <div className="flashcard-face">
              <p className="text-center text-lg font-medium">{currentCard.front}</p>
              <p className="text-xs text-muted-foreground mt-4">Click to flip</p>
            </div>
            
            {/* Back */}
            <div className="flashcard-face flashcard-back">
              <p className="text-center text-lg">{currentCard.back}</p>
              {currentCard.hint && (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  💡 {currentCard.hint}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 mt-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevious}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsFlipped(false)}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <ScrollArea className="mt-6">
        <div className="flex gap-2 pb-2">
          {flashcards.map((card, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
              className={`shrink-0 w-20 h-12 rounded-lg border text-xs p-2 text-left transition-all ${
                index === currentIndex
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="line-clamp-2">{card.front}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
