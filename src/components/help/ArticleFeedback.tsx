import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ArticleFeedbackProps {
  articleId: string;
  helpfulCount: number;
  notHelpfulCount: number;
}

export const ArticleFeedback = ({
  articleId,
  helpfulCount,
  notHelpfulCount,
}: ArticleFeedbackProps) => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState<"helpful" | "not_helpful" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counts, setCounts] = useState({
    helpful: helpfulCount,
    notHelpful: notHelpfulCount,
  });

  const submitFeedback = async (isHelpful: boolean) => {
    if (!user) {
      toast.error("Please sign in to submit feedback");
      return;
    }

    if (submitted) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("help_article_feedback").insert({
        article_id: articleId,
        user_id: user.id,
        is_helpful: isHelpful,
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - user already submitted
          toast.info("You've already submitted feedback for this article");
        } else {
          throw error;
        }
      } else {
        setSubmitted(isHelpful ? "helpful" : "not_helpful");
        setCounts((prev) => ({
          helpful: isHelpful ? prev.helpful + 1 : prev.helpful,
          notHelpful: !isHelpful ? prev.notHelpful + 1 : prev.notHelpful,
        }));
        toast.success("Thanks for your feedback!");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border pt-8 mt-8">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground font-medium">Thanks for your feedback!</p>
            <p className="text-sm text-muted-foreground">
              Your input helps us improve our help center.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <p className="text-foreground font-medium">Was this article helpful?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => submitFeedback(true)}
                disabled={isSubmitting}
                className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
              >
                <ThumbsUp className="w-5 h-5" />
                <span>Yes</span>
                {counts.helpful > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({counts.helpful})
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => submitFeedback(false)}
                disabled={isSubmitting}
                className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <ThumbsDown className="w-5 h-5" />
                <span>No</span>
                {counts.notHelpful > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({counts.notHelpful})
                  </span>
                )}
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground">
                Sign in to submit feedback
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
