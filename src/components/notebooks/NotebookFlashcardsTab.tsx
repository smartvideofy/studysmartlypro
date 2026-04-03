import { useState } from "react";
import { Lightbulb, Loader2, Play, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotebookFlashcards } from "@/hooks/useNotebookContent";
import { FlashcardStudyDrawer } from "@/components/materials/tabs/FlashcardStudyDrawer";
import { cn } from "@/lib/utils";

interface Props { notebookId: string; }

export default function NotebookFlashcardsTab({ notebookId }: Props) {
  const { data: flashcards, isLoading } = useNotebookFlashcards(notebookId);
  const [showStudyDrawer, setShowStudyDrawer] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!flashcards?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Lightbulb className="w-8 h-8 text-primary" /></div>
        <h3 className="text-lg font-semibold mb-2">No combined flashcards yet</h3>
        <p className="text-muted-foreground max-w-sm">Combined flashcards will appear here once notebook processing completes.</p>
      </div>
    );
  }

  const easyCount = flashcards.filter(c => c.difficulty === 'easy').length;
  const mediumCount = flashcards.filter(c => c.difficulty === 'medium').length;
  const hardCount = flashcards.filter(c => c.difficulty === 'hard').length;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-primary" />Combined Flashcards</h3>
            <p className="text-sm text-muted-foreground">{flashcards.length} cards from all sources</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
          {easyCount > 0 && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs sm:text-sm text-muted-foreground">{easyCount} Easy</span></div>}
          {mediumCount > 0 && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-xs sm:text-sm text-muted-foreground">{mediumCount} Medium</span></div>}
          {hardCount > 0 && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs sm:text-sm text-muted-foreground">{hardCount} Hard</span></div>}
        </div>
        <Button variant="hero" size="lg" className="w-full gap-3 h-14 text-base" onClick={() => setShowStudyDrawer(true)}>
          <Play className="w-5 h-5" />Start Studying
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Card Preview</p>
          {flashcards.map((card, index) => (
            <div key={card.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50">
              <div className="w-5 h-5 rounded-full bg-secondary text-muted-foreground flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs">{index + 1}</span></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{card.front}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{card.back}</p>
              </div>
              {card.difficulty && (
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0",
                  card.difficulty === 'easy' && 'bg-green-500/10 text-green-600 dark:text-green-400',
                  card.difficulty === 'hard' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                  card.difficulty === 'medium' && 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                )}>{card.difficulty}</span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <FlashcardStudyDrawer open={showStudyDrawer} onOpenChange={setShowStudyDrawer} flashcards={flashcards} initialIndex={0} />
    </div>
  );
}
