import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Trophy, Star, Flame, Clock, Layers, Target, Lock, Sparkles, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { XPProgress, AchievementBadge } from "@/components/gamification/XPProgress";
import { 
  useAchievements, 
  useUserAchievements, 
  useGamificationProfile,
  xpProgressInLevel 
} from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

const categoryIcons: Record<string, React.ElementType> = {
  study_time: Clock,
  cards: Layers,
  streaks: Flame,
  mastery: Target,
};

const categoryLabels: Record<string, string> = {
  study_time: "Study Time",
  cards: "Cards Studied",
  streaks: "Streaks",
  mastery: "Mastery",
};

const tierColors: Record<string, { bg: string; border: string; text: string }> = {
  bronze: { bg: "from-amber-600/20 to-amber-800/10", border: "border-amber-600/30", text: "text-amber-600" },
  silver: { bg: "from-slate-400/20 to-slate-600/10", border: "border-slate-400/30", text: "text-slate-400" },
  gold: { bg: "from-yellow-400/20 to-yellow-600/10", border: "border-yellow-500/30", text: "text-yellow-500" },
  platinum: { bg: "from-purple-400/20 to-purple-600/10", border: "border-purple-500/30", text: "text-purple-500" },
};

function AchievementsSkeleton() {
  return (
    <DashboardLayout title="Achievements">
      <div className="space-y-8">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AchievementsPage() {
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userAchievementsLoading } = useUserAchievements();
  const { data: profile, isLoading: profileLoading } = useGamificationProfile();

  const isLoading = achievementsLoading || userAchievementsLoading || profileLoading;

  if (isLoading) {
    return <AchievementsSkeleton />;
  }

  const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const totalAchievements = achievements?.length || 0;
  const earnedCount = userAchievements?.length || 0;

  // Group achievements by category
  const groupedAchievements = achievements?.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<string, typeof achievements>) || {};

  // Calculate stats
  const totalXPFromAchievements = userAchievements?.reduce(
    (sum, ua) => sum + (ua.achievement?.xp_reward || 0),
    0
  ) || 0;

  return (
    <DashboardLayout title="Achievements">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants}>
          <Card variant="glass" className="overflow-hidden border-0">
            <div className="relative p-6 md:p-8">
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-accent/20 to-primary/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold">Achievements</h2>
                      <p className="text-muted-foreground">
                        {earnedCount} of {totalAchievements} unlocked
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-w-md">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-medium">{Math.round((earnedCount / totalAchievements) * 100)}%</span>
                    </div>
                    <Progress value={(earnedCount / totalAchievements) * 100} className="h-3" />
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <XPProgress />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-accent" />
              </div>
              <div className="font-display text-2xl font-bold">{earnedCount}</div>
              <div className="text-xs text-muted-foreground">Achievements</div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-2">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div className="font-display text-2xl font-bold">{profile?.level || 1}</div>
              <div className="text-xs text-muted-foreground">Current Level</div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-success" />
              </div>
              <div className="font-display text-2xl font-bold">{totalXPFromAchievements.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">XP from Achievements</div>
            </CardContent>
          </Card>
          
          <Card variant="glass">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive/15 to-destructive/5 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-destructive" />
              </div>
              <div className="font-display text-2xl font-bold">{profile?.streak_days || 0}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements by Category */}
        {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
          const CategoryIcon = categoryIcons[category] || Trophy;
          const earnedInCategory = categoryAchievements?.filter(a => earnedIds.has(a.id)).length || 0;
          const totalInCategory = categoryAchievements?.length || 0;

          return (
            <motion.div key={category} variants={itemVariants}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{categoryLabels[category] || category}</h3>
                  <p className="text-sm text-muted-foreground">
                    {earnedInCategory} of {totalInCategory} unlocked
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements?.map((achievement) => {
                  const isEarned = earnedIds.has(achievement.id);
                  const userAch = userAchievements?.find(ua => ua.achievement_id === achievement.id);
                  const colors = tierColors[achievement.tier] || tierColors.bronze;

                  return (
                    <motion.div
                      key={achievement.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Card 
                        variant="glass" 
                        className={cn(
                          "h-full transition-all duration-300",
                          isEarned 
                            ? `border ${colors.border} bg-gradient-to-br ${colors.bg}` 
                            : "opacity-60"
                        )}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <AchievementBadge
                                icon={achievement.icon}
                                name={achievement.name}
                                tier={achievement.tier}
                                earned={isEarned}
                                size="lg"
                              />
                              {!isEarned && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Lock className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={cn(
                                  "font-semibold truncate",
                                  isEarned && colors.text
                                )}>
                                  {achievement.name}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs capitalize", isEarned && colors.text)}
                                >
                                  {achievement.tier}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {achievement.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  +{achievement.xp_reward} XP
                                </span>
                                {isEarned && userAch?.earned_at && (
                                  <span className="text-xs text-muted-foreground">
                                    Earned {new Date(userAch.earned_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {!achievements?.length && (
          <motion.div variants={itemVariants}>
            <Card variant="glass" className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">No Achievements Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Start studying to unlock achievements and earn XP rewards!
              </p>
              <Button variant="hero" asChild>
                <Link to="/flashcards">
                  <Play className="w-4 h-4" />
                  Start a Study Session
                </Link>
              </Button>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
