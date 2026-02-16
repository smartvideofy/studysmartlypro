import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, useInitializePayment, useVerifyPayment, useStartTrial, useTrialStatus, PlanType, BillingInterval } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { createSoftwareApplicationJsonLd } from '@/components/seo/jsonld';
import { cn } from '@/lib/utils';

interface PlanConfig {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings: number;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  planType: PlanType;
}

const plans: PlanConfig[] = [
  {
    name: 'Pro',
    monthlyPrice: 9,
    yearlyPrice: 90,
    yearlySavings: 18,
    description: 'Everything you need to study smarter',
    planType: 'pro',
    popular: true,
    cta: 'Subscribe Now',
    features: [
      'Unlimited documents',
      'Advanced tutor notes',
      'Unlimited flashcards',
      'Practice questions',
      'Concept maps',
      'AI chat with materials',
      'Priority support',
      'Export to Anki',
    ],
  },
  {
    name: 'Team',
    monthlyPrice: 19,
    yearlyPrice: 190,
    yearlySavings: 38,
    description: 'Perfect for study groups',
    planType: 'team',
    cta: 'Subscribe Now',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Shared study library',
      'Collaborative notes',
      'Team analytics',
      'Admin dashboard',
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const initPayment = useInitializePayment();
  const verifyPayment = useVerifyPayment();
  const startTrial = useStartTrial();
  const { isOnTrial, trialDaysRemaining, trialExpired } = useTrialStatus();
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  
  // Determine user state for messaging
  const isExpiredUser = trialExpired || (subscription?.trial_used && subscription?.plan === 'free');
  const canStartTrial = !subscription?.trial_used && !subscription?.is_trial && subscription?.plan === 'free';

  // Handle payment verification callback
  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    const verify = searchParams.get('verify');

    if ((verify || reference || trxref) && !verifyPayment.isPending) {
      const ref = reference || trxref;
      if (ref) {
        verifyPayment.mutate(ref, {
          onSuccess: () => {
            // Clear URL params
            window.history.replaceState({}, '', '/pricing');
          },
        });
      }
    }
  }, [searchParams]);

  const handleSelectPlan = async (plan: PlanConfig) => {
    if (!user) {
      navigate('/auth');
      return;
    }


    if (subscription?.plan === plan.planType && subscription?.status === 'active') {
      toast.info(`You are already subscribed to ${plan.name}`);
      return;
    }

    setProcessingPlan(plan.planType);

    try {
      const result = await initPayment.mutateAsync({
        plan: plan.planType,
        interval: billingInterval,
        callback_url: window.location.origin + '/pricing?verify=true',
      });

      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
    } finally {
      setProcessingPlan(null);
    }
  };

  // Current plan for display
  const currentPlan = subscription?.is_trial ? 'pro' : subscription?.plan;

  const pricingOffers = plans.map(plan => ({
    name: plan.name,
    price: billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice,
    description: plan.description,
    features: plan.features,
  }));

  const getDisplayPrice = (plan: PlanConfig) => {
    if (plan.monthlyPrice === 0) return 0;
    return billingInterval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getPriceSuffix = (plan: PlanConfig) => {
    return billingInterval === 'monthly' ? '/month' : '/year';
  };

  return (
    <DashboardLayout>
      <SEOHead
        title="Pricing"
        description="Choose the perfect Studily plan for your learning needs. Start free, upgrade to Pro for unlimited features. Simple, transparent pricing with no hidden fees."
        url="/pricing"
        jsonLd={createSoftwareApplicationJsonLd(pricingOffers)}
      />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isExpiredUser ? (
              <>Continue learning with <span className="text-primary">Studily</span></>
            ) : isOnTrial ? (
              <>Keep your <span className="text-primary">Pro access</span></>
            ) : (
              <>Choose your <span className="text-primary">plan</span></>
            )}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isExpiredUser 
              ? 'Your trial has ended. Subscribe to access all your materials and study tools.'
              : isOnTrial 
                ? `You have ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} left. Subscribe now to keep full access.`
                : canStartTrial
                  ? 'Start with a 7-day free trial. No credit card required.'
                  : 'All plans include everything you need to study smarter.'
            }
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10"
        >
          <div className="flex items-center gap-4">
            <span className={cn(
              "text-sm font-medium transition-colors",
              billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Monthly
            </span>
            
            <Switch
              checked={billingInterval === 'yearly'}
              onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
            />
            
            <span className={cn(
              "text-sm font-medium transition-colors",
              billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Annually
            </span>
          </div>
          
          <AnimatePresence mode="wait">
            {billingInterval === 'yearly' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 whitespace-nowrap">
                  Save up to 17%
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {verifyPayment.isPending && (
          <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-primary/10 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-primary font-medium">Verifying your payment...</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan === plan.planType;
            const isActiveSubscriber = subscription?.status === 'active' && subscription?.plan !== 'free' && !subscription?.is_trial;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  variant={plan.popular ? 'premium' : 'elevated'}
                  className={cn(
                    "relative h-full flex flex-col",
                    plan.popular && "border-primary shadow-lg shadow-primary/20 scale-105"
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    
                    {/* Animated Price Display */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${plan.name}-${billingInterval}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4"
                      >
                        <span className="text-4xl font-bold text-primary">
                          ${getDisplayPrice(plan)}
                        </span>
                        <span className="text-muted-foreground">
                          {getPriceSuffix(plan)}
                        </span>
                    {billingInterval === 'monthly' && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (billed monthly)
                      </span>
                    )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Savings Badge for Yearly */}
                    <AnimatePresence mode="wait">
                      {billingInterval === 'yearly' && plan.yearlySavings > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, height: 0 }}
                          animate={{ opacity: 1, scale: 1, height: 'auto' }}
                          exit={{ opacity: 0, scale: 0.8, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2"
                        >
                          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                            Save ${plan.yearlySavings}/year
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'hero' : 'outline'}
                      size="lg"
                      disabled={
                        subLoading ||
                        processingPlan !== null ||
                        verifyPayment.isPending ||
                        startTrial.isPending ||
                        (isActiveSubscriber && isCurrentPlan)
                      }
                      onClick={() => {
                        // If user clicks Pro and can start trial, start trial instead
                        if (plan.planType === 'pro' && canStartTrial) {
                          startTrial.mutate();
                        } else {
                          handleSelectPlan(plan);
                        }
                      }}
                    >
                      {processingPlan === plan.planType ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : startTrial.isPending && plan.planType === 'pro' ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Starting Trial...
                        </>
                    ) : isActiveSubscriber && isCurrentPlan ? (
                      'Current Plan'
                      ) : plan.planType === 'pro' && canStartTrial ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Start 7-Day Free Trial
                        </>
                    ) : isOnTrial && plan.planType === 'pro' ? (
                      'Subscribe Now'
                    ) : isExpiredUser && plan.planType === 'pro' ? (
                      'Subscribe Now'
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {subscription?.status === 'active' && subscription?.plan !== 'free' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground mb-4">
              You are currently on the{' '}
              <span className="font-semibold text-primary capitalize">
                {subscription.plan}
              </span>{' '}
              plan
              {subscription.billing_interval && (
                <Badge variant="outline" className="ml-2 capitalize">
                  {subscription.billing_interval === 'yearly' ? 'Annual' : 'Monthly'}
                </Badge>
              )}
              {subscription.current_period_end && (
                <>
                  {' '}
                  · Renews{' '}
                  {subscription.billing_interval === 'yearly' ? 'annually' : 'monthly'} on{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </>
              )}
            </p>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => navigate('/settings')}
            >
              Manage Subscription
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
