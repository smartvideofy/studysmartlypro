import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Helper function to send subscription lifecycle emails
async function sendSubscriptionEmail(
  userId: string,
  template: string,
  data: Record<string, any> = {}
) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        template,
        data,
        force: true, // Subscription emails are transactional
      }),
    });
    
    const result = await response.json();
    console.log(`Subscription email (${template}) sent to user ${userId}:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send subscription email (${template}):`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    const internalCronSecret = Deno.env.get('INTERNAL_CRON_SECRET');

    const isAuthorized =
      !!authHeader &&
      (authHeader.includes(SUPABASE_SERVICE_ROLE_KEY!) ||
        (!!cronSecret && authHeader === `Bearer ${cronSecret}`) ||
        (!!internalCronSecret && authHeader === `Bearer ${internalCronSecret}`));

    if (!isAuthorized) {
      console.log('Unauthorized cron call attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`Running subscription check at ${nowISO}`);

  // ============ LEGACY TRIAL ROWS ============
  // Free trials were discontinued on 11 Nov 2026 (Free = one study set, then Pro). Any remaining
  // `trial` rows are closed quietly: no "trial ending"/"trial ended" emails or notifications for a
  // product that no longer offers trials.
  const { data: closedTrials, error: closeTrialsError } = await supabase
    .from('subscriptions')
    .update({ plan: 'free', status: 'expired', updated_at: nowISO })
    .eq('status', 'trial')
    .select('id');
  if (closeTrialsError) {
    console.error('Failed to close legacy trial rows:', closeTrialsError);
  } else if (closedTrials && closedTrials.length > 0) {
    console.log(`Closed ${closedTrials.length} legacy trial rows`);
  }

  // ============ SUBSCRIPTION EXPIRY HANDLING ============

    // 1. Find subscriptions expiring in 3 days (for reminder emails)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    const { data: expiringSubscriptions, error: expiringError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan, current_period_end')
      .eq('status', 'active')
      .neq('plan', 'free')
      .gte('current_period_end', threeDaysStart.toISOString())
      .lte('current_period_end', threeDaysEnd.toISOString());

    if (expiringError) {
      console.error('Error fetching expiring subscriptions:', expiringError);
    } else if (expiringSubscriptions && expiringSubscriptions.length > 0) {
      console.log(`Found ${expiringSubscriptions.length} subscriptions expiring in 3 days`);
      
      for (const subscription of expiringSubscriptions) {
        const { data: existingLog } = await supabase
          .from('email_logs')
          .select('id')
          .eq('user_id', subscription.user_id)
          .eq('email_type', 'subscription_expiring')
          .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (!existingLog) {
          await sendSubscriptionEmail(subscription.user_id, 'subscription_expiring', {
            planName: subscription.plan === 'pro' ? 'Studily Pro' : 'Studily Team',
            expiryDate: new Date(subscription.current_period_end).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          });
        } else {
          console.log(`Expiry reminder already sent to user ${subscription.user_id}`);
        }
      }
    }

    // 2. Find all active subscriptions that have expired
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan, current_period_end')
      .eq('status', 'active')
      .neq('plan', 'free')
      .lt('current_period_end', nowISO);

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('No expired subscriptions found');
      return new Response(JSON.stringify({ 
        message: 'Subscription check complete',
        checked_at: nowISO,
        expiring_soon: expiringSubscriptions?.length || 0,
        expired_count: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // Downgrade each expired subscription
    const results = await Promise.allSettled(
      expiredSubscriptions.map(async (subscription) => {
        const previousPlan = subscription.plan;
        
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'expired',
            updated_at: nowISO,
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Failed to expire subscription ${subscription.id}:`, updateError);
          throw updateError;
        }

        console.log(`Expired subscription for user ${subscription.user_id} (was ${previousPlan})`);

        // Send expiration email
        await sendSubscriptionEmail(subscription.user_id, 'subscription_expired', {
          planName: previousPlan === 'pro' ? 'Studily Pro' : 'Studily Team',
          previousPlan,
        });

        // Also send in-app notification
        try {
          await supabase.from('notifications').insert({
            user_id: subscription.user_id,
            type: 'subscription_expired',
            title: 'Subscription Expired',
            message: `Your ${previousPlan} subscription has expired. Renew now to continue accessing premium features.`,
            data: { previous_plan: previousPlan },
          });
        } catch (notifError) {
          console.error('Failed to send expiry notification:', notifError);
        }

        return subscription.id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Subscription check complete: ${succeeded} expired, ${failed} failed`);

    return new Response(JSON.stringify({
      message: 'Subscription check complete',
      checked_at: nowISO,
      expiring_soon: expiringSubscriptions?.length || 0,
      expired_count: expiredSubscriptions.length,
      succeeded,
      failed,
      legacy_trials_closed: closedTrials?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-subscriptions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
