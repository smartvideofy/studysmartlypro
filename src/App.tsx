import { useEffect } from "react";
import { offlineStorage } from "@/lib/offlineStorage";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import AnimatedRoutes from "@/components/AnimatedRoutes";

const queryClient = new QueryClient();

// Increment this version when deploying layout/UI changes to bust caches
const APP_VERSION = '1.0.1';

// Version-based cache busting component
function CacheBuster() {
  useEffect(() => {
    const storedVersion = localStorage.getItem('app-version');
    if (storedVersion !== APP_VERSION) {
      // Version changed - clear caches
      queryClient.clear();
      // Clear offline IndexedDB cache on version bump
      offlineStorage.clearAll().catch(console.error);
      // Clear user-specific localStorage keys that might have stale data
      const keysToPreserve = ['app-version', 'theme'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem('app-version', APP_VERSION);
      console.log('App updated to version', APP_VERSION, '- caches cleared');
    }
  }, []);
  
  return null;
}

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <CacheBuster />
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AnimatedRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
