import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Citation {
  id: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

interface CitationChipProps {
  citation: Citation;
  onClick: (citation: Citation) => void;
}

export function CitationChip({ citation, onClick }: CitationChipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.span
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs cursor-pointer 
                       hover:bg-primary/10 hover:border-primary/50 transition-colors
                       align-baseline mx-0.5"
            onClick={() => onClick(citation)}
          >
            <FileText className="w-3 h-3" />
            [{citation.id}]
          </Badge>
        </motion.span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs line-clamp-3">{citation.text}</p>
        <p className="text-xs text-muted-foreground mt-1">Click to view source</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Parse AI response for citations and return structured data
export function parseCitations(
  text: string,
  extractedContent: string | null
): { content: React.ReactNode; citations: Citation[] } {
  if (!extractedContent) {
    return { content: text, citations: [] };
  }

  // Match citation patterns like [source: page X], [ref: paragraph Y], [citation: X]
  const citationRegex = /\[(?:source|ref|citation|see)?:?\s*(?:page\s*)?(\d+)(?:\s*,\s*(?:paragraph|para|p)?\s*(\d+))?\]/gi;
  
  const citations: Citation[] = [];
  let lastIndex = 0;
  const parts: React.ReactNode[] = [];
  let citationId = 1;

  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Calculate approximate position in source content
    const pageNum = parseInt(match[1], 10);
    const charPerPage = Math.floor(extractedContent.length / Math.max(pageNum, 1));
    const startIndex = Math.min((pageNum - 1) * charPerPage, extractedContent.length - 200);
    const endIndex = Math.min(startIndex + 200, extractedContent.length);
    
    const citationText = extractedContent.slice(startIndex, endIndex).trim();

    const citation: Citation = {
      id: citationId,
      text: citationText,
      startIndex,
      endIndex,
    };
    citations.push(citation);

    // Add citation component placeholder
    parts.push(`__CITATION_${citationId}__`);
    citationId++;
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (citations.length === 0) {
    return { content: text, citations: [] };
  }

  return {
    content: parts.join(""),
    citations,
  };
}

// Render text with citation chips
export function renderWithCitations(
  text: string,
  citations: Citation[],
  onCitationClick: (citation: Citation) => void
): React.ReactNode {
  if (citations.length === 0) {
    return text;
  }

  const parts = text.split(/__CITATION_(\d+)__/);
  
  return parts.map((part, index) => {
    // Even indices are text, odd indices are citation IDs
    if (index % 2 === 0) {
      return part;
    }
    const citationId = parseInt(part, 10);
    const citation = citations.find(c => c.id === citationId);
    if (citation) {
      return (
        <CitationChip
          key={`citation-${citationId}`}
          citation={citation}
          onClick={onCitationClick}
        />
      );
    }
    return null;
  });
}
