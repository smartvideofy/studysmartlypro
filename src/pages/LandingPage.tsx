import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Brain, 
  Users, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: BookOpen,
    title: "Smart Notes",
    description: "Rich text editor with folders, tags, and media uploads. Import from PDF or Word.",
    color: "primary",
  },
  {
    icon: Brain,
    title: "Spaced Repetition",
    description: "Science-backed algorithm to help you retain information longer.",
    color: "success",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description: "Auto-generate flashcards, summaries, and personalized study plans.",
    color: "accent",
  },
  {
    icon: Users,
    title: "Collaborate",
    description: "Study groups, shared notes, and discussion threads with your peers.",
    color: "primary",
  },
];

const stats = [
  { value: "10K+", label: "Active Students" },
  { value: "500K+", label: "Flashcards Created" },
  { value: "95%", label: "Retention Rate" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Studyly</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        {/* Decorative Elements */}
        <div className="absolute top-40 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="secondary" className="mb-6">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered Learning Platform
              </Badge>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Study Smarter,
              <br />
              <span className="gradient-text">Not Harder</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance"
            >
              The all-in-one study platform with smart notes, AI-powered flashcards, 
              spaced repetition, and collaborative study groups.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/dashboard">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="#features">
                  See How It Works
                </Link>
              </Button>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              {[
                "No credit card required",
                "Free tier available",
                "Cancel anytime",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-20 flex flex-wrap justify-center gap-12"
          >
            {stats.map((stat) => (
              <motion.div 
                key={stat.label}
                variants={itemVariants}
                className="text-center"
              >
                <div className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="outline" className="mb-4">
                <Target className="w-3 h-3 mr-1" />
                Features
              </Badge>
            </motion.div>
            <motion.h2 
              variants={itemVariants}
              className="font-display text-3xl md:text-5xl font-bold mb-4"
            >
              Everything You Need to Excel
            </motion.h2>
            <motion.p 
              variants={itemVariants}
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
            >
              Powerful tools designed to help you learn faster, remember longer, and achieve your academic goals.
            </motion.p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="group glass-card-hover rounded-2xl p-6"
                >
                  <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${feature.color}`} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative glass-card rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            
            <motion.div variants={itemVariants} className="relative">
              <TrendingUp className="w-12 h-12 mx-auto mb-6 text-primary" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Join thousands of students who are already studying smarter with Studyly.
              </p>
              <Button variant="hero" size="xl" asChild>
                <Link to="/dashboard">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">Studyly</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Studyly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
