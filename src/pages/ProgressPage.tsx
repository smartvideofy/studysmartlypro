import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useStudyStats } from "@/hooks/useStudySessions";
import { useDecks, useDeckMasteryStats } from "@/hooks/useFlashcards";
import { Skeleton, SkeletonProgressStat, SkeletonAchievement, SkeletonProgressChart } from "@/components/ui/skeleton";
import { ErrorRecovery } from "@/components/ui/error-recovery";
import { useQueryClient } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";

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

// Component to render individual deck progress with real mastery data
function DeckProgressRow({ deck }: { deck: { id: string; name: string; total: number; color: string } }) {
  const { data: masteryStats } = useDeckMasteryStats(deck.id);
  const percentage = masteryStats?.percentage || 0;
  
  return (
    <Link 
      to={`/study/${deck.id}`}
      className="block hover:bg-secondary/50 rounded-lg p-2 -m-2 transition-colors"
    >
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium truncate max-w-[50%]">{deck.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {masteryStats?.mastered || 0}/{deck.total} mastered
          </span>
          <Button variant="ghost" size="icon-sm" className="h-6 w-6">
            <Play className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${deck.color}`}
        />
      </div>
    </Link>
  );
}

export default function ProgressPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading, isError: statsError } = useStudyStats();
  const { data: decks, isLoading: decksLoading, isError: decksError } = useDecks();

  const isLoading = statsLoading || decksLoading;
  const hasError = statsError || decksError;

  const handleRetry = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['study-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['decks'] }),
    ]);
  };

  // Calculate subject/deck progress - now using placeholders that will be replaced with real data in the component
  const deckProgress = decks?.map((deck, i) => {
    const colors = ["bg-primary", "bg-success", "bg-accent", "bg-warning"];
    return {
      id: deck.id,
      name: deck.name,
      total: deck.card_count || 0,
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
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonProgressStat key={i} />
            ))}
          </div>

          {/* Charts Grid Skeleton */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card variant="elevated">
              <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent>
                <SkeletonProgressChart />
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-28 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Achievements Skeleton */}
          <Card variant="elevated">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-44 mt-1" />
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonAchievement key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (hasError) {
    return (
      <DashboardLayout title="Progress">
        <ErrorRecovery
          title="Failed to load progress"
          message="We couldn't load your progress data. Please check your connection and try again."
          onRetry={handleRetry}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Progress">
      <PullToRefresh onRefresh={handleRetry} disabled={!isMobile}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Stats Overview */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
          >
            <Card variant="interactive" className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold font-display">
                    {formatTime(stats?.totalTimeMinutes || 0)}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Total Study Time</p>
                </div>
              </div>
            </Card>
            
            <Card variant="interactive" className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold font-display">
                    {stats?.totalCardsStudied || 0}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Cards Studied</p>
                </div>
              </div>
            </Card>
            
            <Card variant="interactive" className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Flame className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold font-display">
                    {stats?.streak || 0}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </Card>
            
            <Card variant="interactive" className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold font-display">
                    {stats?.accuracy || 0}%
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Accuracy Rate</p>
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
                      <p className="mb-3">No study activity yet this week</p>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/flashcards">
                          <Play className="w-4 h-4 mr-1" />
                          Start Studying
                        </Link>
                      </Button>
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
                  deckProgress.slice(0, 5).map((deck) => (
                    <DeckProgressRow key={deck.id} deck={deck} />
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No decks created yet</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/flashcards">Create a Deck</Link>
                    </Button>
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
      </PullToRefresh>
    </DashboardLayout>
  );
}
