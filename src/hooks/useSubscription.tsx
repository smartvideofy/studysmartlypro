import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type PlanType = 'free' | 'pro' | 'team';

export interface Subscription {
  id?: string;
  user_id?: string;
  plan: PlanType;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
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
    maxDocuments: 5,
    aiSummaries: true,
    flashcards: true,
    practiceQuestions: false,
    conceptMaps: false,
    tutorNotes: false,
    exportAnki: false,
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
    mutationFn: async ({ plan, callback_url }: { plan: PlanType; callback_url?: string }) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('paystack/initialize', {
        body: { plan, callback_url },
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
  const plan = subscription?.plan || 'free';
  return PLAN_FEATURES[plan];
}

export function useCanAccessFeature(feature: keyof PlanFeatures) {
  const features = usePlanFeatures();
  return !!features[feature];
}
