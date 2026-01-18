import { X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReplyPreviewProps {
  replyTo: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancel: () => void;
  className?: string;
}

export function ReplyPreview({ replyTo, onCancel, className }: ReplyPreviewProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 bg-secondary/50 border-l-2 border-primary rounded-r-lg",
      className
    )}>
      <Reply className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary truncate">
          Replying to {replyTo.senderName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {replyTo.content}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onCancel}
        className="h-6 w-6 shrink-0"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
