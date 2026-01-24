import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotificationBell from "@/components/notifications/NotificationBell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  onSearchOpen?: () => void;
  onUploadClick?: () => void;
  showUpload?: boolean;
  rightContent?: React.ReactNode;
}

export function MobileHeader({ 
  title, 
  showBack = false,
  onMenuClick,
  onSearchOpen,
  onUploadClick,
  showUpload = true,
  rightContent
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search or trigger search
      onSearchOpen?.();
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-40 md:hidden">
      {/* Safe area padding for notched devices */}
      <div className="pt-[env(safe-area-inset-top)]">
        <div className="relative">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
          
          <div className="relative flex items-center justify-between h-14 px-4">
            {/* Left side */}
            <div className="flex items-center gap-2">
              {showBack ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                  className="min-w-[44px] min-h-[44px]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              ) : onMenuClick ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onMenuClick}
                  className="min-w-[44px] min-h-[44px]"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              ) : null}
              
              <h1 className="font-display font-semibold text-lg truncate max-w-[180px]">
                {title}
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {/* Search button */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onSearchOpen ? onSearchOpen() : setSearchOpen(true)}
                className="min-w-[44px] min-h-[44px]"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Upload button */}
              {showUpload && onUploadClick && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onUploadClick}
                  className="min-w-[44px] min-h-[44px]"
                >
                  <Upload className="w-5 h-5" />
                </Button>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Custom right content */}
              {rightContent}

              {/* Avatar */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
                className="min-w-[44px] min-h-[44px]"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="pt-[env(safe-area-inset-top)]">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 p-4">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSearchOpen(false)}
                  className="min-w-[44px] min-h-[44px] shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Input
                  autoFocus
                  placeholder="Search materials, flashcards, groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-12 text-base"
                />
                {searchQuery && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="min-w-[44px] min-h-[44px] shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </form>
              
              {/* Recent searches or suggestions would go here */}
              <div className="px-4 py-2">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Type to search..." : "Recent searches"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
