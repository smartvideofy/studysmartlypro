import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  BookOpen, 
  Layers, 
  Users, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "Materials", path: "/materials" },
  { icon: Layers, label: "Flashcards", path: "/flashcards" },
  { icon: Users, label: "Groups", path: "/groups" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function MobileBottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Premium glassmorphism background with gradient border */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-2xl border-t border-border/30">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
      </div>
      
      {/* Safe area padding for notched devices */}
      <div className="relative flex items-center justify-around px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => haptics.selection()}
              className="relative flex flex-col items-center justify-center min-w-[60px] min-h-[52px] py-1.5"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="relative"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 rounded-2xl bg-primary/12"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <div className={cn(
                  "relative flex items-center justify-center w-11 h-9 rounded-xl transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  <Icon className={cn("w-[22px] h-[22px] transition-transform duration-200", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
                </div>
              </motion.div>
              <span className={cn(
                "text-[10px] font-medium mt-0.5 transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}