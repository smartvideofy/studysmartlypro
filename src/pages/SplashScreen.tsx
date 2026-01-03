import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate("/auth");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex items-center justify-center relative overflow-hidden">
      {/* Animated floating orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="orb orb-primary w-80 h-80 top-1/4 left-1/4"
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="orb orb-accent w-64 h-64 bottom-1/4 right-1/4"
          animate={{ 
            x: [0, -25, 0],
            y: [0, 25, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="orb orb-success w-48 h-48 top-1/2 right-1/3"
          animate={{ 
            x: [0, 20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center relative z-10"
      >
        {/* Glass card container */}
        <motion.div
          className="glass-card p-12 rounded-3xl flex flex-col items-center"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Logo */}
          <motion.div
            animate={{ 
              scale: [1, 1.08, 1],
              rotate: [0, 2, -2, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center mb-8 shadow-glow"
          >
            <BookOpen className="w-12 h-12 text-primary-foreground" />
          </motion.div>

          {/* App Name */}
          <h1 className="font-display text-5xl font-bold gradient-text mb-3">
            Studily
          </h1>

          {/* Tagline */}
          <p className="text-muted-foreground text-lg mb-10">
            Study Smarter, Not Harder
          </p>

          {/* Loading indicator */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/70"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.1, 0.8],
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
