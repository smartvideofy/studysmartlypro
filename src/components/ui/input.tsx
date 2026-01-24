import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles with mobile-optimized sizing
          "flex h-12 w-full rounded-xl border bg-[hsl(var(--glass-bg))] backdrop-blur-xl px-4 py-3 text-base ring-offset-background transition-all duration-200 shadow-xs",
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Focus states
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Desktop text size adjustment
          "md:h-11 md:py-2 md:text-sm",
          // Touch-friendly tap target
          "touch-target",
          // Conditional styles
          error
            ? "border-destructive/50 focus-visible:ring-destructive/30 focus-visible:border-destructive animate-[shake_0.3s_ease-in-out]"
            : success
            ? "border-success/50 focus-visible:ring-success/30 focus-visible:border-success"
            : "border-border/50 focus-visible:ring-primary/20 focus-visible:border-primary/40 hover:border-border focus-visible:bg-[hsl(0_0%_100%/0.8)]",
          className
        )}
        ref={ref}
        aria-invalid={error}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
