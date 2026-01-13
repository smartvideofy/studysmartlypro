import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    const now = new Date().toISOString();

    console.log(`Running subscription expiry check at ${now}`);

    // Find all active subscriptions that have expired
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan, current_period_end')
      .eq('status', 'active')
      .neq('plan', 'free')
      .lt('current_period_end', now);

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
        message: 'No expired subscriptions found',
        checked_at: now,
        expired_count: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

    // Downgrade each expired subscription
    const results = await Promise.allSettled(
      expiredSubscriptions.map(async (subscription) => {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'expired',
            updated_at: now,
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error(`Failed to expire subscription ${subscription.id}:`, updateError);
          throw updateError;
        }

        console.log(`Expired subscription for user ${subscription.user_id} (was ${subscription.plan})`);

        // Optionally send a notification to the user
        try {
          await supabase.from('notifications').insert({
            user_id: subscription.user_id,
            type: 'subscription_expired',
            title: 'Subscription Expired',
            message: `Your ${subscription.plan} subscription has expired. Renew now to continue accessing premium features.`,
            data: { previous_plan: subscription.plan },
          });
        } catch (notifError) {
          console.error('Failed to send expiry notification:', notifError);
        }

        return subscription.id;
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Subscription expiry check complete: ${succeeded} succeeded, ${failed} failed`);

    return new Response(JSON.stringify({
      message: 'Subscription expiry check complete',
      checked_at: now,
      expired_count: expiredSubscriptions.length,
      succeeded,
      failed,
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
