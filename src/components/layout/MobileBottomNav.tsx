import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  BookOpen, 
  Layers, 
  Users, 
  MoreHorizontal,
  Trophy,
  Settings,
  HelpCircle,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { haptics } from "@/lib/haptics";

const mainNavItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: BookOpen, label: "Materials", path: "/materials" },
  { icon: Layers, label: "Flashcards", path: "/flashcards" },
  { icon: Users, label: "Groups", path: "/groups" },
];

const moreNavItems = [
  { icon: Trophy, label: "Achievements", path: "/achievements", description: "View your badges and rewards" },
  { icon: Sparkles, label: "Progress", path: "/progress", description: "Track your learning journey" },
  { icon: Settings, label: "Settings", path: "/settings", description: "Customize your experience" },
  { icon: HelpCircle, label: "Help Center", path: "/help", description: "Get support and FAQs" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreNavItems.some(item => location.pathname.startsWith(item.path));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Premium glassmorphism background with gradient border */}
        <div className="absolute inset-0 bg-background/90 backdrop-blur-2xl border-t border-border/30">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
        </div>
        
        {/* Safe area padding for notched devices */}
        <div className="relative flex items-center justify-around px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => haptics.selection()}
                className="relative flex flex-col items-center justify-center min-w-[68px] min-h-[52px] py-1.5"
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
                    "relative flex items-center justify-center w-12 h-10 rounded-xl transition-colors duration-200",
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
          
          {/* More button */}
          <button
            onClick={() => {
              haptics.selection();
              setMoreOpen(true);
            }}
            className="relative flex flex-col items-center justify-center min-w-[68px] min-h-[52px] py-1.5"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="relative"
            >
              {isMoreActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -inset-2 rounded-2xl bg-primary/12"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <div className={cn(
                "relative flex items-center justify-center w-12 h-10 rounded-xl transition-colors duration-200",
                isMoreActive ? "text-primary" : "text-muted-foreground"
              )}>
                <MoreHorizontal className={cn("w-[22px] h-[22px]", isMoreActive && "scale-110")} strokeWidth={isMoreActive ? 2.5 : 2} />
              </div>
            </motion.div>
            <span className={cn(
              "text-[10px] font-medium mt-0.5 transition-colors duration-200",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Premium "More" drawer - iOS Action Sheet style */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-lg font-display">More Options</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="space-y-1">
              {moreNavItems.map((item, index) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => {
                        haptics.selection();
                        setMoreOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 active:scale-[0.98]",
                        active 
                          ? "bg-primary/10" 
                          : "hover:bg-secondary/50 active:bg-secondary"
                      )}
                    >
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                        active 
                          ? "bg-primary text-primary-foreground shadow-glow-sm" 
                          : "bg-secondary/80"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "font-semibold block",
                          active && "text-primary"
                        )}>
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}