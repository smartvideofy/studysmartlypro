import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary via-primary to-primary/80",
        success: "bg-gradient-to-r from-success via-success to-success/80",
        accent: "bg-gradient-to-r from-accent via-accent to-accent/80",
        warning: "bg-gradient-to-r from-warning via-warning to-warning/80",
        premium: "bg-gradient-to-r from-primary via-accent to-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressProps 
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  showShine?: boolean;
  showGlow?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, showShine = true, showGlow = false, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-secondary/50",
      showGlow && "shadow-[0_0_10px_-3px_hsl(var(--primary)/0.4)]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        progressVariants({ variant }),
        "relative rounded-full"
      )}
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
        transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)"
      }}
    >
      {/* Shine effect */}
      {showShine && (value || 0) > 0 && (
        <div 
          className="absolute inset-0 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <div 
            className="absolute inset-0 -translate-x-full animate-[shine_2s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            }}
          />
        </div>
      )}
      
      {/* Edge glow */}
      {showGlow && (value || 0) > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-white/40 to-transparent rounded-r-full"
          aria-hidden="true"
        />
      )}
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
