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
  { bg: "bg-primary/12", text: "text-primary", gradient: "from-primary/25 via-primary/10 to-transparent", glow: "shadow-[0_0_20px_-4px_hsl(var(--primary)/0.3)]" },
  { bg: "bg-success/12", text: "text-success", gradient: "from-success/25 via-success/10 to-transparent", glow: "shadow-[0_0_20px_-4px_hsl(var(--success)/0.3)]" },
  { bg: "bg-accent/12", text: "text-accent", gradient: "from-accent/25 via-accent/10 to-transparent", glow: "shadow-[0_0_20px_-4px_hsl(var(--accent)/0.3)]" },
  { bg: "bg-[hsl(280,60%,55%)]/12", text: "text-[hsl(280,60%,55%)]", gradient: "from-[hsl(280,60%,55%)]/25 via-[hsl(280,60%,55%)]/10 to-transparent", glow: "shadow-[0_0_20px_-4px_hsl(280,60%,55%,0.3)]" },
  { bg: "bg-[hsl(190,70%,45%)]/12", text: "text-[hsl(190,70%,45%)]", gradient: "from-[hsl(190,70%,45%)]/25 via-[hsl(190,70%,45%)]/10 to-transparent", glow: "shadow-[0_0_20px_-4px_hsl(190,70%,45%,0.3)]" },
];

export function FlashcardDeckCard({ deck, index, onEdit, onDelete }: FlashcardDeckCardProps) {
  const colorScheme = deckColors[index % deckColors.length];

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group"
      onClick={() => haptics.selection()}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 transition-all duration-300",
        "hover:border-primary/25 hover:shadow-lg"
      )}>
        {/* Stacked cards effect */}
        <div className="absolute -bottom-1 left-2 right-2 h-2 rounded-b-xl bg-card/40 border-x border-b border-border/20 -z-10" />
        <div className="absolute -bottom-2 left-4 right-4 h-2 rounded-b-xl bg-card/20 border-x border-b border-border/10 -z-20" />
        
        {/* Gradient accent bar with glow */}
        <div className={cn("relative h-1.5 w-full bg-gradient-to-r", colorScheme.gradient)}>
          <div className={cn("absolute inset-0 blur-sm", colorScheme.gradient)} />
        </div>
        
        {/* Decorative gradient orb */}
        <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 pointer-events-none bg-gradient-to-br", colorScheme.gradient)} />
        
        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Link to={`/flashcards/${deck.id}`} className="flex items-center gap-3.5 flex-1 min-w-0">
              <motion.div 
                className={cn(
                  "relative w-13 h-13 rounded-xl flex items-center justify-center shrink-0 transition-shadow duration-300",
                  colorScheme.bg,
                  "group-hover:" + colorScheme.glow
                )}
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
              >
                <Layers className={cn("w-6 h-6", colorScheme.text)} />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-semibold text-lg truncate group-hover:text-primary transition-colors duration-200">
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
                  className="shrink-0 min-w-[44px] min-h-[44px] opacity-100 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.selection();
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(deck.updated_at), { addSuffix: true })}
            </span>
            
            <Button 
              variant="default" 
              size="sm" 
              className="gap-1.5 rounded-xl shadow-sm"
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
