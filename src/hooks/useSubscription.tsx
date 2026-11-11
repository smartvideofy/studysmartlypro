import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type PlanType = 'free' | 'pro' | 'team';
export type BillingInterval = 'monthly' | 'yearly';

export interface Subscription {
  id?: string;
  user_id?: string;
  plan: PlanType;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'trial';
  paystack_customer_code?: string;
  paystack_subscription_code?: string;
  plan_code?: string;
  amount?: number;
  currency?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
  billing_interval?: BillingInterval;
  trial_start_date?: string;
  trial_end_date?: string;
  trial_used?: boolean;
  is_trial?: boolean;
  trial_days_remaining?: number;
}

// Pricing (Nov 2026): no free trials. Without an active paid subscription you're on Free, which
// includes one complete study set; creating more needs Pro. The server enforces the same rule
// (process-material only counts status = 'active' subscriptions as paid).
export const FREE_STUDY_SETS = 1;

export function isPaidSubscription(subscription?: Subscription | null): boolean {
  return subscription?.status === 'active' && !!subscription.plan && subscription.plan !== 'free';
}

/** How much of the free allowance this user has used (non-failed materials). */
export function useFreeStudySetUsage() {
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const isPaid = isPaidSubscription(subscription);

  const { data: used, isLoading: countLoading } = useQuery({
    queryKey: ['free-study-set-usage', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('study_materials')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .neq('processing_status', 'failed');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user?.id && !isPaid,
    staleTime: 30_000,
  });

  return {
    isPaid,
    used: used ?? 0,
    limitReached: !isPaid && (used ?? 0) >= FREE_STUDY_SETS,
    isLoading: subLoading || (!isPaid && countLoading),
  };
}

// Blocked = a free user who has used their study set. Only gates creating new content; everything
// they already made stays available.
export function useIsBlocked() {
  const { limitReached, isLoading } = useFreeStudySetUsage();
  return { isBlocked: !isLoading && limitReached, isLoading };
}

export interface PlanFeatures {
  maxDocuments: number | 'unlimited';
  aiSummaries: boolean;
  flashcards: boolean | 'unlimited';
  practiceQuestions: boolean;
  conceptMaps: boolean;
  tutorNotes: boolean | 'advanced';
  exportAnki: boolean;
  prioritySupport: boolean;
  teamMembers?: number;
  sharedLibrary?: boolean;
  collaborativeNotes?: boolean;
  teamAnalytics?: boolean;
  adminDashboard?: boolean;
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    maxDocuments: FREE_STUDY_SETS, // One complete study set, then Pro
    aiSummaries: true,
    flashcards: 'unlimited',
    practiceQuestions: true,
    conceptMaps: true,
    tutorNotes: 'advanced',
    exportAnki: true,
    prioritySupport: false,
  },
  pro: {
    maxDocuments: 'unlimited',
    aiSummaries: true,
    flashcards: 'unlimited',
    practiceQuestions: true,
    conceptMaps: true,
    tutorNotes: 'advanced',
    exportAnki: true,
    prioritySupport: true,
  },
  team: {
    maxDocuments: 'unlimited',
    aiSummaries: true,
    flashcards: 'unlimited',
    practiceQuestions: true,
    conceptMaps: true,
    tutorNotes: 'advanced',
    exportAnki: true,
    prioritySupport: true,
    teamMembers: 5,
    sharedLibrary: true,
    collaborativeNotes: true,
    teamAnalytics: true,
    adminDashboard: true,
  },
};

export function useSubscription() {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription> => {
      if (!user?.id || !session?.access_token) {
        return { plan: 'free', status: 'active' };
      }

      try {
        // Refresh session to ensure we have a valid (non-expired) token
        const { data: refreshed } = await supabase.auth.getSession();
        const token = refreshed?.session?.access_token || session.access_token;

        const { data, error } = await supabase.functions.invoke('paystack/subscription', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (error) {
          console.error('Subscription fetch error:', error);
          // Silently fall back to free plan on error - user can still use the app
          return { plan: 'free', status: 'active' };
        }

        // Ensure we always return a valid subscription object
        if (!data?.subscription) {
          return { plan: 'free', status: 'active' };
        }

        // Free trials are discontinued: a remaining "trial" row is treated as Free everywhere.
        if (data.subscription.status === 'trial' || data.subscription.is_trial) {
          return { ...data.subscription, plan: 'free', status: 'active', is_trial: false, trial_days_remaining: 0 };
        }

        return data.subscription;
      } catch (err) {
        console.error('Subscription query error:', err);
        return { plan: 'free', status: 'active' };
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Only retry once to avoid hammering the API
  });
}

export function useInitializePayment() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      plan, 
      interval = 'monthly',
      callback_url 
    }: { 
      plan: PlanType; 
      interval?: BillingInterval;
      callback_url?: string;
    }) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('paystack/initialize', {
        body: { plan, interval, callback_url },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data.authorization_url) throw new Error('Failed to initialize payment');

      return data;
    },
    onError: (error) => {
      toast.error('Failed to initialize payment: ' + error.message);
    },
  });
}

export function useVerifyPayment() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: string) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('paystack/verify', {
        body: { reference },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(data.message || 'Subscription activated successfully!');
    },
    onError: (error) => {
      toast.error('Payment verification failed: ' + error.message);
    },
  });
}

export function useCancelSubscription() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('paystack/cancel', {
        body: {},
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(data.message || 'Subscription cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel subscription: ' + error.message);
    },
  });
}

export function usePlanFeatures() {
  const { data: subscription } = useSubscription();
  const plan = isPaidSubscription(subscription) ? subscription!.plan : 'free';
  return PLAN_FEATURES[plan];
}

export function useCanAccessFeature(feature: keyof PlanFeatures) {
  const features = usePlanFeatures();
  return !!features[feature];
}

/** Free trials are discontinued; kept so older callers compile. Always "no trial". */
export function useTrialStatus() {
  return {
    isOnTrial: false,
    trialDaysRemaining: 0,
    trialEndDate: undefined as string | undefined,
    trialExpired: false,
  };
}
