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

interface FlashcardDeckCardProps {
  deck: FlashcardDeck;
  index: number;
  onEdit: (deck: FlashcardDeck) => void;
  onDelete: (deck: FlashcardDeck) => void;
}

const deckColors = [
  { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
  { bg: "bg-[hsl(280,60%,55%)]/10", text: "text-[hsl(280,60%,55%)]", border: "border-[hsl(280,60%,55%)]/20" },
  { bg: "bg-[hsl(190,70%,45%)]/10", text: "text-[hsl(190,70%,45%)]", border: "border-[hsl(190,70%,45%)]/20" },
];

const deckGradients = [
  "from-primary/20 to-primary/5",
  "from-success/20 to-success/5",
  "from-accent/20 to-accent/5",
  "from-[hsl(280,60%,55%)]/20 to-[hsl(280,60%,55%)]/5",
  "from-[hsl(190,70%,45%)]/20 to-[hsl(190,70%,45%)]/5",
];

export function FlashcardDeckCard({ deck, index, onEdit, onDelete }: FlashcardDeckCardProps) {
  const colorScheme = deckColors[index % deckColors.length];
  const gradient = deckGradients[index % deckGradients.length];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-card border border-border/50 transition-shadow duration-300",
        "hover:shadow-lg"
      )}>
        {/* Color accent bar */}
        <div className={cn("h-1.5 w-full bg-gradient-to-r", gradient)} />
        
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Link to={`/flashcards/${deck.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                colorScheme.bg
              )}>
                <Layers className={cn("w-6 h-6", colorScheme.text)} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-lg truncate hover:text-primary transition-colors">
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
                  size="icon-sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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

          {/* Description if exists */}
          {deck.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {deck.description}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-sm">
              <BookOpen className={cn("w-4 h-4", colorScheme.text)} />
              <span className="font-medium">{deck.card_count || 0}</span>
              <span className="text-muted-foreground">terms</span>
            </div>
            {deck.is_public && (
              <Badge variant="secondary" className="text-xs">
                Public
              </Badge>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(deck.updated_at), { addSuffix: true })}
            </span>
            
            <Button 
              variant="default" 
              size="sm" 
              className={cn("gap-1.5", colorScheme.bg, colorScheme.text, "hover:opacity-80")}
              asChild
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
