import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FileText, 
  Brain, 
  Lightbulb, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StudyMaterial, useUpdateStudyMaterial } from "@/hooks/useStudyMaterials";
import { useQueryClient } from "@tanstack/react-query";

interface ProcessingStatusProps {
  material: StudyMaterial;
}

const processingSteps = [
  { id: "extracting", label: "Extracting content", icon: FileText },
  { id: "structuring", label: "Structuring topics", icon: Brain },
  { id: "generating", label: "Generating study aids", icon: Lightbulb },
];

export default function ProcessingStatus({ material }: ProcessingStatusProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateMaterial = useUpdateStudyMaterial();

  // Calculate current step based on status
  const getProgress = () => {
    switch (material.processing_status) {
      case "pending":
        return { step: 0, progress: 10 };
      case "processing":
        return { step: 1, progress: 50 };
      case "completed":
        return { step: 3, progress: 100 };
      case "failed":
        return { step: -1, progress: 0 };
      default:
        return { step: 0, progress: 0 };
    }
  };

  const { step: currentStep, progress } = getProgress();

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
    updateMaterial.mutate({
      id: material.id,
      processing_status: "pending",
      processing_error: null,
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
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            {material.processing_status === "failed" ? (
              <AlertCircle className="w-10 h-10 text-destructive" />
            ) : material.processing_status === "completed" ? (
              <CheckCircle2 className="w-10 h-10 text-success" />
            ) : (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            )}
          </div>

          <h2 className="text-2xl font-display font-bold mb-2">
            {material.processing_status === "failed"
              ? "Processing Failed"
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
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry Processing
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
