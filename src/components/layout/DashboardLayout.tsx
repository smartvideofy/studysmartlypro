import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Brain,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronRight,
  Search,
  Upload,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { useProfile } from "@/hooks/useProfile";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Study Materials", path: "/materials" },
  { icon: Layers, label: "Flashcards", path: "/flashcards" },
  { icon: Brain, label: "Study", path: "/study" },
  { icon: Users, label: "Groups", path: "/groups" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
];

const bottomNavItems = [
  { icon: CreditCard, label: "Pricing", path: "/pricing" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex">
      {/* Floating orbs for glassmorphism effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb orb-primary w-96 h-96 -top-48 -left-48 animate-orb" />
        <div className="orb orb-accent w-80 h-80 top-1/4 -right-40 animate-orb" style={{ animationDelay: '-4s' }} />
        <div className="orb orb-success w-64 h-64 bottom-20 left-1/4 animate-orb" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 bottom-0 z-40 flex flex-col glass-panel"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border/30">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-glow-sm"
            >
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-display text-xl font-bold gradient-text"
                >
                  Studily
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-primary to-primary/60"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: isActive ? 0 : 8 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className={cn(
                      "w-5 h-5 shrink-0 transition-all duration-300",
                      isActive ? "text-primary icon-glow" : "group-hover:text-primary"
                    )} />
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-border/30 space-y-1.5">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon className="w-5 h-5 shrink-0 group-hover:text-primary transition-colors" />
                </motion.div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>

        {/* Collapse Button */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-background/90 backdrop-blur-md border border-border/50 rounded-full flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all shadow-md"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </motion.button>
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 relative z-10",
          collapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center px-6 glass-panel border-b border-border/30">
          <div className="flex-1 flex items-center gap-4">
            {title && (
              <h1 className="font-display text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <motion.button
              onClick={() => setSearchOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="hidden md:flex items-center gap-2 h-10 w-64 pl-4 pr-3 rounded-xl glass-input text-sm text-muted-foreground hover:border-primary/30 transition-all"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="px-2 py-1 bg-secondary/80 rounded-md text-[10px] font-mono font-medium">⌘K</kbd>
            </motion.button>

            {/* Quick Upload */}
            <Button variant="hero" size="sm" onClick={() => navigate('/materials')} className="shadow-glow-sm">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Avatar */}
            <Link to="/settings">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Avatar className="w-9 h-9 ring-2 ring-border/50 hover:ring-primary/40 transition-all">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 relative">
          {children}
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
