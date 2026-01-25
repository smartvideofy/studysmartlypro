import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logoImage from "@/assets/logo.png";

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
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center relative z-10"
      >
        {/* Card container */}
        <motion.div
          className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center shadow-lg"
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Logo */}
          <motion.div
            animate={{ 
              scale: [1, 1.03, 1],
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="w-20 h-20 rounded-2xl overflow-hidden mb-8 shadow-md"
          >
            <img src={logoImage} alt="Studily" className="w-full h-full object-cover" />
          </motion.div>

          {/* App Name */}
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Studily
          </h1>

          {/* Tagline */}
          <p className="text-muted-foreground text-base mb-10">
            Study Smarter, Not Harder
          </p>

          {/* Loading indicator */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [0.85, 1, 0.85],
                }}
                transition={{
                  duration: 1,
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
