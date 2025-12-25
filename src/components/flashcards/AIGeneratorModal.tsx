import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  FileText,
  Clipboard,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Layers,
  Pencil,
} from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import { useAIGenerateFlashcardsAdvanced } from "@/hooks/useAINotes";
import { useCreateDeck, useCreateFlashcard, useDecks } from "@/hooks/useFlashcards";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Flashcard {
  front: string;
  back: string;
  selected?: boolean;
}

interface AIGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "source" | "settings" | "generating" | "review" | "save";
type SourceType = "paste" | "note";
type CardType = "qa" | "definition" | "fill-blank" | "mixed";
type Difficulty = "beginner" | "intermediate" | "advanced" | "mixed";

export function AIGeneratorModal({ open, onOpenChange }: AIGeneratorModalProps) {
  const navigate = useNavigate();
  const { data: notes } = useNotes();
  const { data: decks } = useDecks();
  const { generateFlashcards, isLoading: isGenerating } = useAIGenerateFlashcardsAdvanced();
  const createDeck = useCreateDeck();
  const createFlashcard = useCreateFlashcard();

  // State
  const [step, setStep] = useState<Step>("source");
  const [sourceType, setSourceType] = useState<SourceType>("paste");
  const [pastedText, setPastedText] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  
  // Settings
  const [cardCount, setCardCount] = useState<string>("10");
  const [difficulty, setDifficulty] = useState<Difficulty>("mixed");
  const [cardType, setCardType] = useState<CardType>("qa");
  
  // Review
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingCard, setEditingCard] = useState<{ front: string; back: string } | null>(null);
  
  // Save
  const [deckName, setDeckName] = useState("");
  const [saveMode, setSaveMode] = useState<"new" | "existing">("new");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("source");
      setSourceType("paste");
      setPastedText("");
      setSelectedNoteId("");
      setCardCount("10");
      setDifficulty("mixed");
      setCardType("qa");
      setFlashcards([]);
      setCurrentIndex(0);
      setEditingCard(null);
      setDeckName("");
      setSaveMode("new");
      setSelectedDeckId("");
    }
  }, [open]);

  const selectedNote = notes?.find(n => n.id === selectedNoteId);

  const getSourceContent = () => {
    if (sourceType === "paste") return pastedText;
    if (sourceType === "note" && selectedNote) return selectedNote.content || "";
    return "";
  };

  const getSourceTitle = () => {
    if (sourceType === "note" && selectedNote) return selectedNote.title;
    return "Pasted Content";
  };

  const canProceedToSettings = () => {
    if (sourceType === "paste") return pastedText.trim().length > 50;
    if (sourceType === "note") return !!selectedNoteId;
    return false;
  };

  const handleGenerate = async () => {
    const content = getSourceContent();
    const title = getSourceTitle();
    
    if (!content || content.trim().length < 50) {
      toast.error("Content is too short to generate flashcards");
      return;
    }

    setStep("generating");
    
    const result = await generateFlashcards(title, content, {
      cardCount: parseInt(cardCount),
      difficulty,
      cardType,
    });

    if (result) {
      setFlashcards(result.map(f => ({ ...f, selected: true })));
      setDeckName(title);
      setStep("review");
    } else {
      setStep("settings");
    }
  };

  const toggleSelection = (index: number) => {
    setFlashcards(prev =>
      prev.map((f, i) => (i === index ? { ...f, selected: !f.selected } : f))
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

  const handleSave = async () => {
    const selectedCards = flashcards.filter(f => f.selected);
    if (selectedCards.length === 0) {
      toast.error("Please select at least one flashcard");
      return;
    }

    try {
      let deckId: string;

      if (saveMode === "new") {
        if (!deckName.trim()) {
          toast.error("Please enter a deck name");
          return;
        }
        const deck = await createDeck.mutateAsync({
          name: deckName.trim(),
          description: `Generated with AI from ${getSourceTitle()}`,
          note_id: sourceType === "note" ? selectedNoteId : undefined,
        });
        deckId = deck.id;
      } else {
        if (!selectedDeckId) {
          toast.error("Please select a deck");
          return;
        }
        deckId = selectedDeckId;
      }

      await Promise.all(
        selectedCards.map(card =>
          createFlashcard.mutateAsync({
            deck_id: deckId,
            front: card.front,
            back: card.back,
          })
        )
      );

      toast.success(`Added ${selectedCards.length} flashcards!`);
      onOpenChange(false);
      navigate(`/flashcards/${deckId}`);
    } catch (error) {
      // Error handled by mutations
    }
  };

  const isSaving = createDeck.isPending || createFlashcard.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Flashcard Generator
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Source Selection */}
          {step === "source" && (
            <motion.div
              key="source"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="paste" className="gap-2">
                    <Clipboard className="w-4 h-4" />
                    Paste Text
                  </TabsTrigger>
                  <TabsTrigger value="note" className="gap-2">
                    <FileText className="w-4 h-4" />
                    From Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="paste" className="space-y-3 mt-4">
                  <Label>Paste your study material</Label>
                  <Textarea
                    placeholder="Paste your notes, textbook content, or any study material here... (minimum 50 characters)"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {pastedText.length} characters • Minimum 50 required
                  </p>
                </TabsContent>

                <TabsContent value="note" className="space-y-3 mt-4">
                  <Label>Select a note</Label>
                  <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a note..." />
                    </SelectTrigger>
                    <SelectContent>
                      {notes?.map((note) => (
                        <SelectItem key={note.id} value={note.id}>
                          {note.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedNote && (
                    <Card className="p-3 bg-muted/50">
                      <p className="text-sm line-clamp-3 text-muted-foreground">
                        {selectedNote.content?.substring(0, 200) || "No content"}...
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep("settings")} disabled={!canProceedToSettings()}>
                  Next: Settings
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Settings */}
          {step === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Cards</Label>
                  <Select value={cardCount} onValueChange={setCardCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 cards</SelectItem>
                      <SelectItem value="10">10 cards</SelectItem>
                      <SelectItem value="15">15 cards</SelectItem>
                      <SelectItem value="20">20 cards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Card Type</Label>
                <Select value={cardType} onValueChange={(v) => setCardType(v as CardType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qa">Q&A (Question & Answer)</SelectItem>
                    <SelectItem value="definition">Definitions (Term → Definition)</SelectItem>
                    <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                    <SelectItem value="mixed">Mixed Types</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Ready to generate</p>
                    <p className="text-sm text-muted-foreground">
                      {cardCount} {cardType} flashcards at {difficulty} difficulty from your {sourceType === "note" ? "note" : "pasted content"}.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep("source")}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button onClick={handleGenerate} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Flashcards
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium">Generating flashcards...</p>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing your content and creating {cardCount} {cardType} flashcards
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === "review" && flashcards.length > 0 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Review and edit your flashcards
                </p>
                <Badge variant="secondary">
                  {selectedCount} of {flashcards.length} selected
                </Badge>
              </div>

              <Card className="p-6 min-h-[220px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline">Card {currentIndex + 1} of {flashcards.length}</Badge>
                  <div className="flex gap-2">
                    {!editingCard && (
                      <Button variant="ghost" size="sm" onClick={startEditing}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
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
                </div>

                {editingCard ? (
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Question</Label>
                      <Textarea
                        value={editingCard.front}
                        onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Answer</Label>
                      <Textarea
                        value={editingCard.back}
                        onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit}>
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
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
                )}
              </Card>

              {/* Navigation dots */}
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
                <div className="flex gap-1 max-w-[200px] overflow-x-auto">
                  {flashcards.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors flex-shrink-0 ${
                        i === currentIndex
                          ? "bg-primary"
                          : f.selected
                            ? "bg-muted-foreground/50"
                            : "bg-muted"
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

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep("settings")}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button onClick={() => setStep("save")} disabled={selectedCount === 0}>
                  Continue with {selectedCount} cards
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Save */}
          {step === "save" && (
            <motion.div
              key="save"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Tabs value={saveMode} onValueChange={(v) => setSaveMode(v as "new" | "existing")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new">Create New Deck</TabsTrigger>
                  <TabsTrigger value="existing">Add to Existing</TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="deckName">Deck Name</Label>
                    <Input
                      id="deckName"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      placeholder="Enter deck name..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="existing" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label>Select Deck</Label>
                    <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a deck..." />
                      </SelectTrigger>
                      <SelectContent>
                        {decks?.map((deck) => (
                          <SelectItem key={deck.id} value={deck.id}>
                            {deck.name} ({deck.card_count || 0} cards)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <Card className="p-4 bg-success/5 border-success/20">
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Ready to save</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCount} flashcards will be added to {saveMode === "new" ? `"${deckName || "your new deck"}"` : "the selected deck"}.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep("review")}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      Save Flashcards
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
