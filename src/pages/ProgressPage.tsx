import { motion } from "framer-motion";
import { 
  TrendingUp,
  Clock,
  Target,
  Flame,
  Brain,
  Trophy,
  BarChart3,
  CheckCircle2,
  Layers,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useStudyStats } from "@/hooks/useStudySessions";
import { useDecks } from "@/hooks/useFlashcards";

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

// Static achievements - these could be computed from stats in the future
const getAchievements = (stats: any, deckCount: number) => [
  { 
    icon: Flame, 
    title: "7 Day Streak", 
    description: "Study every day for a week", 
    unlocked: (stats?.streak || 0) >= 7 
  },
  { 
    icon: Brain, 
    title: "Memory Master", 
    description: "Master 100 flashcards", 
    unlocked: (stats?.totalCorrect || 0) >= 100 
  },
  { 
    icon: Trophy, 
    title: "First Session", 
    description: "Complete your first study session", 
    unlocked: (stats?.totalSessions || 0) >= 1 
  },
  { 
    icon: Target, 
    title: "Deck Builder", 
    description: "Create 5 flashcard decks", 
    unlocked: deckCount >= 5 
  },
];

export default function ProgressPage() {
  const { data: stats, isLoading: statsLoading } = useStudyStats();
  const { data: decks, isLoading: decksLoading } = useDecks();

  const isLoading = statsLoading || decksLoading;

  // Calculate subject/deck progress
  const deckProgress = decks?.map((deck, i) => {
    const colors = ["bg-primary", "bg-success", "bg-accent", "bg-warning"];
    return {
      name: deck.name,
      total: deck.card_count || 0,
      mastered: Math.floor((deck.card_count || 0) * 0.7), // Placeholder - would need actual mastery data
      color: colors[i % colors.length],
    };
  }) || [];

  const weeklyData = stats?.weekData || [];
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);
  const totalWeekMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const totalWeekCards = weeklyData.reduce((sum, d) => sum + d.cards, 0);

  const achievements = getAchievements(stats, decks?.length || 0);

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Progress">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Progress">
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
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {formatTime(stats?.totalTimeMinutes || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Study Time</p>
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
                  {stats?.totalCardsStudied || 0}
                </p>
                <p className="text-xs text-muted-foreground">Cards Studied</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {stats?.streak || 0}
                </p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">
                  {stats?.accuracy || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy Rate</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Study Chart */}
          <motion.div variants={itemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Weekly Activity
                </CardTitle>
                <CardDescription>Your study time this week</CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyData.length > 0 ? (
                  <>
                    <div className="flex items-end justify-between gap-2 h-48">
                      {weeklyData.map((data, i) => {
                        const height = maxMinutes > 0 ? (data.minutes / maxMinutes) * 100 : 0;
                        const isToday = i === weeklyData.length - 1;
                        
                        return (
                          <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full h-40 bg-secondary rounded-lg relative overflow-hidden">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                className={`absolute bottom-0 left-0 right-0 rounded-lg ${
                                  isToday ? "bg-primary" : "bg-primary/50"
                                }`}
                              />
                            </div>
                            <span className={`text-xs ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                              {data.day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <span>Total: {formatTime(totalWeekMinutes)}</span>
                      <span>{totalWeekCards} cards reviewed</span>
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No study activity yet this week</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject Progress */}
          <motion.div variants={itemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent" />
                  Deck Progress
                </CardTitle>
                <CardDescription>Cards per deck</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deckProgress.length > 0 ? (
                  deckProgress.slice(0, 5).map((deck) => {
                    const percentage = deck.total > 0 ? Math.round((deck.mastered / deck.total) * 100) : 0;
                    
                    return (
                      <div key={deck.name}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium truncate max-w-[60%]">{deck.name}</span>
                          <span className="text-muted-foreground">
                            {deck.total} cards
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${deck.color}`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No decks created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Achievements
              </CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  
                  return (
                    <div
                      key={achievement.title}
                      className={`p-4 rounded-xl border ${
                        achievement.unlocked 
                          ? "bg-success/5 border-success/20" 
                          : "bg-muted/50 border-border opacity-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        achievement.unlocked ? "bg-success/10" : "bg-muted"
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          achievement.unlocked ? "text-success" : "text-muted-foreground"
                        }`} />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{achievement.title}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      {achievement.unlocked && (
                        <Badge variant="success" className="mt-2 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
