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
    // This function can be called by:
    // 1. Supabase cron job (pg_cron)
    // 2. External cron service
    // 3. Manual invocation for testing

    // Optional: Verify a shared secret for external cron calls
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    // If CRON_SECRET is set, verify it (for external cron services)
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Also allow service role key for internal calls
      if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY!)) {
        console.log('Unauthorized cron call attempt');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`Running subscription check at ${nowISO}`);

  // ============ TRIAL DRIP SEQUENCE ============

  // Trial Day 1: started yesterday
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const oneDayStart = new Date(oneDayAgo); oneDayStart.setHours(0, 0, 0, 0);
  const oneDayEnd = new Date(oneDayAgo); oneDayEnd.setHours(23, 59, 59, 999);

  const { data: day1Trials } = await supabase
    .from('subscriptions')
    .select('id, user_id, trial_end_date')
    .eq('status', 'trial')
    .gte('trial_start_date', oneDayStart.toISOString())
    .lte('trial_start_date', oneDayEnd.toISOString());

  if (day1Trials && day1Trials.length > 0) {
    console.log(`Found ${day1Trials.length} trials for day 1 email`);
    for (const trial of day1Trials) {
      const { data: existingLog } = await supabase
        .from('email_logs').select('id')
        .eq('user_id', trial.user_id).eq('template_name', 'trial_day1').limit(1).single();
      if (!existingLog) {
        await sendSubscriptionEmail(trial.user_id, 'trial_day1', {});
      }
    }
  }

  // Trial Day 3: started 3 days ago
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDayStart = new Date(threeDaysAgo); threeDayStart.setHours(0, 0, 0, 0);
  const threeDayEnd = new Date(threeDaysAgo); threeDayEnd.setHours(23, 59, 59, 999);

  const { data: day3Trials } = await supabase
    .from('subscriptions')
    .select('id, user_id, trial_end_date')
    .eq('status', 'trial')
    .gte('trial_start_date', threeDayStart.toISOString())
    .lte('trial_start_date', threeDayEnd.toISOString());

  if (day3Trials && day3Trials.length > 0) {
    console.log(`Found ${day3Trials.length} trials for day 3 email`);
    for (const trial of day3Trials) {
      const { data: existingLog } = await supabase
        .from('email_logs').select('id')
        .eq('user_id', trial.user_id).eq('template_name', 'trial_day3').limit(1).single();
      if (!existingLog) {
        // Get user stats for personalization
        const { data: materials } = await supabase
          .from('study_materials').select('id').eq('user_id', trial.user_id);
        const { data: flashcards } = await supabase
          .from('material_flashcards').select('id').eq('user_id', trial.user_id);
        const { data: profile } = await supabase
          .from('profiles').select('xp').eq('user_id', trial.user_id).single();

        await sendSubscriptionEmail(trial.user_id, 'trial_day3', {
          materialsCount: materials?.length || 0,
          flashcardsCount: flashcards?.length || 0,
          xpEarned: profile?.xp || 0,
          trialEndDate: trial.trial_end_date ? new Date(trial.trial_end_date).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          }) : 'in 4 days',
        });
      }
    }
  }

  // ============ TRIAL EXPIRY HANDLING ============
  
  // Find trials expiring in 2 days (for reminder emails)
  const twoDaysFromNow = new Date(now);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const twoDaysStart = new Date(twoDaysFromNow);
  twoDaysStart.setHours(0, 0, 0, 0);
  const twoDaysEnd = new Date(twoDaysFromNow);
  twoDaysEnd.setHours(23, 59, 59, 999);

  const { data: expiringTrials, error: expiringTrialsError } = await supabase
    .from('subscriptions')
    .select('id, user_id, trial_end_date')
    .eq('status', 'trial')
    .gte('trial_end_date', twoDaysStart.toISOString())
    .lte('trial_end_date', twoDaysEnd.toISOString());

  if (expiringTrialsError) {
    console.error('Error fetching expiring trials:', expiringTrialsError);
  } else if (expiringTrials && expiringTrials.length > 0) {
    console.log(`Found ${expiringTrials.length} trials expiring in 2 days`);

    for (const trial of expiringTrials) {
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', trial.user_id)
        .eq('email_type', 'trial_ending')
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (!existingLog) {
        await sendSubscriptionEmail(trial.user_id, 'trial_ending', {
          daysRemaining: 2,
          trialEndDate: new Date(trial.trial_end_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        });
      } else {
        console.log(`Trial ending reminder already sent to user ${trial.user_id}`);
      }
    }
  }

  // Find and expire all ended trials
  const { data: expiredTrials, error: expiredTrialsError } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('status', 'trial')
    .lt('trial_end_date', nowISO);

  if (expiredTrialsError) {
    console.error('Error fetching expired trials:', expiredTrialsError);
  } else if (expiredTrials && expiredTrials.length > 0) {
    console.log(`Found ${expiredTrials.length} expired trials`);

    for (const trial of expiredTrials) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'expired',
          updated_at: nowISO,
        })
        .eq('id', trial.id);

      if (updateError) {
        console.error(`Failed to expire trial ${trial.id}:`, updateError);
      } else {
        console.log(`Expired trial for user ${trial.user_id}`);
        
        await sendSubscriptionEmail(trial.user_id, 'trial_expired' as any, {});

        // Also send in-app notification
        try {
          await supabase.from('notifications').insert({
            user_id: trial.user_id,
            type: 'trial_expired',
            title: 'Trial Ended',
            message: 'Your Pro trial has ended. Subscribe now to continue using premium features.',
            data: {},
          });
        } catch (notifError) {
          console.error('Failed to send trial expiry notification:', notifError);
        }
      }
    }
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
      
      // Check if we already sent an expiry reminder (using email_logs)
      for (const subscription of expiringSubscriptions) {
        const { data: existingLog } = await supabase
          .from('email_logs')
          .select('id')
          .eq('user_id', subscription.user_id)
          .eq('email_type', 'subscription_expiring')
          .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (!existingLog) {
          // Send expiry reminder
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
      trials_expiring_soon: expiringTrials?.length || 0,
      trials_expired: expiredTrials?.length || 0,
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
