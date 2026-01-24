import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateNote } from "@/hooks/useNotes";
import { useShareNote } from "@/hooks/useSharedNotes";

interface UploadNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export default function UploadNoteModal({ open, onOpenChange, groupId }: UploadNoteModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createNote = useCreateNote();
  const shareNote = useShareNote();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Create the note first
      const newNote = await createNote.mutateAsync({ 
        title: title.trim(), 
        content: content.trim() 
      });
      
      // Then share it to the group
      if (newNote?.id) {
        await shareNote.mutateAsync({ 
          noteId: newNote.id, 
          groupId 
        });
      }
      
      // Reset and close
      setTitle("");
      setContent("");
      onOpenChange(false);
    } catch (error) {
      // Errors are handled by the mutation hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleClose}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Create & Share Note</ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note-content">Content</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note content here..."
            rows={8}
            className="resize-none"
          />
        </div>
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create & Share"
          )}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
