import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AISummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string | null;
  isLoading: boolean;
  noteTitle: string;
}

export function AISummaryModal({
  open,
  onOpenChange,
  summary,
  isLoading,
  noteTitle,
}: AISummaryModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Summary copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Summary
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Summary for: <span className="font-medium text-foreground">{noteTitle}</span>
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating summary...</p>
          </div>
        ) : summary ? (
          <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
            {summary}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No summary available
          </p>
        )}
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!summary || isLoading}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
