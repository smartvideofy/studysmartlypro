import { useState } from "react";
import { Pin, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PinnedMessage, useTogglePin } from "@/hooks/useMessagePinning";

interface PinnedMessagesPanelProps {
  pinnedMessages: PinnedMessage[];
  groupId: string;
  canUnpin: boolean;
  onJumpToMessage: (messageId: string) => void;
}

export function PinnedMessagesPanel({ 
  pinnedMessages, 
  groupId, 
  canUnpin,
  onJumpToMessage 
}: PinnedMessagesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const togglePin = useTogglePin();

  if (!pinnedMessages?.length) return null;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const displayedMessages = isExpanded ? pinnedMessages : pinnedMessages.slice(0, 1);

  return (
    <div className="border-b border-border bg-secondary/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-sm hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary rotate-45" />
          <span className="font-medium">{pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}</span>
        </div>
        {pinnedMessages.length > 1 && (
          isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <div className={cn(
        "divide-y divide-border/50 overflow-hidden transition-all",
        isExpanded ? "max-h-[300px] overflow-y-auto" : "max-h-[60px]"
      )}>
        {displayedMessages.map((msg) => (
          <div
            key={msg.id}
            className="px-3 py-2 flex items-start gap-3 hover:bg-secondary/50 transition-colors group"
          >
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={msg.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(msg.profiles?.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <button
              onClick={() => onJumpToMessage(msg.id)}
              className="flex-1 min-w-0 text-left"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{msg.profiles?.full_name || "Unknown"}</span>
                <span>•</span>
                <span>{format(new Date(msg.created_at), "MMM d")}</span>
              </div>
              <p className="text-sm line-clamp-1 mt-0.5">{msg.content}</p>
            </button>

            {canUnpin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin.mutate({ messageId: msg.id, groupId, isPinned: true });
                }}
                disabled={togglePin.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
