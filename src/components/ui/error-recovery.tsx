import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorRecoveryProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export function ErrorRecovery({
  title = "Something went wrong",
  message = "We couldn't load your data. Please try again.",
  onRetry,
  isRetrying = false,
  variant = "default",
  className,
}: ErrorRecoveryProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20", className)}>
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
        <span className="text-sm text-destructive flex-1">{message}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRetry}
          disabled={isRetrying}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {isRetrying ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </>
          )}
        </Button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <WifiOff className="w-6 h-6 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">{message}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card variant="glass" className={cn("max-w-md mx-auto", className)}>
      <CardContent className="flex flex-col items-center text-center py-10">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{message}</p>
        <Button 
          onClick={onRetry}
          disabled={isRetrying}
          className="gap-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Try Again
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
