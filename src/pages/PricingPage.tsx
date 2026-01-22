import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, useInitializePayment, useVerifyPayment, PlanType } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { createSoftwareApplicationJsonLd } from '@/components/seo/jsonld';

interface PlanConfig {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  planType: PlanType;
}

const plans: PlanConfig[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    planType: 'free',
    cta: 'Get Started Free',
    features: [
      'Upload up to 5 documents',
      'AI-generated summaries',
      'Basic flashcards',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: 9,
    description: 'For serious students',
    planType: 'pro',
    popular: true,
    cta: 'Start Pro Trial',
    features: [
      'Unlimited documents',
      'Advanced tutor notes',
      'Unlimited flashcards',
      'Practice questions',
      'Concept maps',
      'Priority support',
      'Export to Anki',
    ],
  },
  {
    name: 'Team',
    price: 19,
    description: 'For study groups',
    planType: 'team',
    cta: 'Contact Sales',
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
  const [processingPlan, setProcessingPlan] = useState<PlanType | null>(null);

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

    if (plan.planType === 'free') {
      toast.info('You are already on the Free plan');
      return;
    }

    if (plan.planType === 'team') {
      toast.info('Please contact our sales team for Team plans');
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

  const currentPlan = subscription?.plan || 'free';

  const pricingOffers = plans.map(plan => ({
    name: plan.name,
    price: plan.price,
    description: plan.description,
    features: plan.features,
  }));

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
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent{' '}
            <span className="text-primary">pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </motion.div>

        {verifyPayment.isPending && (
          <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-primary/10 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-primary font-medium">Verifying your payment...</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentPlan === plan.planType;
            const isUpgrade = 
              (currentPlan === 'free' && (plan.planType === 'pro' || plan.planType === 'team')) ||
              (currentPlan === 'pro' && plan.planType === 'team');
            const isDowngrade =
              (currentPlan === 'team' && (plan.planType === 'pro' || plan.planType === 'free')) ||
              (currentPlan === 'pro' && plan.planType === 'free');

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  variant={plan.popular ? 'premium' : 'elevated'}
                  className={`relative h-full flex flex-col ${
                    plan.popular
                      ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-primary">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.price === 0 ? '/forever' : '/per month'}
                      </span>
                    </div>
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
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                      disabled={
                        subLoading ||
                        processingPlan !== null ||
                        verifyPayment.isPending ||
                        isCurrentPlan
                      }
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {processingPlan === plan.planType ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : isDowngrade ? (
                        'Downgrade'
                      ) : plan.planType === 'team' ? (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Contact Sales
                        </>
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
              {subscription.current_period_end && (
                <>
                  {' '}
                  · Renews on{' '}
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
