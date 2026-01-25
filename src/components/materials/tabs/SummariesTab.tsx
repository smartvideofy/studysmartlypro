import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  RefreshCw, 
  Loader2,
  Sparkles,
  Clock,
  List,
  AlignLeft,
  Maximize2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSummaries } from "@/hooks/useStudyMaterials";
import { useRegenerateContent } from "@/hooks/useRegenerateContent";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface SummariesTabProps {
  materialId: string;
}

// Clean markdown formatting for display
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .trim();
}

export default function SummariesTab({ materialId }: SummariesTabProps) {
  const { data: summaries, isLoading } = useSummaries(materialId);
  const regenerate = useRegenerateContent(materialId);
  const [activeType, setActiveType] = useState<string>("quick");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleRegenerate = () => {
    regenerate.mutate("summaries");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getSummaryByType = (type: string) => {
    return summaries?.find(s => s.summary_type === type);
  };

  const quickSummary = getSummaryByType("quick");
  const detailedSummary = getSummaryByType("detailed");
  const bulletSummary = getSummaryByType("bullet_points");

  const hasAnySummary = quickSummary || detailedSummary || bulletSummary;

  if (!hasAnySummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No summaries yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Generate AI summaries to quickly understand your material.
        </p>
        <Button className="gap-2" onClick={handleRegenerate} disabled={regenerate.isPending}>
          {regenerate.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Generate Summaries
        </Button>
      </div>
    );
  }

  // Parse bullet points into array
  const parseBulletPoints = (content: string): string[] => {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        return line
          .replace(/^\d+[\.\)]\s*/, '')
          .replace(/^[\-\•\*]\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .trim();
      })
      .filter(line => line.length > 0);
  };

  // Parse detailed summary into sections
  const parseDetailedSummary = (content: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '' };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      const isHeading = trimmedLine.match(/^#{1,3}\s+(.+)$/) || 
                        (trimmedLine.length < 50 && trimmedLine.match(/^[A-Z][^.]*:?$/)) ||
                        trimmedLine.match(/^\*\*(.+)\*\*$/);
      
      if (isHeading) {
        if (currentSection.title && currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = { 
          title: trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, ''),
          content: '' 
        };
      } else {
        currentSection.content += (currentSection.content ? '\n' : '') + cleanMarkdown(trimmedLine);
      }
    }
    
    if (currentSection.title && currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    if (sections.length === 0) {
      return [{ title: 'Summary', content: cleanMarkdown(content) }];
    }
    
    return sections;
  };

  const SummaryContent = ({ inDialog = false }: { inDialog?: boolean }) => (
    <ScrollArea className={inDialog ? "h-[80vh]" : "h-full"}>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between mb-6">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Summaries
            </h3>
            <p className="text-sm text-muted-foreground">Different summary depths</p>
          </div>
          <div className="flex gap-2">
            {!inDialog && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 h-9 min-h-[36px] hidden sm:flex"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden md:inline">Fullscreen</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 h-9 min-h-[36px]"
              onClick={handleRegenerate}
              disabled={regenerate.isPending}
            >
              {regenerate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Regenerate</span>
            </Button>
          </div>
        </div>

        {/* Summary Types */}
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="w-full mb-6 h-auto flex-wrap">
            <TabsTrigger value="quick" className="flex-1 gap-1.5 min-w-0 py-2.5" disabled={!quickSummary}>
              <Clock className="w-4 h-4 shrink-0" />
              <span className="truncate text-xs sm:text-sm">Quick</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1 gap-1.5 min-w-0 py-2.5" disabled={!detailedSummary}>
              <AlignLeft className="w-4 h-4 shrink-0" />
              <span className="truncate text-xs sm:text-sm">Detailed</span>
            </TabsTrigger>
            <TabsTrigger value="bullet_points" className="flex-1 gap-1.5 min-w-0 py-2.5" disabled={!bulletSummary}>
              <List className="w-4 h-4 shrink-0" />
              <span className="truncate text-xs sm:text-sm">Points</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            {quickSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-card rounded-lg border border-border p-6">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {cleanMarkdown(quickSummary.content)}
                  </p>
                </div>
              </motion.div>
            ) : (
              <EmptyState type="quick summary" onGenerate={handleRegenerate} isLoading={regenerate.isPending} />
            )}
          </TabsContent>

          <TabsContent value="detailed">
            {detailedSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {parseDetailedSummary(detailedSummary.content).map((section, idx) => (
                  <div key={idx} className="bg-card rounded-lg border border-border p-6">
                    {section.title && (
                      <h4 className="font-semibold text-primary mb-3">{section.title}</h4>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>
                ))}
              </motion.div>
            ) : (
              <EmptyState type="detailed summary" onGenerate={handleRegenerate} isLoading={regenerate.isPending} />
            )}
          </TabsContent>

          <TabsContent value="bullet_points">
            {bulletSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-card rounded-lg border border-border p-6">
                  <ul className="space-y-3">
                    {parseBulletPoints(bulletSummary.content).map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <EmptyState type="bullet points" onGenerate={handleRegenerate} isLoading={regenerate.isPending} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );

  return (
    <>
      <SummaryContent />

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold">Summaries</h2>
              <p className="text-sm text-muted-foreground">Distraction-free reading</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <SummaryContent inDialog />
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({ type, onGenerate, isLoading }: { type: string; onGenerate: () => void; isLoading: boolean }) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground mb-4">No {type} available yet.</p>
      <Button variant="outline" size="sm" className="gap-2" onClick={onGenerate} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Generate {type}
      </Button>
    </div>
  );
}
