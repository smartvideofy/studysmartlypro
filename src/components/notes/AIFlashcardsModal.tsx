import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Loader2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreateDeck, useCreateFlashcard } from "@/hooks/useFlashcards";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Flashcard {
  front: string;
  back: string;
  selected?: boolean;
}

interface AIFlashcardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcards: Flashcard[] | null;
  isLoading: boolean;
  noteTitle: string;
  noteId: string;
}

export function AIFlashcardsModal({
  open,
  onOpenChange,
  flashcards: initialFlashcards,
  isLoading,
  noteTitle,
  noteId,
}: AIFlashcardsModalProps) {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckName, setDeckName] = useState(noteTitle);
  const [step, setStep] = useState<'review' | 'create'>('review');

  const createDeck = useCreateDeck();
  const createFlashcard = useCreateFlashcard();

  // Update flashcards when new ones come in
  useState(() => {
    if (initialFlashcards) {
      setFlashcards(initialFlashcards.map(f => ({ ...f, selected: true })));
      setCurrentIndex(0);
      setStep('review');
    }
  });

  // Reset state when modal opens with new flashcards
  if (initialFlashcards && flashcards.length === 0) {
    setFlashcards(initialFlashcards.map(f => ({ ...f, selected: true })));
  }

  const toggleSelection = (index: number) => {
    setFlashcards(prev => 
      prev.map((f, i) => i === index ? { ...f, selected: !f.selected } : f)
    );
  };

  const selectedCount = flashcards.filter(f => f.selected).length;
  const currentCard = flashcards[currentIndex];

  const handleCreateDeck = async () => {
    if (!deckName.trim()) {
      toast.error("Please enter a deck name");
      return;
    }

    const selectedCards = flashcards.filter(f => f.selected);
    if (selectedCards.length === 0) {
      toast.error("Please select at least one flashcard");
      return;
    }

    try {
      // Create the deck
      const deck = await createDeck.mutateAsync({
        name: deckName.trim(),
        description: `Generated from note: ${noteTitle}`,
        note_id: noteId,
      });

      // Create all selected flashcards
      await Promise.all(
        selectedCards.map(card =>
          createFlashcard.mutateAsync({
            deck_id: deck.id,
            front: card.front,
            back: card.back,
          })
        )
      );

      toast.success(`Created deck with ${selectedCards.length} flashcards!`);
      onOpenChange(false);
      setFlashcards([]);
      navigate(`/flashcards/${deck.id}`);
    } catch (error) {
      // Error handled by mutations
    }
  };

  const isSaving = createDeck.isPending || createFlashcard.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setFlashcards([]);
        setStep('review');
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            AI Generated Flashcards
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating flashcards...</p>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="space-y-4">
            {step === 'review' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Review and select flashcards to save
                  </p>
                  <Badge variant="secondary">
                    {selectedCount} of {flashcards.length} selected
                  </Badge>
                </div>

                {/* Card Preview */}
                <Card className="p-6 min-h-[200px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline">Card {currentIndex + 1} of {flashcards.length}</Badge>
                    <Button
                      variant={currentCard?.selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSelection(currentIndex)}
                    >
                      {currentCard?.selected ? (
                        <>
                          <Check className="w-4 h-4" />
                          Selected
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Excluded
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Question</p>
                      <p className="text-foreground font-medium">{currentCard?.front}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Answer</p>
                      <p className="text-foreground">{currentCard?.back}</p>
                    </div>
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {flashcards.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentIndex 
                            ? 'bg-primary' 
                            : f.selected 
                              ? 'bg-muted-foreground/50' 
                              : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(i => Math.min(flashcards.length - 1, i + 1))}
                    disabled={currentIndex === flashcards.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setStep('create')} disabled={selectedCount === 0}>
                    Continue with {selectedCount} cards
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deckName">Deck Name</Label>
                    <Input
                      id="deckName"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      placeholder="Enter deck name..."
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Creating a deck with <strong>{selectedCount}</strong> flashcards from your note.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep('review')}>
                    Back
                  </Button>
                  <Button onClick={handleCreateDeck} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        Create Deck
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No flashcards generated yet
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
