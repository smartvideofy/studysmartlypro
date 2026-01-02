import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Reusable motion variants
export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Spring transitions
export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
};

export const smoothTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

// Interactive button with press animation
interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
MotionButton.displayName = "MotionButton";

// Interactive card with hover lift
interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.99 }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = "MotionCard";

// Staggered children animation container
interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  staggerDelay?: number;
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay = 0.05, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          animate: {
            transition: {
              staggerChildren: staggerDelay,
            },
          },
        }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerContainer.displayName = "StaggerContainer";

// Stagger child item
interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={fadeInUp}
        transition={smoothTransition}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// Icon with hover animation
interface MotionIconProps extends HTMLMotionProps<"span"> {
  children: ReactNode;
  hoverRotate?: number;
  hoverScale?: number;
}

export const MotionIcon = forwardRef<HTMLSpanElement, MotionIconProps>(
  ({ children, className, hoverRotate = 0, hoverScale = 1.1, ...props }, ref) => {
    return (
      <motion.span
        ref={ref}
        whileHover={{ 
          scale: hoverScale, 
          rotate: hoverRotate,
          transition: { duration: 0.2 }
        }}
        className={cn("inline-flex", className)}
        {...props}
      >
        {children}
      </motion.span>
    );
  }
);
MotionIcon.displayName = "MotionIcon";

// Fade in on mount
interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay, ease: "easeOut" }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = "FadeIn";
