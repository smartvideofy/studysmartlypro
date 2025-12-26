import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Layers, 
  Clock,
  Play,
  Sparkles,
  Brain,
  Target,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreateDeckModal } from "@/components/flashcards/CreateDeckModal";
import { DeleteConfirmModal } from "@/components/flashcards/DeleteConfirmModal";
import { AIGeneratorModal } from "@/components/flashcards/AIGeneratorModal";
import { FlashcardDeckCard } from "@/components/flashcards/FlashcardDeckCard";
import { useDecks, useDueCards, useDeleteDeck, FlashcardDeck } from "@/hooks/useFlashcards";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function FlashcardsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDeckOpen, setCreateDeckOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<FlashcardDeck | null>(null);
  
  const navigate = useNavigate();
  const { data: decks, isLoading: decksLoading } = useDecks();
  const { data: dueCards } = useDueCards();
  const deleteDeck = useDeleteDeck();

  const isLoading = decksLoading;

  // Filter decks based on search
  const filteredDecks = decks?.filter(deck => 
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalCards = decks?.reduce((sum, deck) => sum + (deck.card_count || 0), 0) || 0;
  const totalDue = dueCards?.length || 0;
  const totalMastered = 0; // TODO: Calculate from flashcard data

  const handleDeleteDeck = async () => {
    if (!deletingDeck) return;
    try {
      await deleteDeck.mutateAsync(deletingDeck.id);
      setDeletingDeck(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeckCreated = (deckId: string) => {
    navigate(`/flashcards/${deckId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Flashcards">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Flashcards">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Overview */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{totalCards}</p>
                <p className="text-xs text-muted-foreground">Total Cards</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{totalMastered}</p>
                <p className="text-xs text-muted-foreground">Mastered</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{totalDue}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{decks?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Decks</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Study Banner */}
        {totalDue > 0 && (
          <motion.div variants={itemVariants}>
            <Card variant="gradient" className="overflow-hidden">
              <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <Badge variant="accent" className="mb-2">
                    <Clock className="w-3 h-3 mr-1" />
                    {totalDue} cards due
                  </Badge>
                  <h3 className="font-display text-xl font-semibold mb-1">
                    Ready to study?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Review your due cards to maintain your retention.
                  </p>
                </div>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/study">
                    <Play className="w-5 h-5" />
                    Start Review
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Header Actions */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAiGeneratorOpen(true)}>
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Generate</span>
            </Button>
            
            <Button variant="hero" size="sm" onClick={() => setCreateDeckOpen(true)}>
              <Plus className="w-4 h-4" />
              New Deck
            </Button>
          </div>
        </motion.div>

        {/* Decks Grid */}
        <motion.div variants={itemVariants}>
          {filteredDecks.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDecks.map((deck, index) => (
                <FlashcardDeckCard
                  key={deck.id}
                  deck={deck}
                  index={index}
                  onEdit={setEditingDeck}
                  onDelete={setDeletingDeck}
                />
              ))}
            </div>
          ) : decks && decks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2">No decks yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first flashcard deck to start learning with spaced repetition
              </p>
              <Button variant="hero" size="lg" onClick={() => setCreateDeckOpen(true)}>
                <Plus className="w-5 h-5" />
                Create Your First Deck
              </Button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-semibold mb-2">No matching decks</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      <CreateDeckModal 
        open={createDeckOpen} 
        onOpenChange={setCreateDeckOpen}
        onSuccess={handleDeckCreated}
      />

      <CreateDeckModal 
        open={!!editingDeck} 
        onOpenChange={(open) => !open && setEditingDeck(null)}
        deck={editingDeck}
      />

      <DeleteConfirmModal
        open={!!deletingDeck}
        onOpenChange={(open) => !open && setDeletingDeck(null)}
        title="Delete Deck"
        description={`Are you sure you want to delete "${deletingDeck?.name}"? All flashcards in this deck will be permanently deleted. This action cannot be undone.`}
        onConfirm={handleDeleteDeck}
        isLoading={deleteDeck.isPending}
      />

      <AIGeneratorModal
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
      />
    </DashboardLayout>
  );
}
