import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";
import SplashScreen from "@/pages/SplashScreen";
import AuthPage from "@/pages/AuthPage";
import OnboardingPage from "@/pages/OnboardingPage";
import Dashboard from "@/pages/Dashboard";
import StudyMaterialsPage from "@/pages/StudyMaterialsPage";
import MaterialWorkspace from "@/pages/MaterialWorkspace";
import FlashcardsPage from "@/pages/FlashcardsPage";
import DeckDetailPage from "@/pages/DeckDetailPage";
import StudySession from "@/pages/StudySession";
import GroupsPage from "@/pages/GroupsPage";
import GroupDetailPage from "@/pages/GroupDetailPage";
import ProgressPage from "@/pages/ProgressPage";
import SettingsPage from "@/pages/SettingsPage";
import HelpPage from "@/pages/HelpPage";
import NotFound from "@/pages/NotFound";

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition>
            <SplashScreen />
          </PageTransition>
        } />
        <Route path="/auth" element={
          <PageTransition>
            <AuthPage />
          </PageTransition>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <PageTransition>
              <OnboardingPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <PageTransition>
              <Dashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
        {/* Study Materials - new primary flow */}
        <Route path="/materials" element={
          <ProtectedRoute>
            <PageTransition>
              <StudyMaterialsPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/materials/:id" element={
          <ProtectedRoute>
            <PageTransition>
              <MaterialWorkspace />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Legacy Notes routes - redirect to materials */}
        <Route path="/notes" element={<Navigate to="/materials" replace />} />
        <Route path="/notes/new" element={<Navigate to="/materials" replace />} />
        <Route path="/notes/:id" element={<Navigate to="/materials" replace />} />
        
        <Route path="/flashcards" element={
          <ProtectedRoute>
            <PageTransition>
              <FlashcardsPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/flashcards/new" element={
          <ProtectedRoute>
            <PageTransition>
              <FlashcardsPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/flashcards/:deckId" element={
          <ProtectedRoute>
            <PageTransition>
              <DeckDetailPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/study" element={
          <ProtectedRoute>
            <PageTransition>
              <StudySession />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/study/:deckId" element={
          <ProtectedRoute>
            <PageTransition>
              <StudySession />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/groups" element={
          <ProtectedRoute>
            <PageTransition>
              <GroupsPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/groups/:groupId" element={
          <ProtectedRoute>
            <PageTransition>
              <GroupDetailPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute>
            <PageTransition>
              <ProgressPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <PageTransition>
              <SettingsPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <PageTransition>
              <HelpPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
