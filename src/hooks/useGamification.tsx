import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement_value: number;
  xp_reward: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface DailyChallenge {
  id: string;
  user_id: string;
  challenge_type: string;
  target_value: number;
  current_value: number;
  xp_reward: number;
  challenge_date: string;
  completed: boolean;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  streak_days: number;
  last_study_date: string | null;
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

// Calculate XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 1000;
}

// Calculate XP progress in current level
export function xpProgressInLevel(xp: number): { current: number; needed: number; percentage: number } {
  const level = calculateLevel(xp);
  const xpInCurrentLevel = xp - (level - 1) * 1000;
  const needed = 1000;
  return {
    current: xpInCurrentLevel,
    needed,
    percentage: Math.round((xpInCurrentLevel / needed) * 100),
  };
}

// Fetch user's gamification profile
export function useGamificationProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["gamification-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("xp, level, streak_days, last_study_date")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as GamificationProfile;
    },
    enabled: !!user?.id,
  });
}

// Fetch all achievements
export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true })
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
}

// Fetch user's earned achievements
export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user?.id,
  });
}

// Fetch today's daily challenge
export function useDailyChallenge() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["daily-challenge", user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_date", today)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as DailyChallenge | null;
    },
    enabled: !!user?.id,
  });
}

// Award XP to user
export function useAwardXP() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Get current XP
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("xp, level, streak_days, last_study_date")
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentXP = profile?.xp || 0;
      const newXP = currentXP + amount;
      const newLevel = calculateLevel(newXP);
      const leveledUp = newLevel > (profile?.level || 1);

      // Update streak
      const today = new Date().toISOString().split("T")[0];
      const lastStudy = profile?.last_study_date;
      let newStreak = profile?.streak_days || 0;
      const previousStreak = profile?.streak_days || 0;
      let streakLost = false;

      if (lastStudy !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        if (lastStudy === yesterdayStr) {
          newStreak += 1;
        } else if (lastStudy !== today) {
          // Streak was lost - only trigger email if they had a streak before
          if (previousStreak > 1) {
            streakLost = true;
          }
          newStreak = 1;
        }
      }

      // Send streak lost email if applicable
      if (streakLost && previousStreak > 1) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              user_id: user.id,
              template: "streak_lost",
              data: { previousStreak },
            },
          });
          console.log(`Streak lost email sent (previous streak: ${previousStreak})`);
        } catch (emailError) {
          console.error("Failed to send streak lost email:", emailError);
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          xp: newXP,
          level: newLevel,
          streak_days: newStreak,
          last_study_date: today,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return { newXP, newLevel, leveledUp, newStreak };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gamification-profile"] });
      
      if (data.leveledUp) {
        toast.success(`🎉 Level Up! You're now level ${data.newLevel}!`, {
          duration: 5000,
        });
      }
    },
  });
}

// Check and award achievements
export function useCheckAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const awardXP = useAwardXP();

  return useMutation({
    mutationFn: async (stats: {
      totalStudyTime: number;
      totalCards: number;
      streakDays: number;
      masteredCards: number;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Get all achievements
      const { data: achievements, error: achError } = await supabase
        .from("achievements")
        .select("*");

      if (achError) throw achError;

      // Get user's earned achievements
      const { data: earned, error: earnedError } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      if (earnedError) throw earnedError;

      const earnedIds = new Set(earned?.map((e) => e.achievement_id) || []);
      const newlyEarned: Achievement[] = [];

      for (const ach of achievements || []) {
        if (earnedIds.has(ach.id)) continue;

        let value = 0;
        switch (ach.category) {
          case "study_time":
            value = stats.totalStudyTime;
            break;
          case "cards":
            value = stats.totalCards;
            break;
          case "streaks":
            value = stats.streakDays;
            break;
          case "mastery":
            value = stats.masteredCards;
            break;
        }

        if (value >= ach.requirement_value) {
          // Award achievement
          const { error } = await supabase
            .from("user_achievements")
            .insert({
              user_id: user.id,
              achievement_id: ach.id,
            });

          if (!error) {
            newlyEarned.push(ach);
            // Award XP for achievement
            await awardXP.mutateAsync({
              amount: ach.xp_reward,
              reason: `Achievement: ${ach.name}`,
            });

            // Send achievement celebration email
            try {
              await supabase.functions.invoke("send-email", {
                body: {
                  user_id: user.id,
                  template: "achievement_earned",
                  data: {
                    achievementName: ach.name,
                    achievementDescription: ach.description,
                    achievementIcon: ach.icon,
                    xpAwarded: ach.xp_reward,
                    tier: ach.tier,
                  },
                },
              });
              console.log(`Achievement email sent for: ${ach.name}`);
            } catch (emailError) {
              console.error("Failed to send achievement email:", emailError);
            }
          }
        }
      }

      return newlyEarned;
    },
    onSuccess: (achievements) => {
      queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      
      for (const ach of achievements) {
        toast.success(`🏆 Achievement Unlocked: ${ach.name}!`, {
          description: ach.description,
          duration: 5000,
        });
      }
    },
  });
}

// Update daily challenge progress
export function useUpdateDailyChallenge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const awardXP = useAwardXP();

  return useMutation({
    mutationFn: async ({ progress }: { progress: number }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const today = new Date().toISOString().split("T")[0];

      // Get or create today's challenge
      let { data: challenge, error } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_date", today)
        .single();

      if (error && error.code === "PGRST116") {
        // Create new challenge
        const challenges = [
          { type: "study_cards", target: 50, xp: 50 },
          { type: "study_cards", target: 100, xp: 100 },
          { type: "study_time", target: 30, xp: 75 },
          { type: "accuracy", target: 80, xp: 60 },
        ];
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

        const { data: newChallenge, error: createError } = await supabase
          .from("daily_challenges")
          .insert({
            user_id: user.id,
            challenge_type: randomChallenge.type,
            target_value: randomChallenge.target,
            xp_reward: randomChallenge.xp,
            challenge_date: today,
          })
          .select()
          .single();

        if (createError) throw createError;
        challenge = newChallenge;
      }

      if (!challenge || challenge.completed) return null;

      const newValue = challenge.current_value + progress;
      const completed = newValue >= challenge.target_value;

      const { error: updateError } = await supabase
        .from("daily_challenges")
        .update({
          current_value: newValue,
          completed,
        })
        .eq("id", challenge.id);

      if (updateError) throw updateError;

      if (completed) {
        await awardXP.mutateAsync({
          amount: challenge.xp_reward,
          reason: "Daily Challenge Completed",
        });
      }

      return { ...challenge, current_value: newValue, completed };
    },
    onSuccess: (challenge) => {
      queryClient.invalidateQueries({ queryKey: ["daily-challenge"] });
      
      if (challenge?.completed) {
        toast.success("🎯 Daily Challenge Complete!", {
          description: `+${challenge.xp_reward} XP earned!`,
        });
      }
    },
  });
}
