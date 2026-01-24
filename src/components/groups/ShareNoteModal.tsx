import { useState } from "react";
import { FileText, Plus, Loader2 } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNotes, useCreateNote } from "@/hooks/useNotes";
import { useShareNote, useSharedNotes } from "@/hooks/useSharedNotes";
import { cn } from "@/lib/utils";

interface ShareNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export default function ShareNoteModal({ open, onOpenChange, groupId }: ShareNoteModalProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  
  const { data: notes, isLoading } = useNotes();
  const { data: sharedNotes } = useSharedNotes(groupId);
  const shareNote = useShareNote();
  const createNote = useCreateNote();
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateAndShare = async () => {
    if (!newTitle.trim()) return;
    
    setIsCreating(true);
    try {
      const newNote = await createNote.mutateAsync({
        title: newTitle.trim(),
        content: newContent.trim(),
      });
      
      if (newNote?.id) {
        await shareNote.mutateAsync({ noteId: newNote.id, groupId });
      }
      
      setNewTitle("");
      setNewContent("");
      setShowCreateForm(false);
      onOpenChange(false);
    } catch (error) {
      // Errors handled by mutation hooks
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedNoteId(null);
    setShowCreateForm(false);
    setNewTitle("");
    setNewContent("");
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleClose}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>
          {showCreateForm ? "Create & Share Note" : "Share a Note"}
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <ResponsiveModalBody>
        {showCreateForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter note title..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your note content..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[250px] md:h-[300px]">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading notes...</p>
            ) : !availableNotes.length ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">No notes available to share</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a new note to share with your group
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Note
                </Button>
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
        )}
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        {showCreateForm ? (
          <>
            <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={isCreating}>
              Back
            </Button>
            <Button onClick={handleCreateAndShare} disabled={!newTitle.trim() || isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Share"
              )}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowCreateForm(true)}
              className="text-muted-foreground mr-auto"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create New
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={!selectedNoteId || shareNote.isPending}
            >
              {shareNote.isPending ? "Sharing..." : "Share Note"}
            </Button>
          </>
        )}
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
