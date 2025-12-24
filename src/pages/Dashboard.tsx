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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useNotes } from "@/hooks/useNotes";
import { useDecks, useDueCards } from "@/hooks/useFlashcards";
import { useStudyStats } from "@/hooks/useStudySessions";
import { formatDistanceToNow } from "date-fns";

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

const quickActions = [
  { icon: Plus, label: "New Note", path: "/notes/new", color: "primary" },
  { icon: Layers, label: "Create Deck", path: "/flashcards/new", color: "accent" },
  { icon: Brain, label: "Study Session", path: "/study", color: "success" },
  { icon: Sparkles, label: "AI Summary", path: "/ai", color: "primary" },
];

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: decks, isLoading: decksLoading } = useDecks();
  const { data: dueCards } = useDueCards();
  const { data: stats, isLoading: statsLoading } = useStudyStats();

  const isLoading = profileLoading || notesLoading || decksLoading || statsLoading;

  const totalCards = decks?.reduce((sum, deck) => sum + (deck.card_count || 0), 0) || 0;
  const totalDue = dueCards?.length || 0;
  const recentNotes = notes?.slice(0, 3) || [];
  
  // Calculate upcoming reviews from decks
  const upcomingReviews = decks?.slice(0, 3).map(deck => ({
    deck: deck.name,
    cards: deck.card_count || 0,
    due: "Today",
    id: deck.id
  })) || [];

  const userName = profile?.full_name?.split(' ')[0] || 'Student';
  const streakDays = 7; // TODO: Calculate from study sessions

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants}>
          <Card variant="gradient" className="overflow-hidden">
            <div className="relative p-6 md:p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <Badge variant="accent" className="mb-3">
                  <Flame className="w-3 h-3 mr-1" />
                  {streakDays} Day Streak
                </Badge>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                  Welcome back, {userName}! 👋
                </h2>
                <p className="text-muted-foreground mb-6 max-w-lg">
                  {totalDue > 0 ? (
                    <>You have <strong className="text-foreground">{totalDue} flashcards</strong> due for review today. Keep up the great work!</>
                  ) : (
                    <>You're all caught up! Create new notes or flashcards to keep learning.</>
                  )}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="hero" asChild>
                    <Link to="/study">
                      Start Studying
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/notes/new">
                      <Plus className="w-4 h-4" />
                      New Note
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { icon: FileText, label: "Total Notes", value: notes?.length || 0, color: "text-primary", bg: "bg-primary/10" },
            { icon: Layers, label: "Flashcards", value: totalCards, color: "text-accent", bg: "bg-accent/10" },
            { icon: Target, label: "Mastered", value: stats?.totalCorrect || 0, color: "text-success", bg: "bg-success/10" },
            { icon: Clock, label: "Study Time", value: `${stats?.totalTimeMinutes || 0}m`, color: "text-primary", bg: "bg-primary/10" },
          ].map((stat) => (
            <Card key={stat.label} variant="interactive">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="font-display text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h3 className="font-display text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className="group glass-card-hover rounded-xl p-4 flex flex-col items-center text-center"
                >
                  <div className={`w-12 h-12 rounded-xl bg-${action.color}/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${action.color}`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Notes */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Notes</CardTitle>
                  <CardDescription>Continue where you left off</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/notes">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentNotes.length > 0 ? (
                  recentNotes.map((note) => (
                    <Link
                      key={note.id}
                      to={`/notes/${note.id}`}
                      className="block p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium mb-1">{note.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {note.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {note.content.substring(0, 100)}...
                        </p>
                      )}
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notes yet. Create your first note!</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/notes/new">
                        <Plus className="w-4 h-4 mr-1" />
                        New Note
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Upcoming Reviews */}
          <motion.div variants={itemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Due for Review</CardTitle>
                <CardDescription>Spaced repetition schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingReviews.length > 0 ? (
                  upcomingReviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{review.deck}</h4>
                        <p className="text-xs text-muted-foreground">
                          {review.cards} cards · {review.due}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link to={`/study/${review.id}`}>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No decks yet</p>
                  </div>
                )}

                <Button variant="outline" className="w-full" asChild>
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
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Weekly Progress
                </CardTitle>
                <CardDescription>Your study activity this week</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/progress">
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                  const heights = [60, 80, 45, 90, 70, 30, 85];
                  const today = new Date().getDay();
                  const isToday = (i + 1) % 7 === today;
                  return (
                    <div key={day} className="flex flex-col items-center gap-2">
                      <div className="w-full h-24 bg-secondary rounded-lg relative overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heights[i]}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          className={`absolute bottom-0 left-0 right-0 rounded-lg ${
                            isToday ? "bg-primary" : "bg-primary/40"
                          }`}
                        />
                      </div>
                      <span className={`text-xs ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                        {day}
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
