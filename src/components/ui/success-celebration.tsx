import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessCelebrationProps {
  show: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
  variant?: "default" | "minimal" | "full";
  className?: string;
}

export function SuccessCelebration({
  show,
  title = "Success!",
  message,
  onComplete,
  variant = "default",
  className,
}: SuccessCelebrationProps) {
  if (variant === "minimal") {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={cn("flex items-center justify-center", className)}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-glow-success"
            >
              <Check className="w-6 h-6 text-success-foreground" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            if (!show) onComplete?.();
          }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
            className
          )}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative flex flex-col items-center p-8"
          >
            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 80,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 80,
                }}
                transition={{
                  delay: 0.2 + i * 0.05,
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="absolute"
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.div>
            ))}

            {/* Success ring animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [0.5, 0] }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="absolute w-24 h-24 rounded-full border-4 border-success"
            />

            {/* Main checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-glow-success mb-6"
            >
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Check className="w-10 h-10 text-success-foreground" strokeWidth={3} />
              </motion.div>
            </motion.div>

            {/* Text */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display text-2xl font-bold mb-2"
            >
              {title}
            </motion.h3>
            
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground text-center max-w-sm"
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline success checkmark for buttons
export function InlineSuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Check className="w-4 h-4" strokeWidth={3} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
