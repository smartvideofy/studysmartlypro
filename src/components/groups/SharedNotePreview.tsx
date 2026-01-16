import { formatDistanceToNow } from "date-fns";
import { FileText, X, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SharedNote, useUnshareNote } from "@/hooks/useSharedNotes";
import { useAuth } from "@/hooks/useAuth";

interface SharedNotePreviewProps {
  sharedNote: SharedNote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

export function SharedNotePreview({ 
  sharedNote, 
  open, 
  onOpenChange,
  groupId 
}: SharedNotePreviewProps) {
  const { user } = useAuth();
  const unshareNote = useUnshareNote();

  const canUnshare = sharedNote?.shared_by === user?.id;

  const handleUnshare = async () => {
    if (!sharedNote) return;
    await unshareNote.mutateAsync({
      noteId: sharedNote.note_id,
      groupId,
    });
    onOpenChange(false);
  };

  if (!sharedNote) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileText className="w-5 h-5 text-primary" />
            <span className="truncate">{sharedNote.notes?.title || "Untitled Note"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground mb-2">
          Shared {formatDistanceToNow(new Date(sharedNote.shared_at), { addSuffix: true })}
        </div>

        <ScrollArea className="h-[300px] border border-border rounded-lg p-4 bg-secondary/30">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {sharedNote.notes?.content ? (
              <div className="whitespace-pre-wrap">{sharedNote.notes.content}</div>
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/notes/${sharedNote.note_id}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Note
            </Link>
          </Button>

          {canUnshare && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Unshare
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unshare Note?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove "{sharedNote.notes?.title}" from the group. 
                    Other members will no longer be able to view it here.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleUnshare}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={unshareNote.isPending}
                  >
                    {unshareNote.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Unshare Note"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}