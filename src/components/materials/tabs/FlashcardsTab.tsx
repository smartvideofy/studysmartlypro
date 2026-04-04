import { useState } from "react";
import { 
  Lightbulb, 
  Save,
  Loader2,
  Sparkles,
  FolderPlus,
  Check,
  RefreshCw,
  Play,
  ExternalLink,
  Layers
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalBody,
} from "@/components/ui/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlashcardStudyDrawer } from "./FlashcardStudyDrawer";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [savedDeckId, setSavedDeckId] = useState<string | null>(null);
  const [showStudyDrawer, setShowStudyDrawer] = useState(false);

  // Fetch flashcards from material_flashcards table
  const { data: flashcards, isLoading } = useQuery({
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

  // Fetch auto-saved deck linked to this material
  const { data: linkedDeck } = useQuery({
    queryKey: ['linked-deck', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('id, name')
        .eq('source_material_id', materialId)
        .maybeSingle();

      if (error) throw error;
      return data;
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

  const selectAllCards = () => {
    if (!flashcards) return;
    if (selectedCards.size === flashcards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(flashcards.map(c => c.id)));
    }
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

  // Count difficulties
  const easyCount = flashcards.filter(c => c.difficulty === 'easy').length;
  const mediumCount = flashcards.filter(c => c.difficulty === 'medium').length;
  const hardCount = flashcards.filter(c => c.difficulty === 'hard').length;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header with Stats */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Flashcards
            </h3>
            <p className="text-sm text-muted-foreground">
              {flashcards.length} cards ready to study
            </p>
          </div>
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
        </div>

        {/* Difficulty Breakdown */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
          {easyCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {easyCount} <span className="hidden sm:inline">Easy</span>
              </span>
            </div>
          )}
          {mediumCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {mediumCount} <span className="hidden sm:inline">Medium</span>
              </span>
            </div>
          )}
          {hardCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {hardCount} <span className="hidden sm:inline">Hard</span>
              </span>
            </div>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-3">
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full gap-3 h-14 text-base"
            onClick={() => setShowStudyDrawer(true)}
          >
            <Play className="w-5 h-5" />
            Start Studying
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => setShowSaveDialog(true)}
            >
              <FolderPlus className="w-4 h-4" />
              Save to Deck
            </Button>
            {savedDeckId && (
              <Button 
                variant="secondary" 
                className="flex-1 gap-2"
                onClick={() => navigate(`/flashcards/${savedDeckId}`)}
              >
                <ExternalLink className="w-4 h-4" />
                Open Saved Deck
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Card Preview List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Card Preview
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={selectAllCards}
            >
              {selectedCards.size === flashcards.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          {flashcards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => toggleCardSelection(card.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                selectedCards.has(card.id)
                  ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                  : "border-border bg-card/50"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                selectedCards.has(card.id) 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-muted-foreground"
              )}>
                {selectedCards.has(card.id) ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{card.front}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{card.back}</p>
              </div>
              {card.difficulty && (
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                  card.difficulty === 'easy' && 'bg-green-500/10 text-green-600 dark:text-green-400',
                  card.difficulty === 'hard' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                  card.difficulty === 'medium' && 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                )}>
                  {card.difficulty}
                </span>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Study Drawer - Full Screen Experience */}
      <FlashcardStudyDrawer
        open={showStudyDrawer}
        onOpenChange={setShowStudyDrawer}
        flashcards={flashcards}
        initialIndex={0}
      />

      {/* Save to Deck Dialog - Now Responsive */}
      <ResponsiveModal open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <ResponsiveModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <ResponsiveModalTitle>Save Flashcards to Deck</ResponsiveModalTitle>
              <ResponsiveModalDescription>
                {selectedCards.size > 0 
                  ? `Save ${selectedCards.size} selected cards to a deck`
                  : `Save all ${flashcards.length} flashcards to a deck`
                }
              </ResponsiveModalDescription>
            </div>
          </div>
        </ResponsiveModalHeader>

        <ResponsiveModalBody>
          <div className="space-y-4 py-2">
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
        </ResponsiveModalBody>

        <ResponsiveModalFooter className="pt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowSaveDialog(false)}
            className="flex-1 md:flex-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveToDecks}
            disabled={saveToDeckmutation.isPending || (!selectedDeckId && !newDeckName.trim())}
            className="flex-1 md:flex-none"
          >
            {saveToDeckmutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Cards
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>
    </div>
  );
}
