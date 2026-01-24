import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className,
  suffix = "",
  prefix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.32, 0.72, 0, 1], // Custom ease for premium feel
      onUpdate: (latest) => {
        setDisplayValue(Number(latest.toFixed(decimals)));
      },
    });

    prevValue.current = value;

    return () => controls.stop();
  }, [value, duration, decimals, motionValue]);

  return (
    <motion.span
      className={cn("tabular-nums font-display", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </motion.span>
  );
}

// Compact version for inline use
interface CompactCounterProps {
  value: number;
  className?: string;
}

export function CompactCounter({ value, className }: CompactCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={cn("tabular-nums", className)}>
      {count.toLocaleString()}
    </span>
  );
}
