import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  Brain,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Search,
  Upload,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Network,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "./GlobalSearch";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileHeader } from "./MobileHeader";
import { MobileMenuDrawer } from "./MobileMenuDrawer";
 import { SidebarNavSection, SidebarNavItem } from "./sidebar";
import { useProfile } from "@/hooks/useProfile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsBlocked } from "@/hooks/useSubscription";
import { SubscriptionBlock } from "@/components/subscription/SubscriptionBlock";
import { ExpiredTrialBanner } from "@/components/subscription/ExpiredTrialBanner";
import logoImage from "@/assets/logo.png";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { useOfflineSync } from "@/hooks/useOfflineStorage";

// Grouped navigation items
const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Study Materials", path: "/materials" },
  { icon: Layers, label: "Flashcards", path: "/flashcards" },
];

const communityNavItems = [
  { icon: Users, label: "Groups", path: "/groups" },
];

const insightsNavItems = [
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: Trophy, label: "Achievements", path: "/achievements" },
];

const studySubItems = [
  { icon: BookOpen, label: "Tutor Notes", tab: "tutor-notes" },
  { icon: FileText, label: "Summaries", tab: "summaries" },
  { icon: Lightbulb, label: "Flashcards", tab: "flashcards" },
  { icon: Brain, label: "Questions", tab: "questions" },
  { icon: Network, label: "Concept Map", tab: "concept-map" },
  { icon: MessageSquare, label: "AI Chat", tab: "chat" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  materialId?: string;
  activeStudyTab?: string;
  onStudyTabChange?: (tab: string) => void;
}

export default function DashboardLayout({ 
  children, 
  title,
  materialId,
  activeStudyTab,
  onStudyTabChange
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    // Read from localStorage on initial mount
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored === 'true';
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [studyMenuOpen, setStudyMenuOpen] = useState(!!materialId);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const isMobile = useIsMobile();
  
  // Check if user is blocked (expired trial)
  const { isBlocked, isLoading: blockLoading } = useIsBlocked();
  
  // Sync offline reviews when back online
  useOfflineSync();

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const userInitial = profile?.full_name?.charAt(0)?.toUpperCase() || "S";
  const isInMaterialWorkspace = location.pathname.startsWith("/materials/") && materialId;

  // Show block screen for expired trial users (except on pricing page)
  if (isBlocked && !blockLoading && location.pathname !== '/pricing') {
    return <SubscriptionBlock userName={profile?.full_name || undefined} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      {/* Mobile Header - Only render on mobile */}
      {isMobile && (
        <MobileHeader 
          title={title || "Studily"}
          onMenuClick={() => setMenuOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
          onUploadClick={() => navigate('/materials')}
        />
      )}

      {/* Desktop Sidebar - Only render on desktop */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 72 : 260 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex fixed left-0 top-0 bottom-0 z-40 flex-col bg-card border-r border-border"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border/30">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md"
            >
              <img src={logoImage} alt="Studily" className="w-full h-full object-cover" />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-display text-xl font-bold text-foreground"
                >
                  Studily
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* MAIN Section */}
          <SidebarNavSection label="Main" collapsed={collapsed} />
          <div className="space-y-1">
            {mainNavItems.map((item, index) => (
              <SidebarNavItem 
                key={item.path} 
                item={item} 
                collapsed={collapsed} 
                index={index}
                layoutId="activeNavMain"
              />
            ))}
          </div>

          {/* COMMUNITY Section */}
          <SidebarNavSection label="Community" collapsed={collapsed} />
          <div className="space-y-1">
            {communityNavItems.map((item, index) => (
              <SidebarNavItem 
                key={item.path} 
                item={item} 
                collapsed={collapsed} 
                index={index}
                layoutId="activeNavCommunity"
              />
            ))}
          </div>

          {/* INSIGHTS Section */}
          <SidebarNavSection label="Insights" collapsed={collapsed} />
          <div className="space-y-1">
            {insightsNavItems.map((item, index) => (
              <SidebarNavItem 
                key={item.path} 
                item={item} 
                collapsed={collapsed} 
                index={index}
                layoutId="activeNavInsights"
              />
            ))}
          </div>

          {/* Study Menu with Submenus - Shows when in material workspace */}
          {isInMaterialWorkspace && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SidebarNavSection label="Study Tools" collapsed={collapsed} />
              <button
                onClick={() => setStudyMenuOpen(!studyMenuOpen)}
                className={cn(
                  "w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                  "bg-primary/10 text-primary font-medium"
                )}
              >
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                />
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Brain className="w-5 h-5 shrink-0 text-primary" />
                </motion.div>
                <AnimatePresence>
                  {!collapsed && (
                    <>
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex-1 text-sm whitespace-nowrap overflow-hidden text-left"
                      >
                        Tools
                      </motion.span>
                      <motion.div
                        animate={{ rotate: studyMenuOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </button>

              {/* Submenus */}
              <AnimatePresence>
                {studyMenuOpen && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l border-border/50 mt-1 space-y-0.5">
                      {studySubItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = activeStudyTab === subItem.tab;
                        
                        return (
                          <motion.button
                            key={subItem.tab}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onStudyTabChange?.(subItem.tab)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                              isSubActive
                                ? "bg-primary/15 text-primary font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                          >
                            <SubIcon className={cn(
                              "w-4 h-4 shrink-0",
                              isSubActive && "text-primary"
                            )} />
                            <span>{subItem.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-border/30 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
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
                    layoutId="bottomNavActive"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "group-hover:text-primary"
                  )} />
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
          className="absolute -right-3 top-20 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all shadow-md"
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
      )}

      {/* Main Content - Responsive margins */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 relative z-10",
          // Mobile: full width with bottom padding for nav
          "pb-24 lg:pb-0",
          // Desktop: margin for sidebar
          collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        )}
      >
        {/* Desktop Header - Only render on desktop */}
        {!isMobile && (
          <header className="flex sticky top-0 z-30 h-16 items-center px-6 bg-card border-b border-border">
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
                className="flex items-center gap-2 h-10 w-64 pl-4 pr-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:border-primary/30 transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="px-2 py-1 bg-secondary/80 rounded-md text-[10px] font-mono font-medium">⌘K</kbd>
              </motion.button>

              {/* Quick Upload */}
              <Button size="sm" onClick={() => navigate('/materials')}>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </Button>

              {/* Notifications */}
              <NotificationBell />

              {/* Avatar */}
              <Link to="/settings">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Avatar className="w-9 h-9 ring-2 ring-border/50 hover:ring-primary/40 transition-all">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </Link>
            </div>
          </header>
        )}

        {/* Page Content - Responsive padding */}
        <div className="p-4 lg:p-6 relative">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Only render on mobile */}
      {isMobile && <MobileBottomNav />}

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer open={menuOpen} onOpenChange={setMenuOpen} />

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
