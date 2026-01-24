import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
  colors?: string[];
  className?: string;
  onComplete?: () => void;
}

const defaultColors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(142 76% 36%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
];

export function Confetti({
  active,
  count = 50,
  duration = 3000,
  colors = defaultColors,
  className,
  onComplete,
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: i,
          x: 50 + (Math.random() - 0.5) * 20,
          y: 50,
          angle: Math.random() * 360,
          velocity: 2 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 720,
        });
      }
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, count, duration, colors, onComplete]);

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50 overflow-hidden", className)}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              rotate: particle.rotation,
              scale: 0,
            }}
            animate={{
              left: `${particle.x + Math.cos(particle.angle * Math.PI / 180) * particle.velocity * 15}%`,
              top: `${particle.y + 60 + Math.sin(particle.angle * Math.PI / 180) * particle.velocity * 5}%`,
              rotate: particle.rotation + particle.rotationSpeed,
              scale: [0, 1.2, 1, 0.8, 0],
              opacity: [0, 1, 1, 0.8, 0],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: duration / 1000,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{
              position: "absolute",
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for triggering confetti programmatically
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const fire = useCallback(() => {
    setIsActive(true);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, fire, reset };
}
