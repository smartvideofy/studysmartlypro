import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  BookOpen, 
  Layers, 
  Users, 
  MoreHorizontal,
  Trophy,
  Settings,
  HelpCircle,
  Sparkles
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
  { icon: Trophy, label: "Achievements", path: "/achievements" },
  { icon: Sparkles, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help", path: "/help" },
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
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/50" />
        
        {/* Safe area padding for notched devices */}
        <div className="relative flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => haptics.selection()}
                className="relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 active:scale-95 transition-transform"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-1 w-8 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-xl transition-colors",
                  active ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-0.5 transition-colors",
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
            className="relative flex flex-col items-center justify-center min-w-[64px] min-h-[48px] py-1 active:scale-95 transition-transform"
          >
            {isMoreActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute -top-1 w-8 h-1 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <div className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl transition-colors",
              isMoreActive ? "text-primary bg-primary/10" : "text-muted-foreground"
            )}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium mt-0.5 transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More Options</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    haptics.selection();
                    setMoreOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border transition-all min-h-[64px] active:scale-[0.97]",
                    active 
                      ? "bg-primary/10 border-primary/30 text-primary" 
                      : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
