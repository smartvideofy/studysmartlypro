import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  RefreshCw, 
  Save,
  Loader2,
  Sparkles,
  Clock,
  List,
  AlignLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSummaries, Summary } from "@/hooks/useStudyMaterials";

interface SummariesTabProps {
  materialId: string;
}

export default function SummariesTab({ materialId }: SummariesTabProps) {
  const { data: summaries, isLoading } = useSummaries(materialId);
  const [activeType, setActiveType] = useState<string>("quick");

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
        <Button className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Summaries
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Summaries</h3>
            <p className="text-sm text-muted-foreground">Different summary depths</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Summary Types */}
        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="quick" className="flex-1 gap-2">
              <Clock className="w-4 h-4" />
              Quick (2 min)
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1 gap-2">
              <AlignLeft className="w-4 h-4" />
              Detailed
            </TabsTrigger>
            <TabsTrigger value="bullet_points" className="flex-1 gap-2">
              <List className="w-4 h-4" />
              Key Points
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            {quickSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                <div className="bg-card rounded-lg border border-border p-6">
                  <p className="whitespace-pre-wrap">{quickSummary.content}</p>
                </div>
              </motion.div>
            ) : (
              <EmptyState type="quick summary" />
            )}
          </TabsContent>

          <TabsContent value="detailed">
            {detailedSummary ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                <div className="bg-card rounded-lg border border-border p-6">
                  <p className="whitespace-pre-wrap">{detailedSummary.content}</p>
                </div>
              </motion.div>
            ) : (
              <EmptyState type="detailed summary" />
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
                    {bulletSummary.content.split('\n').filter(Boolean).map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm">{point.replace(/^[\-\•\*]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <EmptyState type="bullet points" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground mb-4">No {type} available yet.</p>
      <Button variant="outline" size="sm" className="gap-2">
        <Sparkles className="w-4 h-4" />
        Generate {type}
      </Button>
    </div>
  );
}
