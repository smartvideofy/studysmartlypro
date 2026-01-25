import { motion } from "framer-motion";
import { Flame, Star, Zap, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  useGamificationProfile, 
  xpProgressInLevel,
  useDailyChallenge 
} from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

interface XPProgressProps {
  compact?: boolean;
}

export function XPProgress({ compact = false }: XPProgressProps) {
  const { data: profile } = useGamificationProfile();
  const { data: dailyChallenge } = useDailyChallenge();

  if (!profile) return null;

  const { current, needed, percentage } = xpProgressInLevel(profile.xp);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-sm">
          <Star className="w-4 h-4 text-warning" />
          <span className="font-bold">Lvl {profile.level}</span>
        </div>
        <Progress value={percentage} className="w-16 h-2" />
        <div className="flex items-center gap-1 text-sm">
          <Flame className="w-4 h-4 text-destructive" />
          <span className="font-medium">{profile.streak_days}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {profile.level}
          </div>
          <div>
            <p className="font-semibold">Level {profile.level}</p>
            <p className="text-sm text-muted-foreground">
              {profile.xp.toLocaleString()} XP total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {profile.streak_days > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold">{profile.streak_days}</span>
              <span className="text-sm text-muted-foreground">day streak</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress to Level {profile.level + 1}</span>
          <span className="font-medium">{current} / {needed} XP</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>

      {dailyChallenge && !dailyChallenge.completed && (
        <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Daily Challenge</span>
            </div>
            <span className="text-xs text-accent font-medium">
              +{dailyChallenge.xp_reward} XP
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {getChallengeDescription(dailyChallenge.challenge_type, dailyChallenge.target_value)}
          </p>
          <div className="flex items-center gap-2">
            <Progress 
              value={(dailyChallenge.current_value / dailyChallenge.target_value) * 100} 
              className="h-1.5 flex-1" 
            />
            <span className="text-xs text-muted-foreground">
              {dailyChallenge.current_value} / {dailyChallenge.target_value}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

function getChallengeDescription(type: string, target: number): string {
  switch (type) {
    case "study_cards":
      return `Study ${target} flashcards today`;
    case "study_time":
      return `Study for ${target} minutes today`;
    case "accuracy":
      return `Achieve ${target}% accuracy in a session`;
    default:
      return `Complete today's challenge`;
  }
}

interface AchievementBadgeProps {
  icon: string;
  name: string;
  tier: string;
  earned?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AchievementBadge({ 
  icon, 
  name, 
  tier, 
  earned = false,
  size = "md" 
}: AchievementBadgeProps) {
  const IconComponent = getIconComponent(icon);
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center transition-transform hover:scale-105",
        sizeClasses[size],
        earned ? getTierColor(tier) : "bg-muted",
        !earned && "opacity-40 grayscale"
      )}
      title={name}
    >
      <IconComponent className={cn(iconSizes[size], earned ? "text-white" : "text-muted-foreground")} />
    </div>
  );
}

function getIconComponent(icon: string) {
  switch (icon) {
    case "clock":
      return Zap;
    case "layers":
      return Star;
    case "flame":
      return Flame;
    case "award":
      return Trophy;
    default:
      return Star;
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "bronze":
      return "bg-amber-600";
    case "silver":
      return "bg-slate-500";
    case "gold":
      return "bg-yellow-500";
    case "platinum":
      return "bg-purple-500";
    default:
      return "bg-primary";
  }
}
