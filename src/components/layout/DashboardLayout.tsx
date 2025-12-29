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
  ChevronLeft,
  ChevronRight,
  Search,
  Upload
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-0 bottom-0 z-40 bg-sidebar border-r border-sidebar-border flex flex-col"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-display text-xl font-bold"
                >
                  Studily
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
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
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
              >
                <Icon className="w-5 h-5 shrink-0" />
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
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-200",
          collapsed ? "ml-[72px]" : "ml-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border h-16 flex items-center px-6">
          <div className="flex-1 flex items-center gap-4">
            {title && (
              <h1 className="font-display text-xl font-semibold">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 h-9 w-64 pl-3 pr-2 rounded-lg bg-secondary text-sm text-muted-foreground hover:bg-secondary/80 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd>
            </button>

            {/* Quick Upload */}
            <Button variant="hero" size="sm" onClick={() => navigate('/materials')}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Material</span>
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Avatar */}
            <Link to="/settings">
              <Avatar className="w-8 h-8 hover:ring-2 hover:ring-primary/20 transition-all">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
