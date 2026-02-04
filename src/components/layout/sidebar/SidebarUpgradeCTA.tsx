import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface SidebarUpgradeCTAProps {
  collapsed: boolean;
}

export function SidebarUpgradeCTA({ collapsed }: SidebarUpgradeCTAProps) {
  const { data: subscription } = useSubscription();
  
  // Only show for free users when sidebar is expanded
  if (collapsed || subscription?.plan !== 'free') {
    return null;
  }

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
          className="group block p-3 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 hover:border-primary/40 hover:from-primary/20 hover:to-accent/20 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Go Pro
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Unlock all features
          </p>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
