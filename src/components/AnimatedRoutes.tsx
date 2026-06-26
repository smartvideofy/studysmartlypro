import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";

// Eager: tiny + first paint
import SplashScreen from "@/pages/SplashScreen";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import SitemapRedirect from "@/pages/SitemapRedirect";

// Lazy: everything else
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const StudyMaterialsPage = lazy(() => import("@/pages/StudyMaterialsPage"));
const MaterialWorkspace = lazy(() => import("@/pages/MaterialWorkspace"));
const NotebookWorkspace = lazy(() => import("@/pages/NotebookWorkspace"));
const MaterialSettingsPage = lazy(() => import("@/pages/MaterialSettingsPage"));
const FlashcardsPage = lazy(() => import("@/pages/FlashcardsPage"));
const DeckDetailPage = lazy(() => import("@/pages/DeckDetailPage"));
const StudySession = lazy(() => import("@/pages/StudySession"));
const GroupsPage = lazy(() => import("@/pages/GroupsPage"));
const GroupDetailPage = lazy(() => import("@/pages/GroupDetailPage"));
const JoinGroupPage = lazy(() => import("@/pages/JoinGroupPage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const HelpPage = lazy(() => import("@/pages/HelpPage"));
const HelpCategoryPage = lazy(() => import("@/pages/HelpCategoryPage"));
const HelpArticlePage = lazy(() => import("@/pages/HelpArticlePage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage"));
const UnsubscribePage = lazy(() => import("@/pages/UnsubscribePage"));
const InstallPage = lazy(() => import("@/pages/InstallPage"));
const DeleteAccountPage = lazy(() => import("@/pages/DeleteAccountPage"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const wrap = (el: JSX.Element) => <PageTransition>{el}</PageTransition>;
const guard = (el: JSX.Element) => <ProtectedRoute>{wrap(el)}</ProtectedRoute>;

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes location={location}>
        <Route path="/" element={wrap(<SplashScreen />)} />
        <Route path="/auth" element={wrap(<AuthPage />)} />
        <Route path="/onboarding" element={guard(<OnboardingPage />)} />
        <Route path="/dashboard" element={guard(<Dashboard />)} />
        <Route path="/materials" element={guard(<StudyMaterialsPage />)} />
        <Route path="/materials/:id" element={guard(<MaterialWorkspace />)} />
        <Route path="/materials/:id/settings" element={guard(<MaterialSettingsPage />)} />
        <Route path="/notebooks/:id" element={guard(<NotebookWorkspace />)} />

        {/* Legacy Notes routes - redirect to materials */}
        <Route path="/notes" element={<Navigate to="/materials" replace />} />
        <Route path="/notes/new" element={<Navigate to="/materials" replace />} />
        <Route path="/notes/:id" element={<Navigate to="/materials" replace />} />

        <Route path="/flashcards" element={guard(<FlashcardsPage />)} />
        <Route path="/flashcards/new" element={guard(<FlashcardsPage />)} />
        <Route path="/flashcards/:deckId" element={guard(<DeckDetailPage />)} />
        <Route path="/study" element={guard(<StudySession />)} />
        <Route path="/study/:deckId" element={guard(<StudySession />)} />
        <Route path="/groups" element={guard(<GroupsPage />)} />
        <Route path="/groups/:groupId" element={guard(<GroupDetailPage />)} />
        <Route path="/groups/join/:inviteCode" element={wrap(<JoinGroupPage />)} />
        <Route path="/progress" element={guard(<ProgressPage />)} />
        <Route path="/settings" element={guard(<SettingsPage />)} />
        <Route path="/help" element={wrap(<HelpPage />)} />
        <Route path="/help/category/:categorySlug" element={wrap(<HelpCategoryPage />)} />
        <Route path="/help/article/:articleSlug" element={wrap(<HelpArticlePage />)} />
        <Route path="/pricing" element={wrap(<PricingPage />)} />
        <Route path="/achievements" element={guard(<AchievementsPage />)} />
        <Route path="/sitemap.xml" element={<SitemapRedirect />} />
        <Route path="/unsubscribe/:token" element={wrap(<UnsubscribePage />)} />
        <Route path="/install" element={wrap(<InstallPage />)} />
        <Route path="/delete-account" element={wrap(<DeleteAccountPage />)} />
        <Route path="*" element={wrap(<NotFound />)} />
      </Routes>
    </Suspense>
  );
};

export default AnimatedRoutes;
