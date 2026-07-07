import { useMemo, useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import {
  serializeDeck,
  exportableCount,
  SEP_LABEL,
  type TermSeparator,
  type ExportCard,
} from "@/lib/deckExport";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckName: string;
  cards: ExportCard[];
}

export function ExportDeckModal({ open, onOpenChange, deckName, cards }: Props) {
  const [separator, setSeparator] = useState<TermSeparator>("tab");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => serializeDeck(cards, separator), [cards, separator]);
  const count = exportableCount(cards);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the text and copy manually");
    }
  };

  const handleDownload = () => {
    const ext = separator === "tab" ? "tsv" : "csv";
    const mime = separator === "tab" ? "text/tab-separated-values" : "text/csv";
    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckName.replace(/[^a-z0-9]+/gi, "_") || "deck"}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Export “{deckName}”</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          {count} card{count === 1 ? "" : "s"} — round-trip back into Studily, Quizlet, Anki, or a spreadsheet.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="export-sep">Separator</Label>
          <Select value={separator} onValueChange={(v) => setSeparator(v as TermSeparator)}>
            <SelectTrigger id="export-sep" className="max-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tab">{SEP_LABEL.tab} (best for round-trip)</SelectItem>
              <SelectItem value="comma">{SEP_LABEL.comma} (CSV)</SelectItem>
              <SelectItem value="semicolon">{SEP_LABEL.semicolon}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="export-preview">Preview</Label>
          <Textarea
            id="export-preview"
            readOnly
            value={output}
            className="min-h-[220px] font-mono text-xs"
          />
        </div>
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={handleCopy} disabled={count === 0}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button onClick={handleDownload} disabled={count === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download {separator === "tab" ? ".tsv" : ".csv"}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
