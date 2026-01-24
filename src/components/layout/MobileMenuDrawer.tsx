import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  BookOpen, 
  Layers, 
  Users, 
  Trophy,
  TrendingUp,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile } from "@/hooks/useProfile";
import { useGamificationProfile } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { XPProgress } from "@/components/gamification/XPProgress";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Study Materials", path: "/materials" },
  { icon: Layers, label: "Flashcards", path: "/flashcards" },
  { icon: Users, label: "Study Groups", path: "/groups" },
];

const secondaryNavItems = [
  { icon: Trophy, label: "Achievements", path: "/achievements" },
  { icon: TrendingUp, label: "Progress", path: "/progress" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

export function MobileMenuDrawer({ open, onOpenChange }: MobileMenuDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: gamificationProfile } = useGamificationProfile();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const handleNavClick = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onOpenChange(false);
    navigate("/auth");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent className="h-full w-[85vw] max-w-[320px] rounded-r-2xl rounded-l-none">
        <ScrollArea className="h-full">
          <div className="flex flex-col h-full min-h-screen pb-[env(safe-area-inset-bottom)]">
            {/* Header with profile */}
            <DrawerHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <DrawerTitle className="sr-only">Menu</DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
                    <X className="w-5 h-5" />
                  </Button>
                </DrawerClose>
              </div>
              
              <button 
                onClick={() => handleNavClick("/settings")}
                className="flex items-center gap-3 mt-2 p-2 -mx-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-display font-semibold">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Level {gamificationProfile?.level || 1}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* XP Progress */}
              <div className="mt-3">
                <XPProgress compact />
              </div>
            </DrawerHeader>

            {/* Main navigation */}
            <nav className="flex-1 py-4 px-4">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors min-h-[48px]",
                        active 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                      {active && (
                        <motion.div 
                          layoutId="menuActiveIndicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors min-h-[48px]",
                        active 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Premium CTA */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-display font-semibold">Go Premium</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Unlock all features and study smarter
                </p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleNavClick("/pricing")}
                >
                  Upgrade Now
                </Button>
              </div>
            </nav>

            {/* Bottom navigation */}
            <div className="mt-auto border-t border-border/50 py-4 px-4">
              <div className="space-y-1">
                {bottomNavItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors min-h-[48px]"
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors min-h-[48px]"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
