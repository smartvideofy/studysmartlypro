import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Paperclip, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File as FileIcon, 
  Trash2, 
  Download,
  Loader2
} from "lucide-react";
import { 
  useNoteAttachments, 
  useUploadNoteAttachment, 
  useDeleteNoteAttachment,
  NoteAttachment
} from "@/hooks/useNoteAttachments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface NoteAttachmentsProps {
  noteId: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null, fileName: string) {
  if (mimeType?.startsWith("image/")) {
    return <ImageIcon className="w-4 h-4 text-success" />;
  }
  if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
    return <FileText className="w-4 h-4 text-destructive" />;
  }
  if (mimeType?.includes("word") || fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
    return <FileText className="w-4 h-4 text-primary" />;
  }
  return <FileIcon className="w-4 h-4 text-muted-foreground" />;
}

export function NoteAttachments({ noteId }: NoteAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<NoteAttachment | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: attachments, isLoading } = useNoteAttachments(noteId);
  const uploadAttachment = useUploadNoteAttachment();
  const deleteAttachment = useDeleteNoteAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload files one by one
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large (max 10MB)`);
        continue;
      }
      await uploadAttachment.mutateAsync({ noteId, file });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (attachment: NoteAttachment) => {
    setDownloadingId(attachment.id);
    try {
      const { data, error } = await supabase.storage
        .from(attachment.bucket_id)
        .createSignedUrl(attachment.object_path, 60);

      if (error) throw error;

      // Open in new tab or trigger download
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = attachment.file_name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAttachment.mutateAsync(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <Card variant="elevated" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Attachments</span>
          {attachments && attachments.length > 0 && (
            <span className="text-xs text-muted-foreground">({attachments.length})</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          {uploadAttachment.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="hidden sm:inline ml-1">Upload</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              {getFileIcon(attachment.mime_type, attachment.file_name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size_bytes)} • {formatDistanceToNow(new Date(attachment.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDownload(attachment)}
                  disabled={downloadingId === attachment.id}
                >
                  {downloadingId === attachment.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(attachment)}
                  disabled={deleteAttachment.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No attachments yet. Upload PDFs, images, or documents.
        </p>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
