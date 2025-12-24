import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Layers, 
  MoreHorizontal,
  Clock,
  Play,
  ChevronRight,
  Sparkles,
  Brain,
  Target,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";

const decks = [
  { 
    id: 1, 
    name: "Spanish Vocabulary", 
    subject: "Languages",
    totalCards: 120,
    mastered: 87,
    dueToday: 24,
    lastStudied: "2 hours ago",
    color: "bg-primary/10 text-primary",
  },
  { 
    id: 2, 
    name: "Biology Terms", 
    subject: "Science",
    totalCards: 85,
    mastered: 45,
    dueToday: 18,
    lastStudied: "5 hours ago",
    color: "bg-success/10 text-success",
  },
  { 
    id: 3, 
    name: "Physics Formulas", 
    subject: "Science",
    totalCards: 64,
    mastered: 52,
    dueToday: 12,
    lastStudied: "1 day ago",
    color: "bg-accent/10 text-accent",
  },
  { 
    id: 4, 
    name: "World History Dates", 
    subject: "History",
    totalCards: 150,
    mastered: 98,
    dueToday: 8,
    lastStudied: "3 days ago",
    color: "bg-warning/10 text-warning",
  },
];

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

export default function FlashcardsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const totalDue = decks.reduce((sum, deck) => sum + deck.dueToday, 0);

  return (
    <DashboardLayout title="Flashcards">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Overview */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {decks.reduce((sum, d) => sum + d.totalCards, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Cards</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {decks.reduce((sum, d) => sum + d.mastered, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Mastered</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{totalDue}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{decks.length}</p>
                <p className="text-xs text-muted-foreground">Decks</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Study Banner */}
        <motion.div variants={itemVariants}>
          <Card variant="gradient" className="overflow-hidden">
            <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <Badge variant="accent" className="mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {totalDue} cards due
                </Badge>
                <h3 className="font-display text-xl font-semibold mb-1">
                  Ready to study?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Review your due cards to maintain your retention.
                </p>
              </div>
              <Button variant="hero" size="lg" asChild>
                <Link to="/study">
                  <Play className="w-5 h-5" />
                  Start Review
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Header Actions */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Generate</span>
            </Button>
            
            <Button variant="hero" size="sm">
              <Plus className="w-4 h-4" />
              New Deck
            </Button>
          </div>
        </motion.div>

        {/* Decks Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid md:grid-cols-2 gap-4">
            {decks.map((deck) => {
              const progressPercent = Math.round((deck.mastered / deck.totalCards) * 100);
              
              return (
                <Card key={deck.id} variant="interactive" className="group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${deck.color} flex items-center justify-center`}>
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-display font-semibold">{deck.name}</h4>
                          <p className="text-sm text-muted-foreground">{deck.subject}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{deck.mastered} / {deck.totalCards} mastered</span>
                      </div>
                      
                      <Progress value={progressPercent} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-accent">
                            <Target className="w-4 h-4" />
                            {deck.dueToday} due
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {deck.lastStudied}
                          </span>
                        </div>
                        
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/study/${deck.id}`}>
                            Study
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
