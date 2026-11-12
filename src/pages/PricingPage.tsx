import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  useSubscription,
  useInitializePayment,
  useVerifyPayment,
  useFreeStudySetUsage,
  isPaidSubscription,
  BillingInterval,
} from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';
import { createSoftwareApplicationJsonLd } from '@/components/seo/jsonld';
import { cn } from '@/lib/utils';

// Pricing (Nov 2026): no free trial. Free = one complete study set; Pro = unlimited.
const PRO = { monthly: 9, yearly: 90, yearlySavings: 18 };

const STUDY_TOOLS = ['Tutor notes', 'Summaries', 'Flashcards', 'Practice quizzes', 'Concept maps', 'Ask AI about your material'];

const COMPARISON_ROWS: { feature: string; free: boolean | string; pro: boolean | string }[] = [
  { feature: 'Uploads (PDF, Word, slides, audio, links)', free: '1 study set', pro: 'Unlimited' },
  ...STUDY_TOOLS.map((feature) => ({ feature, free: true, pro: true })),
  { feature: 'Spaced-repetition review', free: true, pro: true },
  { feature: 'Export to Anki', free: true, pro: true },
  { feature: 'Priority support', free: false, pro: true },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { limitReached } = useFreeStudySetUsage();
  const initPayment = useInitializePayment();
  const verifyPayment = useVerifyPayment();
  const [processing, setProcessing] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const isPaid = isPaidSubscription(subscription);

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
            window.history.replaceState({}, '', '/pricing');
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const upgrade = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isPaid) {
      toast.info('You are already on Pro');
      return;
    }
    setProcessing(true);
    try {
      const result = await initPayment.mutateAsync({
        plan: 'pro',
        interval: billingInterval,
        callback_url: window.location.origin + '/pricing?verify=true',
      });
      if (result.authorization_url) window.location.href = result.authorization_url;
    } catch (error) {
      console.error('Payment initialization failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const proPrice = billingInterval === 'monthly' ? PRO.monthly : PRO.yearly;
  const suffix = billingInterval === 'monthly' ? '/month' : '/year';

  return (
    <DashboardLayout title="Pricing">
      <SEOHead
        title="Pricing"
        description="Studily is free for your first complete study set. Upgrade to Pro for unlimited uploads."
        url="/pricing"
        jsonLd={createSoftwareApplicationJsonLd([
          { name: 'Free', price: 0, description: 'One complete study set', features: STUDY_TOOLS },
          { name: 'Pro', price: proPrice, description: 'Unlimited uploads', features: ['Unlimited uploads', ...STUDY_TOOLS] },
        ])}
      />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            {isPaid ? (
              <>You're on <span className="text-primary">Pro</span></>
            ) : (
              <>Study everything with <span className="text-primary">Pro</span></>
            )}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPaid
              ? 'Unlimited uploads and every study tool.'
              : limitReached
                ? "You've used your free study set. Upgrade to turn every lecture, chapter and handout into notes, flashcards and quizzes."
                : 'Your first study set is free, with every tool. Upgrade when you want to add more.'}
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={cn('text-sm font-medium', billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground')}>
            Monthly
          </span>
          <Switch
            checked={billingInterval === 'yearly'}
            onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
            aria-label="Bill annually"
          />
          <span className={cn('text-sm font-medium', billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground')}>
            Annually
          </span>
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
            2 months free
          </Badge>
        </div>

        {verifyPayment.isPending && (
          <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-primary/10 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-primary font-medium">Verifying your payment…</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          {/* Free */}
          <Card variant="elevated" className="flex flex-col">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
              </div>
              <CardDescription className="mt-2">One complete study set</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">1 upload, with every study tool</span>
                </li>
                {STUDY_TOOLS.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" size="lg" disabled>
                {isPaid ? 'Included' : limitReached ? 'Free study set used' : 'Your current plan'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro */}
          <Card variant="premium" className="relative flex flex-col border-primary shadow-lg shadow-primary/20">
            <CardHeader className="text-center pb-2 pt-8">
              <Badge className="mx-auto mb-2 w-fit bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3" />
                Unlimited
              </Badge>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">${proPrice}</span>
                <span className="text-muted-foreground">{suffix}</span>
              </div>
              <CardDescription className="mt-2">
                {billingInterval === 'yearly' ? `Save $${PRO.yearlySavings} a year` : 'Cancel anytime'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">Unlimited uploads</span>
                </li>
                {STUDY_TOOLS.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="hero"
                size="lg"
                disabled={subLoading || processing || verifyPayment.isPending || isPaid}
                onClick={upgrade}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening checkout…
                  </>
                ) : isPaid ? (
                  'Current plan'
                ) : (
                  'Upgrade to Pro'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {isPaid && (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">
              {subscription?.billing_interval === 'yearly' ? 'Annual' : 'Monthly'} Pro plan
              {subscription?.current_period_end && <> · renews on {new Date(subscription.current_period_end).toLocaleDateString()}</>}
            </p>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/settings')}>
              Manage subscription
            </Button>
          </div>
        )}

        {/* Comparison */}
        <div className="mt-14 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6 font-display">Compare plans</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] text-sm font-medium border-b border-border bg-secondary/30">
              <div className="p-4 text-muted-foreground">Feature</div>
              <div className="p-4 w-28 sm:w-36 text-center text-muted-foreground">Free</div>
              <div className="p-4 w-28 sm:w-36 text-center text-primary font-semibold">Pro</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={cn('grid grid-cols-[1fr_auto_auto] text-sm', i < COMPARISON_ROWS.length - 1 && 'border-b border-border/50')}
              >
                <div className="p-3.5 text-foreground">{row.feature}</div>
                {(['free', 'pro'] as const).map((plan) => (
                  <div key={plan} className="p-3.5 w-28 sm:w-36 flex justify-center items-center">
                    {row[plan] === true ? (
                      <Check className="w-4 h-4 text-success" aria-label="Included" />
                    ) : row[plan] === false ? (
                      <X className="w-4 h-4 text-muted-foreground/40" aria-label="Not included" />
                    ) : (
                      <span className="text-xs font-medium text-foreground text-center">{row[plan]}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
