import { useState } from "react";
import { Smile, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ReactionSummary } from "@/hooks/useMessageReactions";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

interface MessageReactionsProps {
  reactions: ReactionSummary[];
  onToggleReaction: (emoji: string) => void;
  isMe: boolean;
  isPending?: boolean;
}

export function MessageReactions({ 
  reactions, 
  onToggleReaction, 
  isMe,
  isPending 
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onToggleReaction(emoji);
    setIsOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", isMe ? "justify-end" : "justify-start")}>
      {reactions.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => onToggleReaction(reaction.emoji)}
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
            reaction.hasReacted 
              ? "bg-primary/20 text-primary border border-primary/30" 
              : "bg-secondary hover:bg-secondary/80 border border-transparent"
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 opacity-0 group-hover/message:opacity-100 transition-opacity"
          >
            {reactions.length > 0 ? (
              <Plus className="w-3 h-3" />
            ) : (
              <Smile className="w-3 h-3" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-2" 
          side={isMe ? "left" : "right"}
          align="center"
        >
          <div className="flex gap-1">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-secondary transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
