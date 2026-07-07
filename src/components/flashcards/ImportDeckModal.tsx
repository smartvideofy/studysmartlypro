import { useMemo, useState } from "react";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  parseDeckImport,
  detectSeparator,
  MAX_IMPORT_CARDS,
  type TermSeparator,
} from "@/lib/deckImport";
import { useCreateDeck, useCreateFlashcard } from "@/hooks/useFlashcards";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, cards are added to the existing deck instead of creating one. */
  targetDeckId?: string;
  targetDeckName?: string;
  onImported?: (deckId: string) => void;
}

export function ImportDeckModal({
  open,
  onOpenChange,
  targetDeckId,
  targetDeckName,
  onImported,
}: Props) {
  const [name, setName] = useState("");
  const [raw, setRaw] = useState("");
  const [separator, setSeparator] = useState<TermSeparator | "auto">("auto");
  const [busy, setBusy] = useState(false);

  const createDeck = useCreateDeck();
  const createCard = useCreateFlashcard();

  const parsed = useMemo(() => parseDeckImport(raw, separator), [raw, separator]);
  const capped = parsed.cards.slice(0, MAX_IMPORT_CARDS);
  const detected = detectSeparator(raw);

  const reset = () => {
    setName("");
    setRaw("");
    setSeparator("auto");
  };

  const handleImport = async () => {
    if (capped.length === 0) {
      toast.error("No cards detected — check your separator");
      return;
    }
    const deckName = targetDeckName ?? name.trim();
    if (!targetDeckId && !deckName) {
      toast.error("Give the new deck a name");
      return;
    }
    setBusy(true);
    try {
      let deckId = targetDeckId;
      if (!deckId) {
        const deck = await createDeck.mutateAsync({ name: deckName });
        deckId = deck.id;
      }
      for (const c of capped) {
        await createCard.mutateAsync({ deck_id: deckId!, front: c.front, back: c.back });
      }
      toast.success(`Imported ${capped.length} card${capped.length === 1 ? "" : "s"}`);
      onImported?.(deckId!);
      reset();
      onOpenChange(false);
    } catch (e) {
      // toast handled by mutation
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>
          {targetDeckId ? `Add cards to “${targetDeckName}”` : "Import a deck"}
        </ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Paste from Quizlet, Anki (Notes in Plain Text), or a CSV/spreadsheet.
          One card per line, term and definition separated by tab, comma, or semicolon.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-4">
        {!targetDeckId && (
          <div className="space-y-2">
            <Label htmlFor="deck-name">Deck name</Label>
            <Input
              id="deck-name"
              placeholder="e.g. Biology chapter 4"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="deck-paste">Cards</Label>
          <Textarea
            id="deck-paste"
            placeholder={"mitochondria\tpowerhouse of the cell\nribosome\tprotein synthesis"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="min-h-[180px] font-mono text-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="sep">Separator</Label>
            <Select value={separator} onValueChange={(v) => setSeparator(v as TermSeparator | "auto")}>
              <SelectTrigger id="sep">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect ({detected})</SelectItem>
                <SelectItem value="tab">Tab</SelectItem>
                <SelectItem value="comma">Comma</SelectItem>
                <SelectItem value="semicolon">Semicolon</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground pb-2">
            <span className="font-medium text-foreground">{capped.length}</span> card{capped.length === 1 ? "" : "s"}
            {parsed.skipped > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-2">
                · {parsed.skipped} skipped
              </span>
            )}
            {parsed.cards.length > MAX_IMPORT_CARDS && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-3 h-3" /> capped at {MAX_IMPORT_CARDS}
              </span>
            )}
          </div>
        </div>

        {capped.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs">
            {capped.slice(0, 6).map((c, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-medium truncate">{c.front}</span>
                <span className="text-muted-foreground">→</span>
                <span className="truncate text-muted-foreground">{c.back}</span>
              </div>
            ))}
            {capped.length > 6 && (
              <p className="text-muted-foreground pt-1">+{capped.length - 6} more…</p>
            )}
          </div>
        )}
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={busy || capped.length === 0}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Import {capped.length > 0 ? `${capped.length} cards` : ""}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
