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

// Clean markdown formatting for display
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove bold-italic
    .replace(/\*\*(.+?)\*\*/g, '$1')     // Remove bold
    .replace(/\*(.+?)\*/g, '$1')         // Remove italic
    .replace(/^#+\s*/gm, '')             // Remove heading markers
    .replace(/^\s*[-*+]\s+/gm, '• ')     // Normalize bullet points
    .trim();
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

  // Parse bullet points into array
  const parseBulletPoints = (content: string): string[] => {
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Remove numbering, bullets, and asterisks
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
      
      // Check if it's a heading (starts with # or is all caps or ends with colon)
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
    
    // If no sections found, return as single section
    if (sections.length === 0) {
      return [{ title: 'Summary', content: cleanMarkdown(content) }];
    }
    
    return sections;
  };

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
            <TabsTrigger value="quick" className="flex-1 gap-2" disabled={!quickSummary}>
              <Clock className="w-4 h-4" />
              Quick (2 min)
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1 gap-2" disabled={!detailedSummary}>
              <AlignLeft className="w-4 h-4" />
              Detailed
            </TabsTrigger>
            <TabsTrigger value="bullet_points" className="flex-1 gap-2" disabled={!bulletSummary}>
              <List className="w-4 h-4" />
              Key Points
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
              <EmptyState type="quick summary" />
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
