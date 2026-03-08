import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, BookOpen, Brain, Layers, Crown, Mail, Check, X, Sparkles, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logoImage from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionBlockProps {
  userName?: string;
}

interface UserStats {
  materials: number;
  flashcardDecks: number;
  notebooks: number;
}

function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({ materials: 0, flashcardDecks: 0, notebooks: 0 });

  useEffect(() => {
    if (!user?.id) return;
    
    Promise.all([
      supabase.from('study_materials').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('flashcard_decks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('notebooks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([materials, decks, notebooks]) => {
      setStats({
        materials: materials.count || 0,
        flashcardDecks: decks.count || 0,
        notebooks: notebooks.count || 0,
      });
    });
  }, [user?.id]);

  return stats;
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const key = 'expired_offer_start';
    let start = localStorage.getItem(key);
    if (!start) {
      start = Date.now().toString();
      localStorage.setItem(key, start);
    }
    
    const endTime = parseInt(start) + 72 * 60 * 60 * 1000;
    
    const tick = () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        setTimeLeft('');
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return timeLeft;
}

const COMPARISON_FEATURES = [
  { label: 'Study Materials', free: false, pro: true },
  { label: 'AI Summaries', free: false, pro: true },
  { label: 'Flashcards', free: false, pro: true },
  { label: 'Practice Questions', free: false, pro: true },
  { label: 'Concept Maps', free: false, pro: true },
  { label: 'AI Chat', free: false, pro: true },
  { label: 'Priority Support', free: false, pro: true },
];

export function SubscriptionBlock({ userName }: SubscriptionBlockProps) {
  const navigate = useNavigate();
  const stats = useUserStats();
  const countdown = useCountdown();
  const totalItems = stats.materials + stats.flashcardDecks + stats.notebooks;
  
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl my-8"
      >
        <Card className="border-primary/20 shadow-xl bg-gradient-to-br from-background to-primary/5">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center space-y-6">
              {/* Logo */}
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-lg"
              >
                <img src={logoImage} alt="Studily" className="w-full h-full object-cover" />
              </motion.div>
              
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold font-display">
                  Your trial has ended
                </h1>
                <p className="text-muted-foreground">
                  {userName ? `Thanks for trying Studily, ${userName}!` : 'Thanks for trying Studily!'} 
                  {' '}Subscribe to keep everything you've built.
                </p>
              </div>

              {/* Special Offer Banner */}
              {countdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-5 h-5 text-warning flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">Welcome back offer: 30% off</span>
                    <span className="text-muted-foreground"> your first month</span>
                  </div>
                  <Badge variant="outline" className="border-warning/40 text-warning shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {countdown}
                  </Badge>
                </motion.div>
              )}

              {/* Personalized Stats */}
              {totalItems > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { label: 'Materials', count: stats.materials, icon: BookOpen },
                    { label: 'Decks', count: stats.flashcardDecks, icon: Layers },
                    { label: 'Notebooks', count: stats.notebooks, icon: Brain },
                  ].map(({ label, count, icon: Icon }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                      <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                      <div className="text-lg font-bold font-display text-foreground">{count}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Mini Feature Comparison */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 text-xs font-medium border-b border-border">
                  <div className="p-2.5 text-left text-muted-foreground">Feature</div>
                  <div className="p-2.5 text-center text-muted-foreground">Free</div>
                  <div className="p-2.5 text-center text-primary font-semibold">Pro</div>
                </div>
                {COMPARISON_FEATURES.map((feat, i) => (
                  <div key={feat.label} className={`grid grid-cols-3 text-sm ${i < COMPARISON_FEATURES.length - 1 ? 'border-b border-border/50' : ''}`}>
                    <div className="p-2.5 text-left text-foreground">{feat.label}</div>
                    <div className="p-2.5 flex justify-center">
                      <X className="w-4 h-4 text-destructive/60" />
                    </div>
                    <div className="p-2.5 flex justify-center">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/pricing')}
                  variant="hero"
                  size="lg"
                  className="w-full"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {countdown ? 'Claim 30% Off' : 'Choose a Plan'}
                </Button>
                
                <Button 
                  onClick={() => navigate('/pricing')}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                >
                  View all plans & features
                </Button>
              </div>
              
              {/* Support */}
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Mail className="w-3 h-3" />
                Questions? <a href="mailto:support@getstudily.com" className="text-primary hover:underline">Contact support</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
