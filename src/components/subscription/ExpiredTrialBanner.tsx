import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrialStatus } from '@/hooks/useSubscription';
import { useEffect, useState } from 'react';

export function ExpiredTrialBanner() {
  const { trialExpired } = useTrialStatus();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const key = 'expired_offer_start';
    let start = localStorage.getItem(key);
    if (!start) return;
    
    const endTime = parseInt(start) + 72 * 60 * 60 * 1000;
    
    const tick = () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) { setCountdown(''); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    };
    
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!trialExpired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-warning/15 via-warning/10 to-primary/10 border-b border-warning/20 px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap"
    >
      <Sparkles className="w-4 h-4 text-warning shrink-0" />
      <span className="text-sm font-medium text-foreground">
        Your trial ended — <span className="text-primary">30% off</span> your first month
      </span>
      {countdown && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> {countdown} left
        </span>
      )}
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
        onClick={() => navigate('/pricing')}
      >
        Subscribe <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </motion.div>
  );
}
