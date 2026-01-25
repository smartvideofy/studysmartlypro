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
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreateDeckModal } from "@/components/flashcards/CreateDeckModal";
import { DeleteConfirmModal } from "@/components/flashcards/DeleteConfirmModal";
import { AIGeneratorModal } from "@/components/flashcards/AIGeneratorModal";
import { FlashcardDeckCard } from "@/components/flashcards/FlashcardDeckCard";
import { useDecks, useDueCards, useDeleteDeck, useMasteredCards, FlashcardDeck } from "@/hooks/useFlashcards";
import { Skeleton, SkeletonDeckCard, SkeletonFlashcardStat } from "@/components/ui/skeleton";
import { ErrorRecovery } from "@/components/ui/error-recovery";
import { useQueryClient } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo/SEOHead";
import { createFlashcardsJsonLd } from "@/components/seo/jsonld";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function FlashcardsSkeleton() {
  return (
    <DashboardLayout title="Flashcards">
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonFlashcardStat key={i} />
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-start sm:items-center justify-between">
          <Skeleton className="h-10 md:h-10 w-full max-w-md rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 md:w-28 rounded-lg" />
            <Skeleton className="h-9 w-20 md:w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonDeckCard key={i} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function FlashcardsPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDeckOpen, setCreateDeckOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [deletingDeck, setDeletingDeck] = useState<FlashcardDeck | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: decks, isLoading: decksLoading, isError: decksError } = useDecks();
  const { data: dueCards, isError: dueCardsError } = useDueCards();
  const { data: masteredCount, isError: masteredError } = useMasteredCards();
  const deleteDeck = useDeleteDeck();

  const isLoading = decksLoading;
  const hasError = decksError || dueCardsError || masteredError;

  const handleRetry = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['decks'] }),
      queryClient.invalidateQueries({ queryKey: ['due-cards'] }),
      queryClient.invalidateQueries({ queryKey: ['mastered-cards'] }),
    ]);
  };

  const filteredDecks = decks?.filter(deck => 
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalCards = decks?.reduce((sum, deck) => sum + (deck.card_count || 0), 0) || 0;
  const totalDue = dueCards?.length || 0;
  const totalMastered = masteredCount || 0;

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
    return <FlashcardsSkeleton />;
  }

  if (hasError) {
    return (
      <DashboardLayout title="Flashcards">
        <ErrorRecovery
          title="Failed to load flashcards"
          message="We couldn't load your flashcard decks. Please check your connection and try again."
          onRetry={handleRetry}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Flashcards">
      <SEOHead
        title="Flashcards"
        description="Create and study flashcards with AI-powered spaced repetition. Master any subject with smart review scheduling and track your progress."
        url="/flashcards"
        jsonLd={createFlashcardsJsonLd()}
      />
      <PullToRefresh onRefresh={handleRetry} disabled={!isMobile}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-5 md:space-y-6"
        >
          {/* Stats Overview - Clean design */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          >
            {[
              { icon: Layers, label: "Total Cards", value: totalCards, color: "text-primary", bg: "bg-primary/10" },
              { icon: CheckCircle2, label: "Mastered", value: totalMastered, color: "text-success", bg: "bg-success/10" },
              { icon: Target, label: "Due Today", value: totalDue, color: "text-accent", bg: "bg-accent/10" },
              { icon: Brain, label: "Decks", value: decks?.length || 0, color: "text-primary", bg: "bg-primary/10" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                        <stat.icon className={`w-5 h-5 md:w-5.5 md:h-5.5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl md:text-3xl font-bold font-display tracking-tight">{stat.value}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Study Banner */}
          {totalDue > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <Badge variant="secondary" className="mb-2 gap-1">
                      <Clock className="w-3 h-3" />
                      {totalDue} cards due
                    </Badge>
                    <h3 className="font-display text-lg font-semibold mb-1">
                      Ready to study?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Review your due cards to maintain your retention.
                    </p>
                  </div>
                  <Button size="lg" asChild>
                    <Link to="/study">
                      <Play className="w-4 h-4 mr-1" />
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
            <div className="relative flex-1 max-w-md w-full">
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
                <span className="hidden sm:inline ml-1">AI Generate</span>
              </Button>
              
              <Button size="sm" onClick={() => setCreateDeckOpen(true)}>
                <Plus className="w-4 h-4" />
                <span className="ml-1">New Deck</span>
              </Button>
            </div>
          </motion.div>

          {/* Decks Grid */}
          <motion.div variants={itemVariants}>
            {filteredDecks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
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
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layers className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No decks yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your first flashcard deck to start learning with spaced repetition
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button size="lg" onClick={() => setCreateDeckOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Your First Deck
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/materials">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Generate from Materials
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="w-14 h-14 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-display text-lg font-semibold mb-2">No matching decks</h3>
                <p className="text-muted-foreground">Try a different search term</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </PullToRefresh>

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
