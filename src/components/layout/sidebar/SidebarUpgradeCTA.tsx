import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useFreeStudySetUsage } from "@/hooks/useSubscription";

interface SidebarUpgradeCTAProps {
  collapsed: boolean;
}

export function SidebarUpgradeCTA({ collapsed }: SidebarUpgradeCTAProps) {
  const { isPaid, limitReached, isLoading } = useFreeStudySetUsage();

  if (collapsed || isLoading || isPaid) return null;

  return (
    <div className="mx-3 mb-3">
      <Link
        to="/pricing"
        className="group block p-3 rounded-xl border bg-gradient-to-br from-primary/15 to-accent/15 border-primary/20 hover:border-primary/40 transition-colors"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            Upgrade to Pro
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {limitReached ? "Free study set used: unlock unlimited uploads" : "Unlimited uploads, $9/month"}
        </p>
      </Link>
    </div>
  );
}
