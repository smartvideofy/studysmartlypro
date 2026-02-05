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
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Heart,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useStartTrial } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { haptics } from "@/lib/haptics";

const featureSteps = [
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

const studyGoals = [
  { value: "exam", label: "Exam Preparation", icon: GraduationCap, description: "Studying for tests and exams" },
  { value: "professional", label: "Professional Development", icon: Briefcase, description: "Learning new skills for work" },
  { value: "personal", label: "Personal Interest", icon: Heart, description: "Learning for fun and curiosity" },
  { value: "general", label: "General Learning", icon: BookOpen, description: "Mixed learning goals" },
];

const studyTimes = [
  { value: "morning", label: "Morning", time: "6 AM - 12 PM" },
  { value: "afternoon", label: "Afternoon", time: "12 PM - 6 PM" },
  { value: "evening", label: "Evening", time: "6 PM - 10 PM" },
  { value: "night", label: "Night", time: "10 PM - 2 AM" },
];

const TOTAL_STEPS = featureSteps.length + 1; // Features + Preferences

export default function OnboardingPage() {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [studyGoal, setStudyGoal] = useState("general");
  const [dailyMinutes, setDailyMinutes] = useState([30]);
  const [preferredTime, setPreferredTime] = useState("morning");
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const startTrial = useStartTrial();
  
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const isPreferencesStep = currentStep >= featureSteps.length;
  const step = isPreferencesStep ? null : featureSteps[currentStep];

  const handleNext = async () => {
    haptics.light();
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences and navigate to dashboard
      setIsSaving(true);
      try {
        await updateProfile.mutateAsync({
          study_goal: studyGoal,
          daily_study_minutes: dailyMinutes[0],
          preferred_study_time: preferredTime,
        });
        
        // Auto-start 7-day trial for new users
        try {
          await startTrial.mutateAsync();
        } catch (trialError: any) {
          // Trial may already be used or user already subscribed - that's fine
          console.log('Trial start skipped:', trialError?.message);
        }
        
        haptics.success();
        navigate("/dashboard");
      } catch (error) {
        toast.error("Failed to save preferences. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePrevious = () => {
    haptics.light();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // Save default preferences and skip
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        study_goal: "general",
        daily_study_minutes: 30,
        preferred_study_time: "morning",
      });
      navigate("/dashboard");
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">Studily</span>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleSkip} disabled={isSaving} className="touch-target">
          Skip Tutorial
        </Button>
      </header>

      {/* Progress */}
      <div className="px-4 md:px-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{isPreferencesStep ? "Set Your Preferences" : "Getting Started"}</span>
            <span>{currentStep + 1} of {TOTAL_STEPS}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <AnimatePresence mode="wait">
          {!isPreferencesStep && step ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="max-w-lg text-center px-4"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl ${step.bg} flex items-center justify-center mx-auto mb-6 md:mb-8`}
              >
                <step.icon className={`w-10 h-10 md:w-12 md:h-12 ${step.color}`} />
              </motion.div>

              {/* Title */}
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                {step.title}
              </h1>

              {/* Description */}
              <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8 max-w-md mx-auto">
                {step.description}
              </p>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mb-8">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      haptics.light();
                      setCurrentStep(i);
                    }}
                    className={cn(
                      "rounded-full transition-all touch-target",
                      isMobile ? "w-3 h-3" : "w-2.5 h-2.5",
                      i === currentStep 
                        ? cn("bg-primary", isMobile ? "w-6" : "w-8")
                        : i < currentStep 
                          ? "bg-success" 
                          : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl px-4"
            >
              <div className="text-center mb-6 md:mb-8">
                <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                  Personalize Your Experience
                </h1>
                <p className="text-muted-foreground text-base md:text-lg">
                  Tell us about your study preferences so we can optimize your learning journey.
                </p>
              </div>

              <div className="space-y-6 md:space-y-8">
                {/* Study Goal */}
                <Card variant="elevated">
                  <CardContent className="p-4 md:p-6">
                    <Label className="text-base font-semibold mb-4 block">What's your main study goal?</Label>
                    <RadioGroup value={studyGoal} onValueChange={(v) => {
                      setStudyGoal(v);
                      haptics.light();
                    }} className="grid gap-3">
                      {studyGoals.map((goal) => {
                        const Icon = goal.icon;
                        return (
                          <div
                            key={goal.value}
                            className={cn(
                              "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border cursor-pointer transition-all touch-target",
                              studyGoal === goal.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => {
                              setStudyGoal(goal.value);
                              haptics.light();
                            }}
                          >
                            <RadioGroupItem value={goal.value} id={goal.value} />
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={goal.value} className="font-medium cursor-pointer text-sm md:text-base">
                                {goal.label}
                              </Label>
                              <p className="text-xs md:text-sm text-muted-foreground">{goal.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Daily Study Time */}
                <Card variant="elevated">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold">Daily study goal</Label>
                      <span className="text-xl md:text-2xl font-bold text-primary">{dailyMinutes[0]} min</span>
                    </div>
                    <Slider
                      value={dailyMinutes}
                      onValueChange={setDailyMinutes}
                      min={10}
                      max={120}
                      step={5}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 min</span>
                      <span>120 min</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Preferred Study Time */}
                <Card variant="elevated">
                  <CardContent className="p-4 md:p-6">
                    <Label className="text-base font-semibold mb-4 block">When do you prefer to study?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {studyTimes.map((time) => (
                        <button
                          key={time.value}
                          onClick={() => {
                            setPreferredTime(time.value);
                            haptics.light();
                          }}
                          className={cn(
                            "p-3 md:p-4 rounded-xl border text-left transition-all touch-target",
                            preferredTime === time.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="font-medium text-sm md:text-base">{time.label}</div>
                          <div className="text-xs md:text-sm text-muted-foreground">{time.time}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center gap-2 mt-6 md:mt-8">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      haptics.light();
                      setCurrentStep(i);
                    }}
                    className={cn(
                      "rounded-full transition-all touch-target",
                      isMobile ? "w-3 h-3" : "w-2.5 h-2.5",
                      i === currentStep 
                        ? cn("bg-primary", isMobile ? "w-6" : "w-8")
                        : i < currentStep 
                          ? "bg-success" 
                          : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <footer className="p-4 md:p-6 pb-safe">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Trial highlight card - show on final step */}
          {isPreferencesStep && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold">Your 7-day free trial starts now!</span>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                  No credit card
                </Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Unlimited document uploads & AI tools</li>
                <li>• Practice questions & concept maps</li>
                <li>• Full access to all Pro features</li>
              </ul>
            </motion.div>
          )}

          <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSaving}
            className="h-12 touch-target"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="ml-2">Previous</span>
          </Button>

          <Button 
            variant="hero" 
            size="lg" 
            onClick={handleNext} 
            disabled={isSaving}
            className="h-12 px-6 md:px-8 touch-target"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="ml-2">Saving...</span>
              </>
            ) : currentStep === TOTAL_STEPS - 1 ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                <span>Start My Free Trial</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
        </div>
      </footer>
    </div>
  );
}
