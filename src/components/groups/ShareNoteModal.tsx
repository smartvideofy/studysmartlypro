import { useState } from "react";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotes } from "@/hooks/useNotes";
import { useShareNote, useSharedNotes } from "@/hooks/useSharedNotes";
import { cn } from "@/lib/utils";

interface ShareNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export default function ShareNoteModal({ open, onOpenChange, groupId }: ShareNoteModalProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const { data: notes, isLoading } = useNotes();
  const { data: sharedNotes } = useSharedNotes(groupId);
  const shareNote = useShareNote();

  const alreadySharedIds = new Set(sharedNotes?.map(sn => sn.note_id) || []);
  const availableNotes = notes?.filter(n => !alreadySharedIds.has(n.id)) || [];

  const handleShare = () => {
    if (!selectedNoteId) return;
    shareNote.mutate(
      { noteId: selectedNoteId, groupId },
      {
        onSuccess: () => {
          setSelectedNoteId(null);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share a Note</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] mt-2">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading notes...</p>
          ) : !availableNotes.length ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No notes available to share</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a note first or all notes are already shared
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedNoteId === note.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary/50"
                  )}
                >
                  <h4 className="font-medium text-sm">{note.title || "Untitled"}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {note.content?.substring(0, 80) || "No content"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!selectedNoteId || shareNote.isPending}
          >
            {shareNote.isPending ? "Sharing..." : "Share Note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
