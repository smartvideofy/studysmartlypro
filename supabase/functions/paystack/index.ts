import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Plan configuration
const PLANS = {
  pro: {
    code: 'PLN_4e8hpv8om2lbhta',
    name: 'Studily Pro',
    amount: 900, // $9 in cents
  },
  team: {
    code: 'PLN_tmqbbw7lu7rzv5i',
    name: 'Studily Team',
    amount: 1900, // $19 in cents
  },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle webhook (no auth required)
    if (path === 'webhook' && req.method === 'POST') {
      return await handleWebhook(req);
    }

    // For other endpoints, require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = req.method === 'POST' ? await req.json() : {};

    switch (path) {
      case 'initialize':
        return await initializeTransaction(user, body, supabase);
      case 'verify':
        return await verifyTransaction(user, body, supabase);
      case 'subscription':
        return await getSubscription(user, supabase);
      case 'cancel':
        return await cancelSubscription(user, supabase);
      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function initializeTransaction(user: any, body: { plan: string; callback_url?: string }, supabase: any) {
  const { plan, callback_url } = body;
  
  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const selectedPlan = PLANS[plan as keyof typeof PLANS];

  // Initialize transaction with Paystack
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: selectedPlan.amount * 100, // Paystack expects amount in kobo/cents
      plan: selectedPlan.code,
      callback_url: callback_url || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/pricing?verify=true`,
      metadata: {
        user_id: user.id,
        plan: plan,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: selectedPlan.name
          }
        ]
      }
    }),
  });

  const data = await response.json();
  console.log('Paystack initialize response:', data);

  if (!data.status) {
    return new Response(JSON.stringify({ error: data.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    authorization_url: data.data.authorization_url,
    access_code: data.data.access_code,
    reference: data.data.reference,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function verifyTransaction(user: any, body: { reference: string }, supabase: any) {
  const { reference } = body;

  if (!reference) {
    return new Response(JSON.stringify({ error: 'Reference required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify transaction with Paystack
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();
  console.log('Paystack verify response:', data);

  if (!data.status || data.data.status !== 'success') {
    return new Response(JSON.stringify({ error: 'Transaction not successful' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const txData = data.data;
  const plan = txData.metadata?.plan || 'pro';
  const selectedPlan = PLANS[plan as keyof typeof PLANS];

  // Calculate period end (30 days from now for monthly)
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  // Upsert subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      plan: plan,
      status: 'active',
      paystack_customer_code: txData.customer?.customer_code,
      paystack_subscription_code: txData.authorization?.authorization_code,
      plan_code: selectedPlan.code,
      amount: selectedPlan.amount,
      currency: 'USD',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (subError) {
    console.error('Subscription update error:', subError);
    return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    plan: plan,
    message: `Successfully subscribed to ${selectedPlan.name}`,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSubscription(user: any, supabase: any) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Get subscription error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get subscription' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    subscription: data || { plan: 'free', status: 'active' },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function cancelSubscription(user: any, supabase: any) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!sub || sub.plan === 'free') {
    return new Response(JSON.stringify({ error: 'No active subscription to cancel' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // If there's a Paystack subscription, cancel it
  if (sub.paystack_subscription_code && sub.paystack_email_token) {
    try {
      const response = await fetch(`https://api.paystack.co/subscription/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sub.paystack_subscription_code,
          token: sub.paystack_email_token,
        }),
      });
      console.log('Paystack cancel response:', await response.json());
    } catch (e) {
      console.error('Paystack cancel error:', e);
    }
  }

  // Update local subscription
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Subscription cancelled. You will retain access until the end of your billing period.',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleWebhook(req: Request) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  
  try {
    const body = await req.json();
    console.log('Paystack webhook event:', body.event, body.data);

    const event = body.event;
    const data = body.data;

    switch (event) {
      case 'subscription.create':
      case 'charge.success': {
        const userId = data.metadata?.user_id;
        const plan = data.metadata?.plan || 'pro';
        
        if (userId) {
          const periodStart = new Date();
          const periodEnd = new Date();
          periodEnd.setDate(periodEnd.getDate() + 30);

          await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: plan,
              status: 'active',
              paystack_customer_code: data.customer?.customer_code,
              paystack_subscription_code: data.subscription_code || data.authorization?.authorization_code,
              paystack_email_token: data.email_token,
              plan_code: PLANS[plan as keyof typeof PLANS]?.code,
              amount: PLANS[plan as keyof typeof PLANS]?.amount,
              currency: 'USD',
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });
        }
        break;
      }

      case 'subscription.disable':
      case 'subscription.not_renew': {
        const customerCode = data.customer?.customer_code;
        
        if (customerCode) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('paystack_customer_code', customerCode);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
