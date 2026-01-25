import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Plus, 
  FileText, 
  Layers, 
  Brain, 
  Clock, 
  TrendingUp, 
  Flame,
  Target,
  ArrowRight,
  Sparkles,
  BookOpen,
  Upload,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useStudyMaterials } from "@/hooks/useStudyMaterials";
import { useDecks, useDueCards } from "@/hooks/useFlashcards";
import { useStudyStats } from "@/hooks/useStudySessions";
import { formatDistanceToNow } from "date-fns";
import { 
  Skeleton,
  SkeletonStatCard, 
  SkeletonQuickAction, 
  SkeletonMaterialItem, 
  SkeletonReviewItem, 
  SkeletonWelcome,
  SkeletonProgressChart
} from "@/components/ui/skeleton";
import { ErrorRecovery } from "@/components/ui/error-recovery";
import { useQueryClient } from "@tanstack/react-query";
import { XPProgress } from "@/components/gamification/XPProgress";
import { SEOHead } from "@/components/seo/SEOHead";
import { createDashboardJsonLd } from "@/components/seo/jsonld";
import { AnimatedCounter } from "@/components/ui/animated-counter";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const quickActions = [
  { icon: Upload, label: "Upload Material", path: "/materials", color: "primary" },
  { icon: Layers, label: "Create Deck", path: "/flashcards/new", color: "accent" },
  { icon: Brain, label: "Study Session", path: "/flashcards", color: "success" },
  { icon: Sparkles, label: "AI Features", path: "/materials", color: "primary" },
];

