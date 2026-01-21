import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  File,
  Loader2,
  CheckCircle2,
  BookOpen,
  List,
  Lightbulb,
  Brain
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { 
  useTutorNotes, 
  useSummaries, 
  usePracticeQuestions,
  useMaterialFlashcards,
  TutorNotes,
  Summary,
  PracticeQuestion,
  MaterialFlashcard
} from "@/hooks/useStudyMaterials";
import { supabase } from "@/integrations/supabase/client";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialTitle: string;
  filePath?: string | null;
}

type ExportFormat = "markdown" | "txt" | "csv";
type ExportContent = "tutor_notes" | "summaries" | "flashcards" | "questions";

export default function ExportModal({ 
  open, 
  onOpenChange, 
  materialId, 
  materialTitle,
  filePath 
}: ExportModalProps) {
  const [selectedContent, setSelectedContent] = useState<Set<ExportContent>>(new Set());
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);

  const { data: tutorNotes } = useTutorNotes(materialId);
  const { data: summaries } = useSummaries(materialId);
  const { data: flashcards } = useMaterialFlashcards(materialId);
  const { data: questions } = usePracticeQuestions(materialId);

  const toggleContent = (content: ExportContent) => {
    const newSelected = new Set(selectedContent);
    if (newSelected.has(content)) {
      newSelected.delete(content);
    } else {
      newSelected.add(content);
    }
    setSelectedContent(newSelected);
  };

  const formatTutorNotes = (notes: TutorNotes[], format: ExportFormat): string => {
    if (!notes.length || !notes[0].content?.topics) return "";
    
    const content = notes[0].content;
    let output = "";
    
    if (format === "markdown") {
      output = `# Tutor Notes\n\n`;
      content.topics.forEach((topic) => {
        output += `## ${topic.title}\n\n`;
        topic.subtopics.forEach((subtopic) => {
          output += `### ${subtopic.title}\n\n${subtopic.content}\n\n`;
          if (subtopic.definitions?.length) {
            output += `**Key Terms:**\n`;
            subtopic.definitions.forEach((def) => {
              output += `- **${def.term}**: ${def.definition}\n`;
            });
            output += `\n`;
          }
          if (subtopic.examples?.length) {
            output += `**Examples:**\n`;
            subtopic.examples.forEach((ex) => {
              output += `- ${ex}\n`;
            });
            output += `\n`;
          }
          if (subtopic.exam_tips?.length) {
            output += `**Exam Tips:**\n`;
            subtopic.exam_tips.forEach((tip) => {
              output += `- ${tip}\n`;
            });
            output += `\n`;
          }
        });
      });
    } else {
      output = `TUTOR NOTES\n${"=".repeat(50)}\n\n`;
      content.topics.forEach((topic) => {
        output += `${topic.title.toUpperCase()}\n${"-".repeat(topic.title.length)}\n\n`;
        topic.subtopics.forEach((subtopic) => {
          output += `${subtopic.title}\n${subtopic.content}\n\n`;
        });
      });
    }
    
    return output;
  };

  const formatSummaries = (summaries: Summary[], format: ExportFormat): string => {
    if (!summaries.length) return "";
    
    let output = format === "markdown" ? "# Summaries\n\n" : "SUMMARIES\n" + "=".repeat(50) + "\n\n";
    
    summaries.forEach((summary) => {
      const typeLabel = summary.summary_type.replace("_", " ").toUpperCase();
      if (format === "markdown") {
        output += `## ${typeLabel}\n\n${summary.content}\n\n---\n\n`;
      } else {
        output += `${typeLabel}\n${"-".repeat(typeLabel.length)}\n${summary.content}\n\n`;
      }
    });
    
    return output;
  };

  const formatQuestions = (questions: PracticeQuestion[], format: ExportFormat): string => {
    if (!questions.length) return "";
    
    let output = "";
    
    if (format === "csv") {
      output = "Question,Type,Options,Correct Answer,Explanation\n";
      questions.forEach((q) => {
        const options = q.options ? q.options.join("; ") : "";
        output += `"${q.question}","${q.question_type}","${options}","${q.correct_answer || ""}","${q.explanation || ""}"\n`;
      });
    } else if (format === "markdown") {
      output = "# Practice Questions\n\n";
      questions.forEach((q, i) => {
        output += `## Question ${i + 1} (${q.question_type.toUpperCase()})\n\n`;
        output += `**${q.question}**\n\n`;
        if (q.options?.length) {
          q.options.forEach((opt, j) => {
            const letter = String.fromCharCode(65 + j);
            output += `${letter}. ${opt}\n`;
          });
          output += `\n`;
        }
        output += `**Answer:** ${q.correct_answer || "N/A"}\n\n`;
        if (q.explanation) {
          output += `**Explanation:** ${q.explanation}\n\n`;
        }
        output += `---\n\n`;
      });
    } else {
      output = "PRACTICE QUESTIONS\n" + "=".repeat(50) + "\n\n";
      questions.forEach((q, i) => {
        output += `Question ${i + 1} (${q.question_type})\n`;
        output += `${q.question}\n\n`;
        if (q.options?.length) {
          q.options.forEach((opt, j) => {
            output += `  ${String.fromCharCode(65 + j)}. ${opt}\n`;
          });
        }
        output += `\nAnswer: ${q.correct_answer || "N/A"}\n\n`;
      });
    }
    
    return output;
  };

  const formatFlashcards = (cards: MaterialFlashcard[], format: ExportFormat): string => {
    if (!cards.length) return "";
    
    let output = "";
    
    if (format === "csv") {
      output = "Front,Back,Hint,Difficulty\n";
      cards.forEach((c) => {
        output += `"${c.front}","${c.back}","${c.hint || ""}","${c.difficulty}"\n`;
      });
    } else if (format === "markdown") {
      output = "# Flashcards\n\n";
      cards.forEach((c, i) => {
        output += `## Card ${i + 1}\n\n`;
        output += `**Front:** ${c.front}\n\n`;
        output += `**Back:** ${c.back}\n\n`;
        if (c.hint) {
          output += `*Hint: ${c.hint}*\n\n`;
        }
        output += `---\n\n`;
      });
    } else {
      output = "FLASHCARDS\n" + "=".repeat(50) + "\n\n";
      cards.forEach((c, i) => {
        output += `Card ${i + 1}\n`;
        output += `Front: ${c.front}\n`;
        output += `Back: ${c.back}\n`;
        if (c.hint) {
          output += `Hint: ${c.hint}\n`;
        }
        output += `\n`;
      });
    }
    
    return output;
  };

  const handleExport = async () => {
    if (selectedContent.size === 0) {
      toast.error("Please select content to export");
      return;
    }

    setIsExporting(true);
    
    try {
      let content = "";
      const fileExt = format === "csv" ? "csv" : format === "markdown" ? "md" : "txt";
      
      if (selectedContent.has("tutor_notes") && tutorNotes) {
        content += formatTutorNotes(tutorNotes, format);
      }
      
      if (selectedContent.has("summaries") && summaries) {
        content += formatSummaries(summaries, format);
      }
      
      if (selectedContent.has("flashcards") && flashcards) {
        content += formatFlashcards(flashcards, format);
      }
      
      if (selectedContent.has("questions") && questions) {
        content += formatQuestions(questions, format);
      }

      // Create and download file
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${materialTitle.replace(/\s+/g, "_")}_export.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Export completed!");
      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export content");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSource = async () => {
    if (!filePath) {
      toast.error("No source file available");
      return;
    }

    setIsDownloadingSource(true);
    
    try {
      const { data, error } = await supabase.storage
        .from("study-materials")
        .download(filePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filePath.split("/").pop() || "source_file";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Source file downloaded!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download source file");
    } finally {
      setIsDownloadingSource(false);
    }
  };

  const contentOptions: { id: ExportContent; label: string; icon: React.ReactNode; available: boolean }[] = [
    { id: "tutor_notes", label: "Tutor Notes", icon: <BookOpen className="w-4 h-4" />, available: !!tutorNotes?.length },
    { id: "summaries", label: "Summaries", icon: <FileText className="w-4 h-4" />, available: !!summaries?.length },
    { id: "flashcards", label: "Flashcards", icon: <Lightbulb className="w-4 h-4" />, available: !!flashcards?.length },
    { id: "questions", label: "Practice Questions", icon: <Brain className="w-4 h-4" />, available: !!questions?.length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Content
          </DialogTitle>
          <DialogDescription>
            Export AI-generated content or download the source file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Source File */}
          {filePath && (
            <div className="p-4 rounded-lg border border-border bg-secondary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <File className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Source File</p>
                    <p className="text-xs text-muted-foreground">Download original uploaded file</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadSource}
                  disabled={isDownloadingSource}
                  className="gap-2"
                >
                  {isDownloadingSource ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Content Selection */}
          <div className="space-y-3">
            <Label>Select Content to Export</Label>
            <div className="space-y-2">
              {contentOptions.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: option.available ? 1.01 : 1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    selectedContent.has(option.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  } ${!option.available ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => option.available && toggleContent(option.id)}
                >
                  <Checkbox 
                    checked={selectedContent.has(option.id)} 
                    disabled={!option.available}
                    onCheckedChange={() => option.available && toggleContent(option.id)}
                  />
                  <span className="text-muted-foreground">{option.icon}</span>
                  <span className="flex-1 text-sm font-medium">{option.label}</span>
                  {!option.available && (
                    <span className="text-xs text-muted-foreground">Not available</span>
                  )}
                  {option.available && selectedContent.has(option.id) && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="markdown" id="markdown" />
                  <Label htmlFor="markdown" className="cursor-pointer">Markdown (.md)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="txt" id="txt" />
                  <Label htmlFor="txt" className="cursor-pointer">Plain Text (.txt)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer">CSV (questions)</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Export Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || selectedContent.size === 0}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
