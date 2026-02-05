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

// Check if user should be blocked (expired trial, no active subscription)
export function useIsBlocked() {
  const { data: subscription, isLoading } = useSubscription();
  
  if (isLoading || !subscription) {
    return { isBlocked: false, isLoading: true };
  }
  
  // Active paid subscribers - not blocked
  if (subscription.status === 'active' && subscription.plan !== 'free') {
    return { isBlocked: false, isLoading: false };
  }
  
  // Users on trial - not blocked
  if (subscription.is_trial) {
    return { isBlocked: false, isLoading: false };
  }
  
  // Trial used and expired, or cancelled subscription - blocked
  const isBlocked = subscription.trial_used === true && subscription.plan === 'free';
  
  return { isBlocked, isLoading: false };
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
    maxDocuments: 'unlimited', // Same as Pro - trial model
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
        const { data, error } = await supabase.functions.invoke('paystack/subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
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
  // If on trial, treat as 'pro' for feature access
  const plan = subscription?.is_trial ? 'pro' : (subscription?.plan || 'free');
  return PLAN_FEATURES[plan];
}

export function useCanAccessFeature(feature: keyof PlanFeatures) {
  const features = usePlanFeatures();
  return !!features[feature];
}

export function useStartTrial() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('paystack/start-trial', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success(data.message || 'Trial started! Enjoy 7 days of Pro features.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start trial');
    },
  });
}

export function useTrialStatus() {
  const { data: subscription } = useSubscription();

  if (!subscription?.is_trial) {
    return {
      isOnTrial: false,
      trialDaysRemaining: 0,
      trialEndDate: undefined,
      trialExpired: subscription?.trial_used && subscription?.plan === 'free',
    };
  }

  return {
    isOnTrial: true,
    trialDaysRemaining: subscription.trial_days_remaining || 0,
    trialEndDate: subscription.trial_end_date,
    trialExpired: false,
  };
}