function DashboardSkeleton() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
        <SkeletonWelcome />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div>
          <Skeleton className="h-5 md:h-6 w-28 md:w-32 mb-3 md:mb-4" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonQuickAction key={i} />
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="space-y-1.5 md:space-y-2">
                <Skeleton className="h-4 md:h-5 w-28 md:w-36" />
                <Skeleton className="h-3 md:h-4 w-36 md:w-48" />
              </div>
              <Skeleton className="h-8 md:h-9 w-16 md:w-20 rounded-lg" />
            </div>
            <div className="space-y-2 md:space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonMaterialItem key={i} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
              <Skeleton className="h-4 md:h-5 w-28 md:w-32" />
              <Skeleton className="h-3 md:h-4 w-36 md:w-44" />
            </div>
            <div className="space-y-2 md:space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonReviewItem key={i} />
              ))}
            </div>
            <Skeleton className="h-9 md:h-10 w-full rounded-lg mt-3 md:mt-4" />
          </div>
        </div>
        <div className="hidden md:block rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <SkeletonProgressChart />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const { data: materials, isLoading: materialsLoading, isError: materialsError } = useStudyMaterials();
  const { data: decks, isLoading: decksLoading, isError: decksError } = useDecks();
  const { data: dueCards } = useDueCards();
  const { data: stats, isLoading: statsLoading, isError: statsError } = useStudyStats();

  const isLoading = profileLoading || materialsLoading || decksLoading || statsLoading;
  const hasError = profileError || materialsError || decksError || statsError;

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['study-materials'] });
    queryClient.invalidateQueries({ queryKey: ['decks'] });
    queryClient.invalidateQueries({ queryKey: ['study-stats'] });
  };

  const totalCards = decks?.reduce((sum, deck) => sum + (deck.card_count || 0), 0) || 0;
  const totalDue = dueCards?.length || 0;
  const recentMaterials = materials?.slice(0, 3) || [];
  
  const upcomingReviews = decks?.slice(0, 3).map(deck => ({
    deck: deck.name,
    cards: deck.card_count || 0,
    due: "Today",
    id: deck.id
  })) || [];

  const userName = profile?.full_name?.split(' ')[0] || 'Student';
  const streakDays = stats?.streak || 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (hasError) {
    return (
      <DashboardLayout title="Dashboard">
        <ErrorRecovery
          title="Failed to load dashboard"
          message="We couldn't load your dashboard data. Please check your connection and try again."
          onRetry={handleRetry}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <SEOHead
        title="Dashboard"
        description="Your personalized study dashboard. Track your progress, manage study materials, review flashcards, and start study sessions."
        url="/dashboard"
        noindex={true}
        jsonLd={createDashboardJsonLd()}
      />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 md:space-y-8"
      >
        {/* Welcome Section - Clean design */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="p-5 md:p-8">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  {streakDays} Day Streak
                </Badge>
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold mb-2">
                Welcome back, {userName}! 👋
              </h2>
              <p className="text-muted-foreground mb-5 md:mb-6 max-w-lg text-sm md:text-base">
                {totalDue > 0 ? (
                  <>You have <strong className="text-foreground">{totalDue} flashcards</strong> due for review today.</>
                ) : (
                  <>You're all caught up! Create new notes or flashcards to keep learning.</>
                )}
              </p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button asChild>
                  <Link to="/flashcards">
                    Start Studying
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/materials">
                    <Upload className="w-4 h-4 mr-1" />
                    Upload Material
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* XP Progress */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="font-display text-base md:text-lg font-semibold">Your Progress</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/achievements">
                <Trophy className="w-4 h-4 mr-1" />
                All Achievements
              </Link>
            </Button>
          </div>
          <XPProgress />
        </motion.div>

        {/* Stats Cards - Clean design */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        >
          {[
            { icon: FileText, label: "Materials", value: materials?.length || 0, color: "text-primary", bg: "bg-primary/10", path: "/materials", isTime: false },
            { icon: Layers, label: "Flashcards", value: totalCards, color: "text-accent", bg: "bg-accent/10", path: "/flashcards", isTime: false },
            { icon: Target, label: "Mastered", value: stats?.totalCorrect || 0, color: "text-success", bg: "bg-success/10", path: "/progress", isTime: false },
            { icon: Clock, label: "Study Time", value: stats?.totalTimeMinutes || 0, color: "text-primary", bg: "bg-primary/10", path: "/progress", isTime: true },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link to={stat.path}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5">
                    <div className={`w-10 h-10 md:w-11 md:h-11 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 md:w-5.5 md:h-5.5 ${stat.color}`} />
                    </div>
                    <div className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                      <AnimatedCounter 
                        value={stat.value as number} 
                        suffix={stat.isTime ? "m" : ""} 
                      />
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions - Clean cards */}
        <motion.div variants={itemVariants}>
          <h3 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colorMap: Record<string, { bg: string; text: string }> = {
                primary: { bg: "bg-primary/10", text: "text-primary" },
                accent: { bg: "bg-accent/10", text: "text-accent" },
                success: { bg: "bg-success/10", text: "text-success" },
              };
              const colors = colorMap[action.color];
              return (
                <motion.div
                  key={action.label}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Link
                    to={action.path}
                    className="block rounded-xl border border-border bg-card p-4 md:p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200 min-h-[100px] md:min-h-[120px]"
                  >
                    <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-2.5 md:mb-3`}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="text-sm md:text-base font-medium">{action.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Materials */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Materials</CardTitle>
                  <CardDescription>Continue where you left off</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/materials">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMaterials.length > 0 ? (
                  recentMaterials.map((material) => (
                    <Link
                      key={material.id}
                      to={`/materials/${material.id}`}
                      className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium mb-1">{material.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(material.updated_at), { addSuffix: true })}
                            </span>
                            {material.subject && (
                              <Badge variant="secondary" className="text-xs">
                                {material.subject}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-secondary flex items-center justify-center">
                      <FileText className="w-7 h-7 opacity-50" />
                    </div>
                    <p className="mb-3">No materials yet. Upload your first study material!</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/materials">
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Material
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Reviews */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Due for Review</CardTitle>
                <CardDescription>Spaced repetition schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingReviews.length > 0 ? (
                  upcomingReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{review.deck}</h4>
                        <p className="text-xs text-muted-foreground">
                          {review.cards} cards · {review.due}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/study/${review.id}`}>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No decks yet</p>
                  </div>
                )}

                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link to="/study">
                    Start Review Session
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Study Progress */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                  Weekly Progress
                </CardTitle>
                <CardDescription>Your study activity this week</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/progress">
                  View Details
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {(stats?.weekData || []).map((data, i) => {
                  const maxMinutes = Math.max(...(stats?.weekData || []).map(d => d.minutes), 1);
                  const height = maxMinutes > 0 ? (data.minutes / maxMinutes) * 100 : 0;
                  const isToday = i === (stats?.weekData?.length || 0) - 1;
                  return (
                    <div key={data.day} className="flex flex-col items-center gap-2">
                      <div className="w-full h-20 bg-secondary rounded-lg relative overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                          className={`absolute bottom-0 left-0 right-0 rounded-lg ${
                            isToday ? "bg-primary" : "bg-primary/40"
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {data.day}
                      </span>
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
