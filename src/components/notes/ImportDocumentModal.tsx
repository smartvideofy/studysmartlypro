import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { AlertCircle, File as FileIcon, FileText, Loader2, Upload } from "lucide-react";
import { useCreateNote } from "@/hooks/useNotes";
import { toast } from "sonner";

interface ImportDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string;
}

export function ImportDocumentModal({ open, onOpenChange, folderId }: ImportDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createNote = useCreateNote();

  const acceptedFormats = ".txt,.md,.doc,.docx,.pdf";
  const acceptedMimeTypes = [
    "text/plain",
    "text/markdown",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf"
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFile(droppedFile)) {
        setFile(droppedFile);
      } else {
        toast.error("Invalid file type. Please upload TXT, MD, DOC, DOCX, or PDF files.");
      }
    }
  };

  const isValidFile = (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    const hasAllowedExt = ext ? ['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext) : false;
    return hasAllowedExt || acceptedMimeTypes.includes(file.type);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isValidFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        toast.error("Invalid file type. Please upload TXT, MD, DOC, DOCX, or PDF files.");
      }
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "text/plain" || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return await file.text();
    }

    if (file.type === "application/pdf") {
      toast.info("PDF parsing requires additional setup. Creating note with file reference.");
      return `[Imported from PDF: ${file.name}]\n\nPlease paste the content from your PDF here.`;
    }

    if (file.type.includes("word") || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
      toast.info("Word document parsing requires additional setup. Creating note with file reference.");
      return `[Imported from Word: ${file.name}]\n\nPlease paste the content from your document here.`;
    }

    return await file.text();
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await extractTextFromFile(file);
      const title = file.name.replace(/\.[^/.]+$/, "");

      await createNote.mutateAsync({
        title,
        content,
        folder_id: folderId,
      });

      toast.success("Document imported successfully!");
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import document");
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />;
    if (file.name.endsWith('.pdf')) return <FileText className="w-10 h-10 md:w-12 md:h-12 text-destructive" />;
    if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) return <FileText className="w-10 h-10 md:w-12 md:h-12 text-primary" />;
    return <FileIcon className="w-10 h-10 md:w-12 md:h-12 text-primary" />;
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Import Document</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Upload a document to create a new note from its content.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-4">
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer
            transition-colors duration-200
            ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${file ? "bg-muted/50" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            {getFileIcon()}
            {file ? (
              <div>
                <p className="font-medium text-foreground text-sm md:text-base">{file.name}</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-foreground text-sm md:text-base">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Supports TXT, MD, DOC, DOCX, PDF
                </p>
              </div>
            )}
          </div>
        </div>

        {file && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs md:text-sm">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Text and Markdown files will be imported directly. PDF and Word documents will create a placeholder note.
            </p>
          </div>
        )}
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            onOpenChange(false);
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </>
          )}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
