import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFreeStudySetUsage } from '@/hooks/useSubscription';

/**
 * Shown to free users who have used their one study set. (File name kept for the layout import;
 * free trials are discontinued, so there is no "trial ended" state any more.)
 */
export function ExpiredTrialBanner() {
  const { limitReached } = useFreeStudySetUsage();
  const navigate = useNavigate();

  if (!limitReached) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-primary/15 px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
      <Sparkles className="w-4 h-4 text-primary shrink-0" />
      <span className="text-sm font-medium text-foreground">
        You've used your free study set. Go Pro for unlimited uploads.
      </span>
      <Button size="sm" className="h-7 text-xs" onClick={() => navigate('/pricing')}>
        Upgrade <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}
