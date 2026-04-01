import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, AlertCircle } from "lucide-react";
import { useSubscription, useTrialStatus } from "@/hooks/useSubscription";

interface SidebarUpgradeCTAProps {
  collapsed: boolean;
}

export function SidebarUpgradeCTA({ collapsed }: SidebarUpgradeCTAProps) {
  const { data: subscription } = useSubscription();
  const { isOnTrial, trialDaysRemaining, trialExpired } = useTrialStatus();
  
  // Only show when sidebar is expanded
  if (collapsed) {
    return null;
  }

  // Don't show for active paid subscribers
  if (subscription?.status === 'active' && subscription?.plan !== 'free' && !subscription?.is_trial) {
    return null;
  }

  // Determine the display state
  const isTrialActive = isOnTrial && trialDaysRemaining > 0;
  const isExpired = trialExpired || (subscription?.trial_used && subscription?.plan === 'free');

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="mx-3 mb-3"
      >
        <Link
          to="/pricing"
          className={`group block p-3 rounded-xl border transition-all duration-300 ${
            isExpired 
              ? 'bg-gradient-to-br from-destructive/10 to-orange-500/10 border-destructive/30 hover:border-destructive/50'
              : 'bg-gradient-to-br from-primary/15 to-accent/15 border-primary/20 hover:border-primary/40 hover:from-primary/20 hover:to-accent/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isExpired ? (
              <>
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">
                  Subscribe
                </span>
              </>
            ) : isTrialActive ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="w-4 h-4 text-amber-500" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground">
                  {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left
                </span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Start Free Trial
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isExpired 
              ? 'Access paused - subscribe now' 
              : isTrialActive 
                ? 'Subscribe to continue access'
                : '3 days free, then $9/month'
            }
          </p>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
