import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

type BillingInterval = 'monthly' | 'yearly';

const PLANS: Record<string, Record<BillingInterval, { code: string; name: string; amount: number }>> = {
  pro: {
    monthly: { code: 'PLN_4e8hpv8om2lbhta', name: 'Getstudily Pro (Monthly)', amount: 9 },
    yearly: { code: 'PLN_7mvshbtqgnmuygy', name: 'Getstudily Pro (Yearly)', amount: 90 },
  },
  team: {
    monthly: { code: 'PLN_tmqbbw7lu7rzv5i', name: 'Getstudily Team (Monthly)', amount: 19 },
    yearly: { code: 'PLN_lgfih0x6mwrycyf', name: 'Getstudily Team (Yearly)', amount: 190 },
  },
};

async function reconcileOne(supabase: any, attempt: any): Promise<'recovered' | 'still_pending' | 'failed' | 'skipped'> {
  const ref = attempt.paystack_reference;
  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${ref}`, {
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();
    console.log(`[Reconcile] ${ref} -> paystack status:`, data?.data?.status);

    if (!data.status || data.data?.status !== 'success') {
      if (data.data?.status === 'failed' || data.data?.status === 'abandoned') {
        await supabase
          .from('payment_attempts')
          .update({ status: 'failed', completed_at: new Date().toISOString() })
          .eq('id', attempt.id)
          .eq('status', 'pending');
        return 'failed';
      }
      return 'still_pending';
    }

    // Atomically claim the row
    const { data: claimed, error: claimErr } = await supabase
      .from('payment_attempts')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', attempt.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();

    if (claimErr || !claimed) {
      console.log(`[Reconcile] ${ref} already claimed by another process`);
      return 'skipped';
    }

    const tx = data.data;
    const plan: string = tx.metadata?.plan || attempt.plan || 'pro';
    const interval: BillingInterval = (tx.metadata?.interval || attempt.billing_interval || 'monthly') as BillingInterval;
    const userId: string = tx.metadata?.user_id || attempt.user_id;

    const planConfig = PLANS[plan];
    const selectedPlan = planConfig?.[interval];

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + (interval === 'yearly' ? 365 : 30));

    const { error: subErr } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: plan,
        status: 'active',
        paystack_customer_code: tx.customer?.customer_code,
        paystack_subscription_code: tx.authorization?.authorization_code,
        plan_code: selectedPlan?.code,
        amount: selectedPlan ? selectedPlan.amount * 100 : null,
        currency: 'USD',
        billing_interval: interval,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (subErr) {
      console.error(`[Reconcile] ${ref} subscription upsert failed:`, subErr);
      return 'still_pending';
    }

    console.log(`[Reconcile] ${ref} RECOVERED user ${userId} -> ${plan} ${interval}`);
    return 'recovered';
  } catch (err) {
    console.error(`[Reconcile] ${ref} error:`, err);
    return 'still_pending';
  }
}

/**
 * Sync one active subscription with Paystack.
 * Pulls /customer/{code}, finds the most relevant subscription, and updates
 * current_period_end (from next_payment_date) + status (entitlement).
 */
async function syncSubscription(supabase: any, sub: any): Promise<'synced' | 'expired' | 'cancelled' | 'unchanged' | 'error'> {
  const customerCode = sub.paystack_customer_code;
  if (!customerCode) return 'unchanged';

  try {
    const res = await fetch(`https://api.paystack.co/customer/${customerCode}`, {
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();
    if (!data.status) {
      console.warn(`[SyncSub] ${customerCode} paystack lookup failed:`, data?.message);
      return 'error';
    }

    const subscriptions: any[] = data.data?.subscriptions || [];
    if (subscriptions.length === 0) {
      // No Paystack subscription found → if our period_end has passed, expire
      if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
        await supabase
          .from('subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('user_id', sub.user_id);
        console.log(`[SyncSub] ${sub.user_id} expired (no Paystack sub, period ended)`);
        return 'expired';
      }
      return 'unchanged';
    }

    // Pick the matching plan_code if possible, else most recent
    const matched = subscriptions.find((s) => s.plan?.plan_code === sub.plan_code) || subscriptions[0];
    const paystackStatus: string = matched.status; // active | non-renewing | attention | cancelled | completed
    const nextPayment: string | null = matched.next_payment_date || null;

    // Map Paystack status -> our entitlement status
    let newStatus = sub.status;
    if (paystackStatus === 'active' || paystackStatus === 'attention' || paystackStatus === 'non-renewing') {
      newStatus = 'active';
    } else if (paystackStatus === 'cancelled' || paystackStatus === 'completed') {
      // Keep active until period_end passes, then expire
      const stillInPeriod = sub.current_period_end && new Date(sub.current_period_end) > new Date();
      newStatus = stillInPeriod ? 'cancelled' : 'expired';
    }

    const updates: Record<string, any> = {
      status: newStatus,
      paystack_subscription_code: matched.subscription_code || sub.paystack_subscription_code,
      updated_at: new Date().toISOString(),
    };

    // Sync period end from Paystack's authoritative next_payment_date
    if (nextPayment) {
      updates.current_period_end = new Date(nextPayment).toISOString();
    } else if (newStatus === 'expired') {
      updates.current_period_end = updates.current_period_end || new Date().toISOString();
    }

    if (newStatus !== 'active' && newStatus !== sub.status) {
      updates.cancelled_at = updates.cancelled_at || new Date().toISOString();
    }

    // Only write if something actually changed
    const periodChanged = nextPayment && new Date(nextPayment).toISOString() !== sub.current_period_end;
    const statusChanged = newStatus !== sub.status;
    if (!periodChanged && !statusChanged) return 'unchanged';

    const { error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', sub.user_id);

    if (error) {
      console.error(`[SyncSub] ${sub.user_id} update error:`, error);
      return 'error';
    }

    console.log(`[SyncSub] ${sub.user_id} synced: status=${newStatus} period_end=${updates.current_period_end || 'unchanged'} (paystack=${paystackStatus})`);
    if (newStatus === 'expired') return 'expired';
    if (newStatus === 'cancelled' && statusChanged) return 'cancelled';
    return 'synced';
  } catch (err) {
    console.error(`[SyncSub] ${customerCode} error:`, err);
    return 'error';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const startedAt = Date.now();

  try {
    // ---------- Pass 1: recover stuck initial payments ----------
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: pending, error } = await supabase
      .from('payment_attempts')
      .select('id, user_id, plan, billing_interval, paystack_reference, created_at')
      .eq('status', 'pending')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const payResults = { checked: pending?.length || 0, recovered: 0, still_pending: 0, failed: 0, skipped: 0 };
    for (const attempt of pending || []) {
      const r = await reconcileOne(supabase, attempt);
      payResults[r]++;
    }

    // ---------- Pass 2: sync recurring subscriptions with Paystack ----------
    // Pull all paid subs (active or cancelled-but-still-in-period) that have a Paystack customer.
    // Skip free + trial rows.
    const { data: subs, error: subsErr } = await supabase
      .from('subscriptions')
      .select('user_id, plan, status, plan_code, paystack_customer_code, paystack_subscription_code, current_period_end')
      .neq('plan', 'free')
      .in('status', ['active', 'cancelled', 'past_due'])
      .not('paystack_customer_code', 'is', null)
      .limit(500);

    if (subsErr) throw subsErr;

    const subResults = { checked: subs?.length || 0, synced: 0, expired: 0, cancelled: 0, unchanged: 0, error: 0 };
    for (const sub of subs || []) {
      const r = await syncSubscription(supabase, sub);
      subResults[r]++;
    }

    const elapsedMs = Date.now() - startedAt;
    console.log(`[Reconcile] Run complete in ${elapsedMs}ms. Payments:`, payResults, 'Subscriptions:', subResults);

    return new Response(JSON.stringify({
      success: true,
      payments: payResults,
      subscriptions: subResults,
      elapsed_ms: elapsedMs,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Reconcile] Fatal error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
