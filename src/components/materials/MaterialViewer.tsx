import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Image, 
  Music, 
  File,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudyMaterial } from "@/hooks/useStudyMaterials";
import { supabase } from "@/integrations/supabase/client";

interface MaterialViewerProps {
  material: StudyMaterial;
}

export default function MaterialViewer({ material }: MaterialViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Get signed URL for the file
  useEffect(() => {
    if (material.file_path) {
      supabase.storage
        .from("study-materials")
        .createSignedUrl(material.file_path, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) {
            setFileUrl(data.signedUrl);
          }
        });
    }
  }, [material.file_path]);

  const getFileIcon = () => {
    switch (material.file_type) {
      case "pdf":
      case "docx":
        return <FileText className="w-16 h-16" />;
      case "image":
        return <Image className="w-16 h-16" />;
      case "audio":
        return <Music className="w-16 h-16" />;
      default:
        return <File className="w-16 h-16" />;
    }
  };

  const renderContent = () => {
    if (material.file_type === "image" && fileUrl) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={fileUrl}
            alt={material.title}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      );
    }

    if (material.file_type === "audio" && fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
          <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="w-16 h-16 text-primary" />
          </div>
          <h3 className="text-lg font-medium">{material.file_name}</h3>
          <audio controls className="w-full max-w-md">
            <source src={fileUrl} />
            Your browser does not support audio playback.
          </audio>
          
          {/* Transcript placeholder */}
          {material.extracted_content && (
            <div className="w-full max-w-2xl">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Transcript</h4>
              <ScrollArea className="h-48 rounded-lg border border-border p-4">
                <p className="text-sm whitespace-pre-wrap">{material.extracted_content}</p>
              </ScrollArea>
            </div>
          )}
        </div>
      );
    }

    if (material.file_type === "pdf" && fileUrl) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className="w-full h-full border-0"
          title={material.title}
        />
      );
    }

    // Text content fallback
    if (material.extracted_content) {
      return (
        <ScrollArea className="h-full">
          <div className="p-6">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              style={{ fontSize: `${zoom}%` }}
            >
              <pre className="whitespace-pre-wrap font-sans">{material.extracted_content}</pre>
            </div>
          </div>
        </ScrollArea>
      );
    }

    // Placeholder when no content
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        {getFileIcon()}
        <p className="mt-4 text-sm">No preview available</p>
        <p className="text-xs mt-1">{material.file_name}</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-secondary/20">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            disabled={zoom <= 50}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            disabled={zoom >= 200}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {material.file_type === "pdf" && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {currentPage}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {material.file_type?.toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
