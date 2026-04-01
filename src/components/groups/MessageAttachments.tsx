import { FileText, Image, File, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
  isMe?: boolean;
}

interface AttachmentPreviewProps {
  file: File;
  onRemove: () => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType?: string) {
  if (mimeType?.startsWith("image/")) return Image;
  if (mimeType?.includes("pdf")) return FileText;
  return File;
}

function isImageType(mimeType?: string): boolean {
  return mimeType?.startsWith("image/") || false;
}

export function MessageAttachments({ attachments, isMe }: MessageAttachmentsProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!attachments?.length) return;
    const paths = attachments.map((a) => a.file_path);
    supabase.storage
      .from("group-attachments")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((item) => {
            if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
          });
          setSignedUrls(map);
        }
      });
  }, [attachments]);

  if (!attachments?.length) return null;

  const handleDownload = (attachment: Attachment) => {
    const url = signedUrls[attachment.file_path];
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {attachments.map((attachment) => {
        const isImage = isImageType(attachment.mime_type);
        const FileIcon = getFileIcon(attachment.mime_type);
        const url = signedUrls[attachment.file_path] || "";

        if (isImage && url) {
          return (
            <div key={attachment.id} className="relative group/attachment">
              <img
                src={url}
                alt={`Shared image: ${attachment.file_name}`}
                className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(url, "_blank")}
              />
              <Button
                variant="secondary"
                size="icon-sm"
                className="absolute top-1 right-1 opacity-0 group-hover/attachment:opacity-100 transition-opacity h-6 w-6"
                onClick={() => handleDownload(attachment)}
                aria-label={`Download ${attachment.file_name}`}
              >
                <Download className="w-3 h-3" />
              </Button>
            </div>
          );
        }

        return (
          <div
            key={attachment.id}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity",
              isMe ? "bg-primary-foreground/10" : "bg-background/50"
            )}
            onClick={() => handleDownload(attachment)}
          >
            <FileIcon className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate max-w-[150px]">
                {attachment.file_name}
              </p>
              {attachment.file_size && (
                <p className="text-[10px] opacity-70">
                  {formatFileSize(attachment.file_size)}
                </p>
              )}
            </div>
            <Download className="w-3 h-3 shrink-0 opacity-50" />
          </div>
        );
      })}
    </div>
  );
}

export function AttachmentPreview({ file, onRemove }: AttachmentPreviewProps) {
  const isImage = file.type.startsWith("image/");
  const FileIcon = getFileIcon(file.type);

  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
      {isImage ? (
        <img
          src={URL.createObjectURL(file)}
          alt={`Preview of ${file.name}`}
          className="w-10 h-10 rounded object-cover"
        />
      ) : (
        <FileIcon className="w-5 h-5 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium truncate max-w-[120px]">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="h-5 w-5 absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
