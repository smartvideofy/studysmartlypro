import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Upload, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onMenuClick?: () => void;
  onSearchOpen?: () => void;
  onUploadClick?: () => void;
  showUpload?: boolean;
  rightContent?: React.ReactNode;
  largeTitle?: boolean;
}

export function MobileHeader({ 
  title, 
  showBack = false, 
  onMenuClick,
  onSearchOpen,
  onUploadClick,
  rightContent,
  showUpload = false,
  largeTitle = false
}: MobileHeaderProps) {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  
  // Track scroll position for dynamic header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleBack = () => {
    haptics.light();
    navigate(-1);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearchOpen?.();
    }
    setSearchOpen(false);
    setSearchQuery("");
  };
  
  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <>
      <motion.header 
        className={cn(
          "sticky top-0 z-40 md:hidden transition-all duration-300",
          scrolled 
            ? "bg-background/95 backdrop-blur-sm border-b border-border" 
            : "bg-background"
        )}
        initial={false}
        animate={{
          paddingTop: scrolled ? 8 : 12,
          paddingBottom: scrolled ? 8 : 12,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Safe area padding for notched devices */}
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 gap-3">
            {/* Left Section */}
            <div className="flex items-center gap-2 min-w-0">
              {showBack ? (
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleBack}
                    className="shrink-0 -ml-2 w-10 h-10 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </motion.div>
              ) : onMenuClick ? (
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onMenuClick}
                    className="shrink-0 -ml-2 w-10 h-10 rounded-xl"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </motion.div>
              ) : (
                <Link to="/settings" className="shrink-0">
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Avatar className="w-9 h-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                </Link>
              )}
              
              {title && (
                <motion.h1 
                  className={cn(
                    "font-display font-bold truncate transition-all duration-200",
                    scrolled ? "text-lg" : (largeTitle ? "text-2xl" : "text-xl")
                  )}
                  layout
                >
                  {title}
                </motion.h1>
              )}
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-1">
              {rightContent}
              
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    haptics.selection();
                    if (onSearchOpen) {
                      onSearchOpen();
                    } else {
                      setSearchOpen(true);
                    }
                  }}
                  className="w-10 h-10 rounded-xl"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </motion.div>
              
              {showUpload && onUploadClick && (
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      haptics.selection();
                      onUploadClick();
                    }}
                    className="w-10 h-10 rounded-xl"
                  >
                    <Upload className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
              
              <NotificationBell />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-50 bg-background md:hidden"
          >
            <div className="pt-[env(safe-area-inset-top)]">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 p-4 border-b border-border/50">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 text-base rounded-xl bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                </div>
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      haptics.light();
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-10 h-10 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </motion.div>
              </form>
              
              <div className="p-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Start typing to search...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
