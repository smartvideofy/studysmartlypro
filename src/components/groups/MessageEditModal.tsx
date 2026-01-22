import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface MessageEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalContent: string;
  onSave: (newContent: string) => Promise<void>;
}

export function MessageEditModal({
  open,
  onOpenChange,
  originalContent,
  onSave,
}: MessageEditModalProps) {
  const [content, setContent] = useState(originalContent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setContent(originalContent);
    }
  }, [open, originalContent]);

  const handleSave = async () => {
    if (!content.trim() || content === originalContent) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(content);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to save, Shift+Enter for new line
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !content.trim() || content === originalContent}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
