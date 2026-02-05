import { ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCanAccessFeature, usePlanFeatures, useSubscription, type PlanFeatures } from '@/hooks/useSubscription';

interface PremiumGateProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  featureTitle?: string;
  featureDescription?: string;
}

const FEATURE_INFO: Record<keyof PlanFeatures, { title: string; description: string; benefits: string[]; expiredDescription?: string }> = {
  maxDocuments: {
    title: 'Unlimited Documents',
    description: 'Upload and process unlimited study materials',
    benefits: ['No document limits', 'Process any file size', 'Store all your materials'],
    expiredDescription: 'Subscribe to access your uploaded study materials',
  },
  aiSummaries: {
    title: 'AI Summaries',
    description: 'Get AI-generated summaries of your materials',
    benefits: ['Quick summaries', 'Detailed breakdowns', 'Key points extraction'],
    expiredDescription: 'Subscribe to continue using AI summaries',
  },
  flashcards: {
    title: 'Unlimited Flashcards',
    description: 'Create and study unlimited flashcard decks',
    benefits: ['Spaced repetition', 'AI-generated cards', 'Unlimited decks'],
    expiredDescription: 'Subscribe to access your flashcard decks',
  },
  practiceQuestions: {
    title: 'Practice Questions',
    description: 'AI-generated practice questions for self-testing',
    benefits: ['Multiple choice questions', 'Short answer questions', 'Case-based scenarios', 'Quiz mode with scoring'],
    expiredDescription: 'Subscribe to access practice questions',
  },
  conceptMaps: {
    title: 'Interactive Concept Maps',
    description: 'Visualize relationships between concepts',
    benefits: ['Visual learning aids', 'Interactive navigation', 'See how ideas connect'],
    expiredDescription: 'Subscribe to access concept maps',
  },
  tutorNotes: {
    title: 'Advanced Tutor Notes',
    description: 'Comprehensive AI-generated study notes',
    benefits: ['Detailed explanations', 'Key definitions', 'Exam tips', 'Real-world examples'],
    expiredDescription: 'Subscribe to access tutor notes',
  },
  exportAnki: {
    title: 'Export to Anki',
    description: 'Export flashcards in Anki-compatible format',
    benefits: ['Anki integration', 'CSV/APKG export', 'Use anywhere'],
  },
  prioritySupport: {
    title: 'Priority Support',
    description: 'Get faster responses from our support team',
    benefits: ['24-hour response time', 'Direct support channel', 'Priority bug fixes'],
  },
  teamMembers: {
    title: 'Team Collaboration',
    description: 'Invite team members to collaborate',
    benefits: ['Up to 5 team members', 'Shared workspace', 'Team analytics'],
  },
  sharedLibrary: {
    title: 'Shared Library',
    description: 'Share materials across your team',
    benefits: ['Centralized materials', 'Easy sharing', 'Team access control'],
  },
  collaborativeNotes: {
    title: 'Collaborative Notes',
    description: 'Work on notes together in real-time',
    benefits: ['Real-time editing', 'Comments and suggestions', 'Version history'],
  },
  teamAnalytics: {
    title: 'Team Analytics',
    description: 'Track progress across your team',
    benefits: ['Team dashboards', 'Progress tracking', 'Performance insights'],
  },
  adminDashboard: {
    title: 'Admin Dashboard',
    description: 'Manage your team settings and permissions',
    benefits: ['User management', 'Permission controls', 'Usage reports'],
  },
};

export function PremiumGate({ 
  feature, 
  children, 
  fallback,
  featureTitle,
  featureDescription,
}: PremiumGateProps) {
  const navigate = useNavigate();
  const canAccess = useCanAccessFeature(feature);
  const { data: subscription } = useSubscription();
  
  // Check if user is in expired state
  const isExpiredUser = useMemo(() => {
    return subscription?.trial_used === true && subscription?.plan === 'free';
  }, [subscription]);
  
  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const info = FEATURE_INFO[feature] || {
    title: featureTitle || 'Premium Feature',
    description: featureDescription || 'Upgrade to unlock this feature',
    benefits: [],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center h-full min-h-[300px] p-6"
    >
      <Card className="max-w-md w-full border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-2">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                  {isExpiredUser ? 'Subscription Required' : 'Pro Feature'}
                </span>
              </div>
              <h3 className="text-xl font-bold">{info.title}</h3>
              <p className="text-muted-foreground text-sm">
                {isExpiredUser && info.expiredDescription ? info.expiredDescription : info.description}
              </p>
            </div>

            {/* Benefits */}
            {info.benefits.length > 0 && (
              <ul className="text-left space-y-2 py-4 border-t border-b border-border/50">
                {info.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <Button 
              onClick={() => navigate('/pricing')}
              variant="hero"
              className="w-full"
            >
              <Crown className="w-4 h-4 mr-2" />
              {isExpiredUser ? 'Subscribe to Access' : 'Subscribe Now'}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              {isExpiredUser 
                ? 'Your trial has ended • Subscribe to continue'
                : 'Starting at $9/month • Cancel anytime'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Badge component to indicate premium features
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 ${className}`}>
      <Crown className="w-3 h-3" />
      PRO
    </span>
  );
}

// Hook to check document limit
export function useDocumentLimit() {
  const features = usePlanFeatures();
  
  return {
    maxDocuments: features.maxDocuments,
    isUnlimited: features.maxDocuments === 'unlimited',
  };
}
