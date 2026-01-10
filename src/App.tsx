import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import { InstallPrompt, OfflineIndicator, UpdatePrompt } from "@/components/pwa";

const queryClient = new QueryClient();

const App = () => {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setNeedsRefresh(true);
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  const handleUpdate = async () => {
    const updateSW = (window as any).__updateSW;
    if (updateSW) {
      await updateSW();
      window.location.reload();
    }
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <InstallPrompt />
            {needsRefresh && <UpdatePrompt onUpdate={handleUpdate} />}
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
