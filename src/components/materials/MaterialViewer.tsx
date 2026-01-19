import { useState, useEffect } from "react";
import { 
  FileText, 
  Image, 
  Music, 
  File,
  ZoomIn,
  ZoomOut,
  Download,
  Search,
  Maximize2,
  ChevronUp,
  ChevronDown,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudyMaterial } from "@/hooks/useStudyMaterials";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface MaterialViewerProps {
  material: StudyMaterial;
}

export default function MaterialViewer({ material }: MaterialViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Search in extracted content
  useEffect(() => {
    if (searchQuery && material.extracted_content) {
      const content = material.extracted_content.toLowerCase();
      const query = searchQuery.toLowerCase();
      const indices: number[] = [];
      let idx = content.indexOf(query);
      while (idx !== -1) {
        indices.push(idx);
        idx = content.indexOf(query, idx + 1);
      }
      setSearchResults(indices);
      setCurrentSearchIndex(0);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, material.extracted_content]);

  const handleDownload = async () => {
    if (!material.file_path) {
      toast.error("No file available");
      return;
    }

    setIsDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("study-materials")
        .download(material.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = material.file_name || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("File downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const navigateSearch = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return;
    if (direction === "next") {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
    } else {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };

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

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  const renderContent = () => {
    if (material.file_type === "image" && fileUrl) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={fileUrl}
            alt={material.title}
            className="max-w-full max-h-full object-contain rounded-lg transition-transform"
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
          
          {/* Transcript */}
          {material.extracted_content && (
            <div className="w-full max-w-2xl">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Transcript</h4>
              <ScrollArea className="h-48 rounded-lg border border-border p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {showSearch && searchQuery 
                    ? highlightText(material.extracted_content, searchQuery)
                    : material.extracted_content}
                </p>
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
              <pre className="whitespace-pre-wrap font-sans">
                {showSearch && searchQuery 
                  ? highlightText(material.extracted_content, searchQuery)
                  : material.extracted_content}
              </pre>
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

  const ViewerToolbar = () => (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
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

        <div className="w-px h-6 bg-border mx-2" />

        {/* Search Toggle */}
        <Button
          variant={showSearch ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setShowSearch(!showSearch);
            if (!showSearch) setSearchQuery("");
          }}
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* Download */}
        {material.file_path && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsFullscreen(true)}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {material.file_type?.toUpperCase()}
      </div>
    </div>
  );

  const SearchBar = () => (
    showSearch && (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/50">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in document..."
          className="h-8 flex-1"
          autoFocus
        />
        {searchResults.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentSearchIndex + 1} of {searchResults.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => navigateSearch("prev")}
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => navigateSearch("next")}
            >
              <ChevronDown className="w-3 h-3" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            setShowSearch(false);
            setSearchQuery("");
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    )
  );

  return (
    <>
      <div className="h-full flex flex-col bg-secondary/20">
        <ViewerToolbar />
        <SearchBar />
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="font-medium">{material.title}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullscreen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-secondary/20">
              {renderContent()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
