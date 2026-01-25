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
      {/* Clean Icon Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center">
          <Icon className="w-10 h-10 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
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
