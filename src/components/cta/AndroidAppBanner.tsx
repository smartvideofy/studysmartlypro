import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAndroidDevice, PLAY_STORE_URL } from "@/lib/device";

const DISMISS_KEY = "android_cta_dismissed_until";
const RESHOW_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AndroidAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAndroidDevice()) return;
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      const until = raw ? parseInt(raw, 10) : 0;
      if (!until || Date.now() >= until) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + RESHOW_AFTER_MS));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          role="region"
          aria-label="Studily Android app announcement"
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 sm:p-5"
        >
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base sm:text-lg font-semibold text-foreground">
                Studily is on Android
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Take your flashcards, notes, and AI study tools anywhere.
              </p>
              <div className="mt-3">
                <Button asChild size="sm">
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get it on Google Play
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
