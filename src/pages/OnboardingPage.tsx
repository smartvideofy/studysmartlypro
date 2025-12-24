import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Layers, 
  Brain, 
  Users, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const steps = [
  {
    icon: BookOpen,
    title: "Take Smart Notes",
    description: "Create organized notes with rich text, images, and audio. Import from PDF or Word documents.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Layers,
    title: "Create Flashcards",
    description: "Build flashcard decks manually or let AI generate them from your notes automatically.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Brain,
    title: "Study with Spaced Repetition",
    description: "Our algorithm schedules reviews at optimal intervals to maximize long-term retention.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: Users,
    title: "Collaborate with Peers",
    description: "Share notes, join study groups, and learn together with your classmates.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description: "Get personalized study plans, smart recommendations, and AI summaries of your content.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">Studyly</span>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleSkip}>
          Skip Tutorial
        </Button>
      </header>

      {/* Progress */}
      <div className="px-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Getting Started</span>
            <span>{currentStep + 1} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-lg text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`w-24 h-24 rounded-2xl ${step.bg} flex items-center justify-center mx-auto mb-8`}
            >
              <Icon className={`w-12 h-12 ${step.color}`} />
            </motion.div>

            {/* Title */}
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {step.title}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              {step.description}
            </p>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentStep 
                      ? "bg-primary w-8" 
                      : i < currentStep 
                        ? "bg-success" 
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <footer className="p-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button variant="hero" size="lg" onClick={handleNext}>
            {currentStep === steps.length - 1 ? (
              <>
                Get Started
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
