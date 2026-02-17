import { useState } from "react";
import { motion } from "framer-motion";
import { 
  HelpCircle,
  Search,
  Mail,
  Lightbulb,
  Loader2,
  CheckCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useHelpCategories, useFAQs, useSearchHelpArticles } from "@/hooks/useHelpCenter";
import { HelpCategoryCard } from "@/components/help/HelpCategoryCard";
import { HelpSearchResults } from "@/components/help/HelpSearchResults";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead, createFAQPageJsonLd, createHelpCenterJsonLd } from "@/components/seo";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const SkeletonCategories = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const SkeletonFAQs = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="border border-border rounded-lg p-4">
        <Skeleton className="h-5 w-3/4" />
      </div>
    ))}
  </div>
);

export default function HelpPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Fetch data from database
  const { data: categories, isLoading: categoriesLoading } = useHelpCategories();
  const { data: faqs, isLoading: faqsLoading } = useFAQs();
  const { data: searchResults, isLoading: searchLoading } = useSearchHelpArticles(searchQuery);

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Feedback Submitted",
        message: feedbackMessage,
        type: "feedback",
        data: { feedback: feedbackMessage, submitted_at: new Date().toISOString() }
      });

      if (error) throw error;

      setFeedbackSubmitted(true);
      setFeedbackMessage("");
      toast.success("Thank you for your feedback!");
      
      // Reset after 3 seconds
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSupport = () => {
    window.location.href = "mailto:support@getstudily.com?subject=Support Request";
  };

  const showSearchResults = searchQuery.length >= 2;

  // Generate FAQ JSON-LD for structured data
  const faqJsonLd = faqs && faqs.length > 0
    ? createFAQPageJsonLd(faqs.map(f => ({ 
        question: f.title, 
        answer: f.summary || f.content.slice(0, 300) 
      })))
    : null;

  const jsonLdData = [createHelpCenterJsonLd(), ...(faqJsonLd ? [faqJsonLd] : [])];

  return (
    <DashboardLayout title="Help & Support">
      <SEOHead
        title="Help Center"
        description="Get help with Studily - search our knowledge base, browse FAQs, or contact support. Find answers to common questions about flashcards, notes, and study tools."
        url="/help"
        jsonLd={jsonLdData}
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl space-y-8"
      >
        {/* Search Header */}
        <motion.div variants={itemVariants}>
          <Card variant="gradient" className="overflow-hidden">
            <CardContent className="p-8 text-center">
              <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">How can we help?</h2>
              <p className="text-muted-foreground mb-6">Search our help center or browse topics below</p>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Results */}
        {showSearchResults && (
          <HelpSearchResults 
            query={searchQuery} 
            results={searchResults || []} 
            isLoading={searchLoading} 
          />
        )}

        {/* Help Categories */}
        {!showSearchResults && (
          <motion.div variants={itemVariants}>
            <h3 className="font-display text-lg font-semibold mb-4">Browse Topics</h3>
            {categoriesLoading ? (
              <SkeletonCategories />
            ) : categories && categories.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category, index) => (
                  <HelpCategoryCard key={category.id} category={category} index={index} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No categories available.</p>
            )}
          </motion.div>
        )}

        {/* FAQ Section */}
        {!showSearchResults && (
          <motion.div variants={itemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {faqsLoading ? (
                  <SkeletonFAQs />
                ) : faqs && faqs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={faq.id} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground whitespace-pre-line">
                          {faq.summary || faq.content.slice(0, 300)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No FAQs available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contact & Feedback */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>Get help from our team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Button variant="outline" className="w-full" onClick={handleEmailSupport}>
                  <Mail className="w-4 h-4" />
                  Email Support
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Send Feedback
                </CardTitle>
                <CardDescription>Help us improve Studily</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedbackSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mb-2" />
                    <p className="font-medium">Thank you for your feedback!</p>
                    <p className="text-sm text-muted-foreground">We appreciate you taking the time to help us improve.</p>
                  </div>
                ) : (
                  <>
                    <Textarea
                      placeholder="Share your thoughts, suggestions, or report issues..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="w-full"
                      onClick={handleSubmitFeedback}
                      disabled={!feedbackMessage.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Submit Feedback
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
