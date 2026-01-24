import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [canRefresh, setCanRefresh] = React.useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, PULL_THRESHOLD], [0, 1]);
  const scale = useTransform(y, [0, PULL_THRESHOLD], [0.8, 1]);
  const rotate = useTransform(y, [0, PULL_THRESHOLD, MAX_PULL], [0, 180, 360]);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);
  const isDragging = React.useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || disabled || refreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      isDragging.current = false;
      y.set(0);
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      e.preventDefault();
      const dampedDiff = Math.min(diff * 0.5, MAX_PULL);
      y.set(dampedDiff);
      
      if (dampedDiff >= PULL_THRESHOLD && !canRefresh) {
        setCanRefresh(true);
        haptics.medium();
      } else if (dampedDiff < PULL_THRESHOLD && canRefresh) {
        setCanRefresh(false);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (canRefresh && !refreshing) {
      setRefreshing(true);
      haptics.success();
      
      // Animate to loading position
      await animate(y, PULL_THRESHOLD / 2, { duration: 0.2 });
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setCanRefresh(false);
        await animate(y, 0, { duration: 0.3 });
      }
    } else {
      animate(y, 0, { duration: 0.3 });
      setCanRefresh(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ 
          y: useTransform(y, (v) => v - 48),
          opacity
        }}
      >
        <motion.div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-primary/10 backdrop-blur-sm border border-primary/20"
          )}
          style={{ scale }}
        >
          {refreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <motion.svg
              className="w-5 h-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ rotate }}
            >
              <path d="M12 5v14M5 12l7-7 7 7" />
            </motion.svg>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}
