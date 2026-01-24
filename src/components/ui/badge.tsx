import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
        secondary: "border-border/50 bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "text-foreground border-border/50 bg-background/50 backdrop-blur-sm",
        success: "border-transparent bg-gradient-to-r from-success to-success/90 text-success-foreground shadow-sm",
        accent: "border-transparent bg-gradient-to-r from-accent to-accent/90 text-accent-foreground shadow-sm",
        muted: "border-transparent bg-muted/80 backdrop-blur-sm text-muted-foreground",
        ghost: "border-border/30 bg-transparent text-muted-foreground hover:bg-secondary/50",
        premium: "relative overflow-hidden border-transparent bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground shadow-glow-sm",
        "outline-primary": "border-primary/30 bg-primary/10 text-primary backdrop-blur-sm",
        "outline-success": "border-success/30 bg-success/10 text-success backdrop-blur-sm",
        "outline-accent": "border-accent/30 bg-accent/10 text-accent backdrop-blur-sm",
        glow: "border-transparent bg-primary text-primary-foreground shadow-glow-sm animate-pulse-soft",
        glass: "border-[hsl(var(--glass-border))] bg-[hsl(var(--glass-bg))] backdrop-blur-xl text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  shimmer?: boolean;
}

function Badge({ className, variant, shimmer = false, children, ...props }: BadgeProps) {
  const showShimmer = shimmer || variant === "premium";
  
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showShimmer && (
        <div 
          className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite]"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
          }}
          aria-hidden="true"
        />
      )}
      <span className="relative z-10">{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };