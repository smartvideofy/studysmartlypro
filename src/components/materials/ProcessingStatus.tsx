import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FileText, 
  Brain, 
  Lightbulb, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Ban,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudyMaterial, useUpdateStudyMaterial } from "@/hooks/useStudyMaterials";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { runProcessingPipeline } from "@/lib/processMaterialPipeline";
import { toast } from "sonner";

interface ProcessingStatusProps {
  material: StudyMaterial;
}

const processingSteps = [
  { id: "extracting", label: "Extracting content", icon: FileText },
  { id: "tutor_notes", label: "Generating tutor notes", icon: Brain },
  { id: "summaries", label: "Generating summaries", icon: Brain },
  { id: "flashcards", label: "Generating flashcards", icon: Lightbulb },
  { id: "questions", label: "Generating questions", icon: Lightbulb },
  { id: "finalizing", label: "Finalizing", icon: CheckCircle2 },
];

export default function ProcessingStatus({ material }: ProcessingStatusProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateMaterial = useUpdateStudyMaterial();
  const [isRetrying, setIsRetrying] = useState(false);

  // Query related content tables to determine real progress
  const { data: progressData } = useQuery({
    queryKey: ['material-progress', material.id],
    queryFn: async () => {
      const [tutorNotes, summaries, flashcards, questions, conceptMaps] = await Promise.all([
        supabase.from('tutor_notes').select('id', { count: 'exact', head: true }).eq('material_id', material.id),
        supabase.from('summaries').select('id', { count: 'exact', head: true }).eq('material_id', material.id),
        supabase.from('material_flashcards').select('id', { count: 'exact', head: true }).eq('material_id', material.id),
        supabase.from('practice_questions').select('id', { count: 'exact', head: true }).eq('material_id', material.id),
        supabase.from('concept_maps').select('id', { count: 'exact', head: true }).eq('material_id', material.id),
      ]);
      return {
        hasExtracted: !!material.extracted_content,
        hasTutorNotes: (tutorNotes.count ?? 0) > 0,
        hasSummaries: (summaries.count ?? 0) > 0,
        hasFlashcards: (flashcards.count ?? 0) > 0,
        hasQuestions: (questions.count ?? 0) > 0,
        hasConceptMap: (conceptMaps.count ?? 0) > 0,
      };
    },
    enabled: material.processing_status === 'processing' || material.processing_status === 'pending',
    refetchInterval: 3000,
  });

  // Calculate current step based on content queries
  const getProgress = () => {
    if (material.processing_status === "completed") {
      return { step: processingSteps.length, progress: 100 };
    }
    if (material.processing_status === "failed") {
      return { step: -1, progress: 0 };
    }
    if (!progressData) {
      return { step: 0, progress: material.processing_status === "pending" ? 5 : 10 };
    }

    let completedSteps = 0;
    if (progressData.hasExtracted) completedSteps++;
    if (progressData.hasTutorNotes) completedSteps++;
    if (progressData.hasSummaries) completedSteps++;
    if (progressData.hasFlashcards) completedSteps++;
    if (progressData.hasQuestions) completedSteps++;
    if (progressData.hasConceptMap) completedSteps++;

    const progress = Math.min(Math.round((completedSteps / 6) * 90) + 10, 95);
    return { step: completedSteps, progress };
  };

  const { step: currentStep, progress } = getProgress();

  const isRetryableError = (error?: string | null): boolean => {
    if (!error) return false;
    const retryablePatterns = [
      'quota', 'rate limit', 'credit', '429', '402', '503',
      'temporarily', 'try again', 'overloaded', 'capacity',
      'timeout', 'timed out', 'WORKER_LIMIT',
    ];
    return retryablePatterns.some(p => error.toLowerCase().includes(p.toLowerCase()));
  };

  const retryable = material.processing_status === 'failed' && isRetryableError(material.processing_error);
  const permanent = material.processing_status === 'failed' && !retryable;

  // Poll for updates
  useEffect(() => {
    if (material.processing_status === "completed") {
      return;
    }

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["study-material", material.id] });
    }, 3000);

    return () => clearInterval(interval);
  }, [material.processing_status, material.id, queryClient]);

  // Auto-redirect when completed
  useEffect(() => {
    if (material.processing_status === "completed") {
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["study-material", material.id] });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [material.processing_status, material.id, queryClient]);

  const handleRetry = () => {
    setIsRetrying(true);
    
    updateMaterial.mutateAsync({
      id: material.id,
      processing_status: "pending",
      processing_error: null,
    }).then(() => {
      toast.info("Retrying processing...");
      runProcessingPipeline(material.id).catch((error) => {
        console.error('Retry error:', error);
        toast.error("Processing failed. Please try again.");
        queryClient.invalidateQueries({ queryKey: ["study-material", material.id] });
      }).finally(() => setIsRetrying(false));
    }).catch(() => {
      toast.error("Failed to restart processing.");
      setIsRetrying(false);
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            permanent
              ? "bg-destructive/10"
              : retryable
              ? "bg-warning/10"
              : material.processing_status === "completed"
              ? "bg-success/10"
              : "bg-primary/10"
          }`}>
            {permanent ? (
              <Ban className="w-10 h-10 text-destructive" />
            ) : retryable ? (
              <Clock className="w-10 h-10 text-warning" />
            ) : material.processing_status === "completed" ? (
              <CheckCircle2 className="w-10 h-10 text-success" />
            ) : (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            )}
          </div>

          <h2 className="text-2xl font-display font-bold mb-2">
            {permanent
              ? "Processing Failed"
              : retryable
              ? "Temporarily Unavailable"
              : material.processing_status === "completed"
              ? "Ready to Study!"
              : "Processing Your Material"}
          </h2>
          
          <p className="text-muted-foreground">
            {material.processing_status === "failed"
              ? material.processing_error || "An error occurred while processing your material."
              : material.processing_status === "completed"
              ? "Your study aids have been generated."
              : "This may take a few minutes depending on the file size."}
          </p>

          {/* Error type badge */}
          {material.processing_status === "failed" && (
            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-medium ${
              retryable
                ? "bg-warning/10 text-warning border border-warning/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              {retryable ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  Retryable — try again shortly
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  Permanent — check your file format
                </>
              )}
            </div>
          )}
        </div>

        {/* Progress Steps */}
        {material.processing_status !== "failed" && (
          <div className="space-y-6 mb-8">
            <Progress value={progress} className="h-2" />
            
            <div className="space-y-4">
              {processingSteps.map((stepItem, index) => {
                const Icon = stepItem.icon;
                const isComplete = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <motion.div
                    key={stepItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      isComplete
                        ? "bg-success/10 text-success"
                        : isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isComplete
                        ? "bg-success text-success-foreground"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="font-medium">{stepItem.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          {material.processing_status === "failed" && (
            <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
              {isRetrying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isRetrying ? "Retrying..." : "Retry Processing"}
            </Button>
          )}
          
          {material.processing_status === "completed" && (
            <Button onClick={() => navigate(`/materials/${material.id}`)} className="gap-2">
              Start Studying
            </Button>
          )}
          
          <Button variant="outline" onClick={() => navigate("/materials")}>
            Back to Materials
          </Button>
        </div>

        {/* File Info */}
        <div className="mt-8 p-4 rounded-lg bg-secondary/30 text-center">
          <p className="text-sm font-medium truncate">{material.file_name || material.title}</p>
          {material.file_size && (
            <p className="text-xs text-muted-foreground mt-1">
              {(material.file_size / (1024 * 1024)).toFixed(2)} MB
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
