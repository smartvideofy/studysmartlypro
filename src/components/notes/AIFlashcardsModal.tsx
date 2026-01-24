import { useState, useEffect } from "react";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layers, Loader2, Check, X, ChevronLeft, ChevronRight, Pencil, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCreateDeck, useCreateFlashcard } from "@/hooks/useFlashcards";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  const [editingCard, setEditingCard] = useState<{ front: string; back: string } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const createDeck = useCreateDeck();
  const createFlashcard = useCreateFlashcard();

  // Reset state when modal opens with new flashcards
  useEffect(() => {
    if (initialFlashcards && initialFlashcards.length > 0) {
      setFlashcards(initialFlashcards.map(f => ({ ...f, selected: true })));
      setCurrentIndex(0);
      setStep('review');
      setDeckName(noteTitle);
      setEditingCard(null);
      setIsFlipped(false);
    }
  }, [initialFlashcards, noteTitle]);

  const toggleSelection = (index: number) => {
    setFlashcards(prev => 
      prev.map((f, i) => i === index ? { ...f, selected: !f.selected } : f)
    );
  };

  const startEditing = () => {
    const card = flashcards[currentIndex];
    setEditingCard({ front: card.front, back: card.back });
  };

  const saveEdit = () => {
    if (!editingCard) return;
    setFlashcards(prev =>
      prev.map((f, i) =>
        i === currentIndex ? { ...f, front: editingCard.front, back: editingCard.back } : f
      )
    );
    setEditingCard(null);
  };

  const cancelEdit = () => {
    setEditingCard(null);
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
      const deck = await createDeck.mutateAsync({
        name: deckName.trim(),
        description: `Generated from note: ${noteTitle}`,
        note_id: noteId,
      });

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

  const goToCard = (index: number) => {
    setCurrentIndex(index);
    setIsFlipped(false);
    setEditingCard(null);
  };

  const isSaving = createDeck.isPending || createFlashcard.isPending;

  return (
    <ResponsiveModal 
      open={open} 
      onOpenChange={(v) => {
        if (!v) {
          setFlashcards([]);
          setStep('review');
          setEditingCard(null);
          setIsFlipped(false);
        }
        onOpenChange(v);
      }}
      className="max-w-3xl"
    >
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          AI Generated Flashcards
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <ResponsiveModalBody>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16 gap-4">
            <div className="relative">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 md:w-8 md:h-8 animate-spin text-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium">Generating flashcards...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        ) : flashcards.length > 0 ? (
          <div className="space-y-4 md:space-y-5">
            {step === 'review' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Review and edit your flashcards before saving
                  </p>
                  <Badge variant="secondary" className="gap-1.5 text-xs">
                    <Check className="w-3 h-3" />
                    {selectedCount} of {flashcards.length} selected
                  </Badge>
                </div>

                {/* Flashcard Preview */}
                <div 
                  className="flashcard-flip-container h-[200px] md:h-[280px] cursor-pointer"
                  onClick={() => !editingCard && setIsFlipped(!isFlipped)}
                >
                  <div className={cn("flashcard-inner", isFlipped && !editingCard && "flipped")}>
                    {/* Front */}
                    <div className="flashcard-face !p-4 md:!p-6">
                      <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 flex items-center justify-between">
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
                          Question
                        </span>
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          {currentIndex + 1} / {flashcards.length}
                        </Badge>
                      </div>
                      
                      {editingCard ? (
                        <div className="w-full pt-6 md:pt-8 space-y-2 md:space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1 md:space-y-1.5">
                            <Label className="text-[10px] md:text-xs text-muted-foreground">Question</Label>
                            <Textarea
                              value={editingCard.front}
                              onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                              className="min-h-[50px] md:min-h-[60px] resize-none text-sm"
                            />
                          </div>
                          <div className="space-y-1 md:space-y-1.5">
                            <Label className="text-[10px] md:text-xs text-muted-foreground">Answer</Label>
                            <Textarea
                              value={editingCard.back}
                              onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                              className="min-h-[50px] md:min-h-[60px] resize-none text-sm"
                            />
                          </div>
                          <div className="flex gap-2 pt-1 md:pt-2">
                            <Button size="sm" onClick={saveEdit} className="gap-1 text-xs md:text-sm">
                              <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit} className="text-xs md:text-sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 flex items-center justify-center text-center px-2 md:px-4">
                            <p className="font-display text-base md:text-xl font-semibold leading-relaxed">
                              {currentCard?.front}
                            </p>
                          </div>
                          <div className="absolute bottom-3 md:bottom-4 text-[10px] md:text-xs text-muted-foreground">
                            Click to flip
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Back */}
                    <div className="flashcard-face flashcard-back !p-4 md:!p-6">
                      <div className="absolute top-3 md:top-4 left-3 md:left-4">
                        <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-primary-foreground bg-primary px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
                          Answer
                        </span>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center text-center px-2 md:px-4">
                        <p className="font-display text-sm md:text-lg font-medium leading-relaxed">
                          {currentCard?.back}
                        </p>
                      </div>
                      
                      <div className="absolute bottom-3 md:bottom-4 text-[10px] md:text-xs text-muted-foreground">
                        Click to flip back
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-center gap-2">
                  {!editingCard && (
                    <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5 text-xs md:text-sm">
                      <Pencil className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant={currentCard?.selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSelection(currentIndex)}
                    className="gap-1.5 text-xs md:text-sm"
                  >
                    {currentCard?.selected ? (
                      <>
                        <Check className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        Selected
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        Excluded
                      </>
                    )}
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToCard(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="gap-1 text-xs md:text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden md:inline">Previous</span>
                  </Button>
                  
                  <div className="flex gap-1 md:gap-1.5 max-w-[140px] md:max-w-[200px] overflow-x-auto py-1">
                    {flashcards.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => goToCard(i)}
                        className={cn(
                          "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all flex-shrink-0",
                          i === currentIndex 
                            ? "bg-primary scale-125" 
                            : f.selected 
                              ? "bg-muted-foreground/50 hover:bg-muted-foreground/70" 
                              : "bg-muted hover:bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToCard(Math.min(flashcards.length - 1, currentIndex + 1))}
                    disabled={currentIndex === flashcards.length - 1}
                    className="gap-1 text-xs md:text-sm"
                  >
                    <span className="hidden md:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-2 md:py-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Layers className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                </div>
                
                <div className="text-center">
                  <h3 className="font-display text-base md:text-lg font-semibold mb-1">Name your deck</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Creating a deck with <strong>{selectedCount}</strong> flashcards
                  </p>
                </div>
                
                <div className="max-w-sm mx-auto space-y-2">
                  <Label htmlFor="deckName">Deck Name</Label>
                  <Input
                    id="deckName"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Enter deck name..."
                    className="text-center"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Layers className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No flashcards generated yet</p>
          </div>
        )}
      </ResponsiveModalBody>

      {flashcards.length > 0 && !isLoading && (
        <ResponsiveModalFooter className="border-t pt-4">
          {step === 'review' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep('create')} disabled={selectedCount === 0} className="gap-1.5">
                <Layers className="w-4 h-4" />
                Continue with {selectedCount} cards
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('review')}>
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleCreateDeck} disabled={isSaving} className="gap-1.5 min-w-[120px] md:min-w-[140px]">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Deck
                  </>
                )}
              </Button>
            </>
          )}
        </ResponsiveModalFooter>
      )}
    </ResponsiveModal>
  );
}
