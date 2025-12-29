import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Send,
  ChevronRight,
  Mail,
  FileText,
  Lightbulb,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

const faqs = [
  {
    question: "How do I create flashcards from my notes?",
    answer: "Open any note and click the 'Generate Flashcards' button in the toolbar. Our AI will automatically create flashcards based on your note content. You can also manually create flashcards by going to the Flashcards section.",
    category: "Study Features"
  },
  {
    question: "What is spaced repetition?",
    answer: "Spaced repetition is a learning technique that involves reviewing information at increasing intervals. When you study flashcards, our algorithm schedules reviews based on how well you know each card, helping you retain information more efficiently.",
    category: "Study Features"
  },
  {
    question: "How do I share notes with study groups?",
    answer: "Go to the Groups section, select or create a group, and click 'Share Notes'. You can choose specific notes to share with group members. They'll be able to view and comment on shared content.",
    category: "Collaboration"
  },
  {
    question: "Can I import notes from other apps?",
    answer: "Yes! We support importing from PDF and Word documents. Go to Notes, click 'Import', and select your file. We'll extract the text and create a new note for you.",
    category: "Notes & Editor"
  },
  {
    question: "How does the AI summarizer work?",
    answer: "The AI summarizer analyzes your note content and creates concise bullet points highlighting the key concepts. Open any note and click 'AI Summarize' in the toolbar to generate a summary.",
    category: "Study Features"
  },
  {
    question: "How do I get started with Studyly?",
    answer: "Start by uploading your study materials in the Materials section. Our AI will automatically process them and generate flashcards, summaries, and practice questions. Then head to the Flashcards section to start studying!",
    category: "Getting Started"
  },
  {
    question: "How do I track my study progress?",
    answer: "Visit the Progress page to see detailed analytics about your study sessions, including time studied, cards reviewed, and accuracy rates. You can view daily, weekly, and monthly statistics.",
    category: "Getting Started"
  },
];

const helpCategories = [
  { icon: Book, title: "Getting Started", description: "Learn the basics", articles: 12 },
  { icon: FileText, title: "Notes & Editor", description: "Creating and organizing notes", articles: 8 },
  { icon: Lightbulb, title: "Study Features", description: "Flashcards and spaced repetition", articles: 15 },
  { icon: MessageCircle, title: "Collaboration", description: "Groups and sharing", articles: 6 },
];

export default function HelpPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Filter FAQs based on search query and selected category
  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = searchQuery === "" || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleCategoryClick = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    setSearchQuery("");
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
  };

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
    window.location.href = "mailto:support@studily.app?subject=Support Request";
  };

  return (
    <DashboardLayout title="Help & Support">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl space-y-6"
      >
        {/* Search */}
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
              {(searchQuery || selectedCategory) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Help Categories */}
        <motion.div variants={itemVariants}>
          <h3 className="font-display text-lg font-semibold mb-4">Browse Topics</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {helpCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.title;
              return (
                <Card 
                  key={category.title} 
                  variant="interactive" 
                  className={`group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => handleCategoryClick(category.title)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 group-hover:bg-primary/20'
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{category.title}</h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm">{category.articles} articles</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>
                {selectedCategory ? `${selectedCategory} - FAQ` : "Frequently Asked Questions"}
              </CardTitle>
              <CardDescription>
                {filteredFaqs.length === 0 
                  ? "No results found. Try a different search term."
                  : `${filteredFaqs.length} question${filteredFaqs.length === 1 ? '' : 's'} found`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No matching questions found.</p>
                  <Button variant="link" onClick={clearFilters}>
                    View all FAQs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

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
                <CardDescription>Help us improve Studyly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedbackSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
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

      {/* Category Modal for coming soon articles */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coming Soon</DialogTitle>
            <DialogDescription>
              Detailed help articles for this category are coming soon. For now, check the FAQ section or contact support.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
