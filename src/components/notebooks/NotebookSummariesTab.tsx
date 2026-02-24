import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Clock, List, AlignLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotebookSummaries } from "@/hooks/useNotebookContent";

interface Props { notebookId: string; }

function cleanMarkdown(text: string): string {
  return text.replace(/\*\*\*(.+?)\*\*\*/g, '$1').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/^#+\s*/gm, '').replace(/^\s*[-*+]\s+/gm, '• ').trim();
}

export default function NotebookSummariesTab({ notebookId }: Props) {
  const { data: summaries, isLoading } = useNotebookSummaries(notebookId);
  const [activeType, setActiveType] = useState<string>("quick");

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const getSummary = (type: string) => summaries?.find(s => s.summary_type === type);
  const quick = getSummary("quick");
  const detailed = getSummary("detailed");
  const bullet = getSummary("bullet_points");

  if (!quick && !detailed && !bullet) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-primary" /></div>
        <h3 className="text-lg font-semibold mb-2">No combined summaries yet</h3>
        <p className="text-muted-foreground max-w-sm">Combined summaries will appear here once notebook processing completes.</p>
      </div>
    );
  }

  const parseBullets = (content: string) => content.split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[\-\•\*]\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim()).filter(l => l.length > 0);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Combined Summaries</h3>
          <p className="text-sm text-muted-foreground">Synthesized across all sources</p>
        </div>
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="w-full mb-6 h-auto flex-wrap">
            <TabsTrigger value="quick" className="flex-1 gap-1.5 py-2.5" disabled={!quick}><Clock className="w-4 h-4 shrink-0" /><span className="text-xs sm:text-sm">Quick</span></TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1 gap-1.5 py-2.5" disabled={!detailed}><AlignLeft className="w-4 h-4 shrink-0" /><span className="text-xs sm:text-sm">Detailed</span></TabsTrigger>
            <TabsTrigger value="bullet_points" className="flex-1 gap-1.5 py-2.5" disabled={!bullet}><List className="w-4 h-4 shrink-0" /><span className="text-xs sm:text-sm">Points</span></TabsTrigger>
          </TabsList>
          <TabsContent value="quick">
            {quick && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><div className="bg-card rounded-lg border border-border p-6"><p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanMarkdown(quick.content)}</p></div></motion.div>}
          </TabsContent>
          <TabsContent value="detailed">
            {detailed && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><div className="bg-card rounded-lg border border-border p-6"><p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanMarkdown(detailed.content)}</p></div></motion.div>}
          </TabsContent>
          <TabsContent value="bullet_points">
            {bullet && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-card rounded-lg border border-border p-6">
                  <ul className="space-y-3">
                    {parseBullets(bullet.content).map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-sm leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
