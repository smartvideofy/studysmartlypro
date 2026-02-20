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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Clean background */}
      <div className="absolute inset-0 bg-background border-t border-border" />
      
      {/* Safe area padding for notched devices */}
      <div className="relative flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => haptics.selection()}
              className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="relative"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-8 rounded-lg transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}>
                  <Icon className={cn("w-5 h-5", active && "scale-105")} strokeWidth={active ? 2.5 : 2} />
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
