import { motion } from "framer-motion";
import { 
  TrendingUp,
  Clock,
  Target,
  Flame,
  Brain,
  Trophy,
  Calendar,
  BarChart3,
  CheckCircle2,
  Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layout/DashboardLayout";

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

const weeklyData = [
  { day: "Mon", minutes: 45, cards: 32 },
  { day: "Tue", minutes: 60, cards: 48 },
  { day: "Wed", minutes: 30, cards: 22 },
  { day: "Thu", minutes: 75, cards: 55 },
  { day: "Fri", minutes: 50, cards: 38 },
  { day: "Sat", minutes: 20, cards: 15 },
  { day: "Sun", minutes: 65, cards: 42 },
];

const achievements = [
  { icon: Flame, title: "7 Day Streak", description: "Study every day for a week", unlocked: true },
  { icon: Brain, title: "Memory Master", description: "Master 100 flashcards", unlocked: true },
  { icon: Trophy, title: "Perfect Score", description: "Get 100% on a quiz", unlocked: true },
  { icon: Target, title: "Goal Crusher", description: "Complete daily goal 30 times", unlocked: false },
];

const subjectProgress = [
  { name: "Chemistry", mastered: 87, total: 120, color: "bg-primary" },
  { name: "Biology", mastered: 45, total: 85, color: "bg-success" },
  { name: "Physics", mastered: 52, total: 64, color: "bg-accent" },
  { name: "History", mastered: 98, total: 150, color: "bg-warning" },
];

export default function ProgressPage() {
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes));

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
                <p className="text-2xl font-bold font-display">12.5h</p>
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
                <p className="text-2xl font-bold font-display">282</p>
                <p className="text-xs text-muted-foreground">Cards Mastered</p>
              </div>
            </div>
          </Card>
          
          <Card variant="interactive" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">7</p>
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
                <p className="text-2xl font-bold font-display">85%</p>
                <p className="text-xs text-muted-foreground">Retention Rate</p>
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
                <div className="flex items-end justify-between gap-2 h-48">
                  {weeklyData.map((data, i) => {
                    const height = (data.minutes / maxMinutes) * 100;
                    const isToday = i === new Date().getDay() - 1;
                    
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
                  <span>Total: 5h 45m</span>
                  <span>252 cards reviewed</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subject Progress */}
          <motion.div variants={itemVariants}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-accent" />
                  Subject Progress
                </CardTitle>
                <CardDescription>Mastery by subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectProgress.map((subject) => {
                  const percentage = Math.round((subject.mastered / subject.total) * 100);
                  
                  return (
                    <div key={subject.name}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">{subject.name}</span>
                        <span className="text-muted-foreground">
                          {subject.mastered} / {subject.total}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${subject.color}`}
                        />
                      </div>
                    </div>
                  );
                })}
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
