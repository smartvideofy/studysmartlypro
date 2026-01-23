import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Plan configuration - amounts in USD (will be converted to cents for Paystack)
const PLANS = {
  pro: {
    code: 'PLN_4e8hpv8om2lbhta',
    name: 'Studily Pro',
    amount: 9, // $9 USD
  },
  team: {
    code: 'PLN_tmqbbw7lu7rzv5i',
    name: 'Studily Team',
    amount: 19, // $19 USD
  },
};

// Helper function to send subscription lifecycle emails
async function sendSubscriptionEmail(
  supabase: any,
  userId: string,
  template: 'subscription_welcome' | 'subscription_expiring' | 'subscription_expired',
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

// Verify Paystack webhook signature
async function verifyWebhookSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-paystack-signature');
  if (!signature || !PAYSTACK_SECRET_KEY) {
    console.error('Missing signature or secret key');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(PAYSTACK_SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle webhook (no auth required, but signature verified)
    if (path === 'webhook' && req.method === 'POST') {
      return await handleWebhook(req);
    }

    // For other endpoints, require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth header
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify token using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;
    
    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Invalid user claims' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user object from claims for compatibility
    const user = { id: userId, email: userEmail };

    // Create service role client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let body: any = {};
    if (req.method === 'POST') {
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
    }

    switch (path) {
      case 'initialize':
        return await initializeTransaction(user, body, supabaseAdmin);
      case 'verify':
        return await verifyTransaction(user, body, supabaseAdmin);
      case 'subscription':
        return await getSubscription(user, supabaseAdmin);
      case 'cancel':
        return await cancelSubscription(user, supabaseAdmin);
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

async function initializeTransaction(user: { id: string; email: string }, body: { plan: string; callback_url?: string }, supabase: any) {
  const { plan, callback_url } = body;
  
  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const selectedPlan = PLANS[plan as keyof typeof PLANS];

  // Initialize transaction with Paystack
  // Paystack expects amount in the smallest currency unit (kobo for NGN, cents for USD)
  const amountInCents = selectedPlan.amount * 100;
  
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountInCents, // Amount in cents
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

async function verifyTransaction(user: { id: string; email: string }, body: { reference: string }, supabase: any) {
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

  // Upsert subscription - store amount in cents for consistency
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      plan: plan,
      status: 'active',
      paystack_customer_code: txData.customer?.customer_code,
      paystack_subscription_code: txData.authorization?.authorization_code,
      plan_code: selectedPlan.code,
      amount: selectedPlan.amount * 100, // Store in cents
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

  // Send welcome email for new subscription
  await sendSubscriptionEmail(supabase, user.id, 'subscription_welcome', {
    planName: selectedPlan.name,
  });

  return new Response(JSON.stringify({
    success: true,
    plan: plan,
    message: `Successfully subscribed to ${selectedPlan.name}`,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSubscription(user: { id: string; email: string }, supabase: any) {
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

  // If no subscription found, return free plan
  if (!data) {
    return new Response(JSON.stringify({
      subscription: { plan: 'free', status: 'active' },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if subscription has expired
  if (data.status === 'active' && data.current_period_end) {
    const periodEnd = new Date(data.current_period_end);
    if (periodEnd < new Date()) {
      // Subscription has expired - update status
      await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({
        subscription: { ...data, status: 'expired', plan: 'free' },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // If cancelled but still in period, user keeps access
  if (data.status === 'cancelled' && data.current_period_end) {
    const periodEnd = new Date(data.current_period_end);
    if (periodEnd >= new Date()) {
      // Still in paid period, return the actual plan
      return new Response(JSON.stringify({
        subscription: { ...data, status: 'cancelled' },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Cancelled and period ended - treat as free
      return new Response(JSON.stringify({
        subscription: { ...data, plan: 'free', status: 'expired' },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({
    subscription: data,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function cancelSubscription(user: { id: string; email: string }, supabase: any) {
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
    // Read body as text for signature verification
    const bodyText = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(req, bodyText);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = JSON.parse(bodyText);
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

          const planConfig = PLANS[plan as keyof typeof PLANS];
          
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: plan,
              status: 'active',
              paystack_customer_code: data.customer?.customer_code,
              paystack_subscription_code: data.subscription_code || data.authorization?.authorization_code,
              paystack_email_token: data.email_token,
              plan_code: planConfig?.code,
              amount: planConfig ? planConfig.amount * 100 : null, // Store in cents
              currency: 'USD',
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            });
          
          if (error) {
            console.error('Webhook subscription upsert error:', error);
          } else {
            // Send welcome email for new/renewed subscription
            await sendSubscriptionEmail(supabase, userId, 'subscription_welcome', {
              planName: planConfig?.name || 'Pro',
            });
          }
        }
        break;
      }

      case 'subscription.disable':
      case 'subscription.not_renew': {
        const customerCode = data.customer?.customer_code;
        
        if (customerCode) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('paystack_customer_code', customerCode);
          
          if (error) {
            console.error('Webhook subscription cancel error:', error);
          }
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
