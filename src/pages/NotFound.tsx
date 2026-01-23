import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, BookOpen, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Search className="w-10 h-10 text-primary" />
        </div>
        <h1 className="mb-2 text-6xl font-bold font-display text-primary">404</h1>
        <p className="mb-2 text-xl font-semibold">Page not found</p>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link to="/dashboard">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/materials">
              <BookOpen className="w-4 h-4" />
              Materials
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/help">
              <HelpCircle className="w-4 h-4" />
              Help Center
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
