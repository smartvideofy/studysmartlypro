import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  Save,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FolderPlus,
  Check,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FlashcardsTabProps {
  materialId: string;
}

interface MaterialFlashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty?: string;
}

export default function FlashcardsTab({ materialId }: FlashcardsTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const regenerate = useRegenerateContent(materialId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);

  // Fetch flashcards from material_flashcards table
  const { data: flashcards, isLoading, refetch } = useQuery({
    queryKey: ['material-flashcards', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_flashcards')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MaterialFlashcard[];
    },
    enabled: !!user && !!materialId,
  });

  // Fetch user's flashcard decks
  const { data: decks } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create new deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert({
          name,
          user_id: user!.id,
          description: `Created from study material`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
  });

  // Save flashcards to deck mutation
  const saveToDeckmutation = useMutation({
    mutationFn: async ({ deckId, cards }: { deckId: string; cards: MaterialFlashcard[] }) => {
      const flashcardsToInsert = cards.map(card => ({
        deck_id: deckId,
        front: card.front,
        back: card.back,
        hint: card.hint,
      }));

      const { error } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert);

      if (error) throw error;

      // Get current card count and update
      const { data: deck } = await supabase
        .from('flashcard_decks')
        .select('card_count')
        .eq('id', deckId)
        .single();

      const newCount = (deck?.card_count || 0) + flashcardsToInsert.length;

      await supabase
        .from('flashcard_decks')
        .update({ card_count: newCount })
        .eq('id', deckId);
    },
    onSuccess: (_, variables) => {
      setSavedDeckId(variables.deckId);
      toast.success('Flashcards saved to deck!', {
        action: {
          label: 'View Deck',
          onClick: () => navigate(`/flashcards/${variables.deckId}`),
        },
      });
      setShowSaveDialog(false);
      setSelectedCards(new Set());
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
    },
    onError: (error) => {
      toast.error('Failed to save flashcards');
      console.error(error);
    },
  });

  const handleRegenerate = () => {
    regenerate.mutate("flashcards");
  };

  const handleSaveToDecks = async () => {
    if (!flashcards) return;

    let deckId = selectedDeckId;

    if (isCreatingDeck && newDeckName.trim()) {
      try {
        const newDeck = await createDeckMutation.mutateAsync(newDeckName.trim());
        deckId = newDeck.id;
      } catch {
        toast.error('Failed to create deck');
        return;
      }
    }

    if (!deckId || deckId === '__none__') {
      toast.error('Please select or create a deck');
      return;
    }

    const cardsToSave = selectedCards.size > 0
      ? flashcards.filter(card => selectedCards.has(card.id))
      : flashcards;

    saveToDeckmutation.mutate({ deckId, cards: cardsToSave });
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

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
          Generate AI flashcards from your study material.
        </p>
        <Button className="gap-2" onClick={handleRegenerate} disabled={regenerate.isPending}>
          {regenerate.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
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
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleRegenerate}
            disabled={regenerate.isPending}
          >
            {regenerate.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowSaveDialog(true)}
          >
            <FolderPlus className="w-4 h-4" />
            Save to Deck
          </Button>
          {savedDeckId && (
            <Button 
              variant="hero" 
              size="sm" 
              className="gap-2"
              onClick={() => navigate(`/flashcards/${savedDeckId}`)}
            >
              View Saved Deck
            </Button>
          )}
        </div>
      </div>

      {/* Flashcard Display */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Progress */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          {currentCard.difficulty && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              currentCard.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
              currentCard.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' :
              'bg-yellow-500/10 text-yellow-500'
            }`}>
              {currentCard.difficulty}
            </span>
          )}
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
              key={card.id}
              onClick={() => {
                setCurrentIndex(index);
                setIsFlipped(false);
              }}
              className={`shrink-0 w-20 h-12 rounded-lg border text-xs p-2 text-left transition-all relative ${
                index === currentIndex
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="line-clamp-2">{card.front}</span>
              {selectedCards.has(card.id) && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Save to Deck Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Flashcards to Deck</DialogTitle>
            <DialogDescription>
              {selectedCards.size > 0 
                ? `Save ${selectedCards.size} selected cards to a deck`
                : `Save all ${flashcards.length} flashcards to a deck`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Deck</Label>
              <Select 
                value={selectedDeckId || '__none__'} 
                onValueChange={(val) => {
                  setSelectedDeckId(val === '__none__' ? '' : val);
                  setIsCreatingDeck(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a deck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select a deck...</SelectItem>
                  {decks?.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name} ({deck.card_count || 0} cards)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-2">
              <Label>Create New Deck</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="New deck name..."
                  value={newDeckName}
                  onChange={(e) => {
                    setNewDeckName(e.target.value);
                    setIsCreatingDeck(e.target.value.length > 0);
                    if (e.target.value.length > 0) {
                      setSelectedDeckId('');
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveToDecks}
              disabled={saveToDeckmutation.isPending || (!selectedDeckId && !newDeckName.trim())}
            >
              {saveToDeckmutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Cards
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
