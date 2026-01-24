import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  variant?: "default" | "minimal" | "illustrated";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      {/* Animated Icon Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative mb-6"
      >
        {/* Decorative rings */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.05, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
        />
        
        {/* Main icon container */}
        <motion.div
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-soft"
        >
          <Icon className="w-9 h-9 text-muted-foreground/70" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="font-display text-xl font-semibold mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="text-muted-foreground max-w-sm mb-6"
      >
        {description}
      </motion.p>

      {/* Action button */}
      {(actionLabel && (actionPath || onAction)) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button
            variant="default"
            onClick={onAction}
            asChild={!!actionPath}
          >
            {actionPath ? (
              <a href={actionPath}>{actionLabel}</a>
            ) : (
              actionLabel
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Minimal variant for smaller spaces
export function EmptyStateMinimal({
  icon: Icon,
  message,
  className,
}: {
  icon: LucideIcon;
  message: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center py-8 text-muted-foreground",
        className
      )}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Icon className="w-8 h-8 mb-2 opacity-50" strokeWidth={1.5} />
      </motion.div>
      <p className="text-sm">{message}</p>
    </motion.div>
  );
}
