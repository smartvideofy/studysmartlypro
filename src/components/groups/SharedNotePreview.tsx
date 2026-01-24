import { formatDistanceToNow } from "date-fns";
import { FileText, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
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
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-[600px]">
      <ResponsiveModalHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <ResponsiveModalTitle className="truncate">
              {sharedNote.notes?.title || "Untitled Note"}
            </ResponsiveModalTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shared {formatDistanceToNow(new Date(sharedNote.shared_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </ResponsiveModalHeader>

      <ResponsiveModalBody>
        <ScrollArea className="h-[300px] border border-border rounded-lg p-4 bg-secondary/30">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {sharedNote.notes?.content ? (
              <div className="whitespace-pre-wrap">{sharedNote.notes.content}</div>
            ) : (
              <p className="text-muted-foreground italic">No content</p>
            )}
          </div>
        </ScrollArea>
      </ResponsiveModalBody>

      <ResponsiveModalFooter className="pt-4">
        <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none">
          <Link to={`/materials/${sharedNote.note_id}`}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Note
          </Link>
        </Button>

        {canUnshare && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive flex-1 md:flex-none">
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
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
