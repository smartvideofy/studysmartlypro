import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Layers,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { CreateDeckModal } from "@/components/flashcards/CreateDeckModal";
import { FlashcardEditorModal } from "@/components/flashcards/FlashcardEditorModal";
import { DeleteConfirmModal } from "@/components/flashcards/DeleteConfirmModal";
import { useDeck, useFlashcards, useDeleteDeck, useDeleteFlashcard, Flashcard } from "@/hooks/useFlashcards";
import { formatDistanceToNow } from "date-fns";
import { Skeleton, SkeletonFlashcardRow } from "@/components/ui/skeleton";

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

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [editDeckOpen, setEditDeckOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deleteDeckOpen, setDeleteDeckOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null);

  const { data: deck, isLoading: deckLoading } = useDeck(deckId || "");
  const { data: flashcards, isLoading: cardsLoading } = useFlashcards(deckId || "");
  const deleteDeck = useDeleteDeck();
  const deleteFlashcard = useDeleteFlashcard();

  const isLoading = deckLoading || cardsLoading;

  const filteredCards = flashcards?.filter(card => 
    card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.back.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteDeck = async () => {
    if (!deckId) return;
    try {
      await deleteDeck.mutateAsync(deckId);
      navigate("/flashcards");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteCard = async () => {
    if (!deletingCard || !deckId) return;
    try {
      await deleteFlashcard.mutateAsync({ id: deletingCard.id, deckId });
      setDeletingCard(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-48" />
          
          {/* Header Skeleton */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>

          {/* Search & Add Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>

          {/* Cards List Skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonFlashcardRow key={i} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!deck) {
    return (
      <DashboardLayout title="Deck Not Found">
        <div className="text-center py-12">
          <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-display text-xl font-semibold mb-2">Deck not found</h3>
          <p className="text-muted-foreground mb-6">This deck may have been deleted</p>
          <Button variant="outline" asChild>
            <Link to="/flashcards">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flashcards
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Breadcrumb */}
        <PageBreadcrumb 
          items={[
            { label: "Flashcards", href: "/flashcards" },
            { label: deck.name }
          ]} 
        />

        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl font-bold">{deck.name}</h1>
              {deck.is_public && <Badge variant="accent">Public</Badge>}
            </div>
            {deck.subject && (
              <Badge variant="muted" className="mb-2">{deck.subject}</Badge>
            )}
            {deck.description && (
              <p className="text-muted-foreground text-sm max-w-lg">{deck.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {deck.card_count} cards · Updated {formatDistanceToNow(new Date(deck.updated_at), { addSuffix: true })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="hero" asChild>
              <Link to={`/study/${deck.id}`}>
                <Play className="w-4 h-4" />
                Study
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDeckOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Deck
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteDeckOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Deck
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Search & Add */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button variant="hero" size="sm" onClick={() => setAddCardOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Card
          </Button>
        </motion.div>

        {/* Cards List */}
        <motion.div variants={itemVariants}>
          {filteredCards.length > 0 ? (
            <div className="space-y-3">
              {filteredCards.map((card, index) => (
                <Card key={card.id} variant="interactive" className="group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0 grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Front</p>
                          <p className="text-sm line-clamp-3">{card.front}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Back</p>
                          <p className="text-sm text-muted-foreground line-clamp-3">{card.back}</p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon-sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCard(card)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingCard(card)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {card.hint && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Hint:</span> {card.hint}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : flashcards && flashcards.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-semibold mb-2">No cards yet</h3>
              <p className="text-muted-foreground mb-6">Add your first flashcard to start learning</p>
              <Button variant="hero" onClick={() => setAddCardOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Card
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-semibold mb-2">No matching cards</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      <CreateDeckModal 
        open={editDeckOpen} 
        onOpenChange={setEditDeckOpen}
        deck={deck}
      />

      <FlashcardEditorModal
        open={addCardOpen}
        onOpenChange={setAddCardOpen}
        deckId={deckId || ""}
      />

      <FlashcardEditorModal
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
        deckId={deckId || ""}
        flashcard={editingCard}
      />

      <DeleteConfirmModal
        open={deleteDeckOpen}
        onOpenChange={setDeleteDeckOpen}
        title="Delete Deck"
        description="Are you sure you want to delete this deck? All flashcards in this deck will be permanently deleted. This action cannot be undone."
        onConfirm={handleDeleteDeck}
        isLoading={deleteDeck.isPending}
      />

      <DeleteConfirmModal
        open={!!deletingCard}
        onOpenChange={(open) => !open && setDeletingCard(null)}
        title="Delete Flashcard"
        description="Are you sure you want to delete this flashcard? This action cannot be undone."
        onConfirm={handleDeleteCard}
        isLoading={deleteFlashcard.isPending}
      />
    </DashboardLayout>
  );
}
