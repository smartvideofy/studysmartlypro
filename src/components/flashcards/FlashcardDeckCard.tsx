import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Layers, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Play,
  Clock,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlashcardDeck } from "@/hooks/useFlashcards";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface FlashcardDeckCardProps {
  deck: FlashcardDeck;
  index: number;
  onEdit: (deck: FlashcardDeck) => void;
  onDelete: (deck: FlashcardDeck) => void;
}

const deckColors = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-success/10", text: "text-success" },
  { bg: "bg-accent/10", text: "text-accent" },
  { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" },
];

export function FlashcardDeckCard({ deck, index, onEdit, onDelete }: FlashcardDeckCardProps) {
  const colorScheme = deckColors[index % deckColors.length];

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => haptics.selection()}
    >
      <div className={cn(
        "relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-200",
        "hover:shadow-md hover:border-primary/20"
      )}>
        {/* Color accent bar */}
        <div className={cn("h-1 w-full", colorScheme.bg.replace('/10', '/30'))} />
        
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Link to={`/flashcards/${deck.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-11 h-11 rounded-lg flex items-center justify-center shrink-0",
                colorScheme.bg
              )}>
                <Layers className={cn("w-5 h-5", colorScheme.text)} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate hover:text-primary transition-colors">
                  {deck.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {deck.subject || 'General'}
                </p>
              </div>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="shrink-0 h-9 w-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.selection();
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(deck)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Deck
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/flashcards/${deck.id}`}>
                    <Layers className="w-4 h-4 mr-2" />
                    Manage Cards
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(deck)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {deck.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {deck.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm",
              colorScheme.bg
            )}>
              <BookOpen className={cn("w-3.5 h-3.5", colorScheme.text)} />
              <span className={cn("font-medium", colorScheme.text)}>{deck.card_count || 0}</span>
              <span className="text-muted-foreground text-xs">cards</span>
            </div>
            {deck.is_public && (
              <Badge variant="secondary" className="text-xs rounded-full">
                Public
              </Badge>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(deck.updated_at), { addSuffix: true })}
            </span>
            
            <Button 
              size="sm" 
              className="gap-1.5"
              asChild
              onClick={(e) => {
                e.stopPropagation();
                haptics.medium();
              }}
            >
              <Link to={`/study/${deck.id}`}>
                <Play className="w-3.5 h-3.5" />
                Study
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
