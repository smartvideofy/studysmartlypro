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

// Parse AI response text to find [1], [2], etc. citation markers
export function parseCitationMarkers(text: string): { parts: (string | number)[]; citationIds: number[] } {
  const citationRegex = /\[(\d+)\]/g;
  const parts: (string | number)[] = [];
  const citationIds: number[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    const id = parseInt(match[1], 10);
    parts.push(id); // number indicates a citation reference
    if (!citationIds.includes(id)) {
      citationIds.push(id);
    }
    
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return { parts, citationIds };
}

// Render text with inline citation chips
export function renderWithCitations(
  text: string,
  chunks: Citation[],
  onCitationClick: (citation: Citation) => void
): React.ReactNode {
  const { parts } = parseCitationMarkers(text);

  if (parts.length <= 1 && typeof parts[0] === 'string') {
    return text;
  }

  return parts.map((part, index) => {
    if (typeof part === 'string') {
      return <span key={index}>{part}</span>;
    }
    // part is a number (citation id)
    const chunk = chunks.find(c => c.id === part);
    if (chunk) {
      return (
        <CitationChip
          key={`citation-${index}-${part}`}
          citation={chunk}
          onClick={onCitationClick}
        />
      );
    }
    // If chunk not found, render as plain text
    return <span key={index}>[{part}]</span>;
  });
}
