import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] touch-target",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:shadow-medium hover:bg-primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:shadow-medium hover:brightness-105",
        outline:
          "border border-border bg-background hover:bg-secondary hover:border-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: 
          "hover:bg-secondary hover:text-secondary-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        hero:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary-hover font-semibold",
        accent:
          "bg-accent text-accent-foreground shadow-soft hover:shadow-medium hover:brightness-105",
        success:
          "bg-success text-success-foreground shadow-soft hover:shadow-medium hover:brightness-105",
        glass:
          "bg-card border border-border hover:bg-secondary hover:border-primary/20",
        premium:
          "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary-hover font-semibold",
        "outline-primary":
          "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-10 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-7 text-base",
        xl: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-12 w-12",
        "icon-xl": "h-14 w-14 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
  disableHaptics?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, success = false, disableHaptics = false, children, disabled, onClick, ...props }, ref) => {
    // Don't use Slot when loading/success to allow icon replacement
    const Comp = asChild && !loading && !success ? Slot : "button";
    
    const isIconOnly = size?.toString().includes("icon");
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableHaptics && !disabled && !loading) {
        haptics.light();
      }
      onClick?.(e);
    };
    
    // Render content based on state - always return a single element structure
    const renderContent = () => {
      if (loading) {
        if (isIconOnly) {
          return <Loader2 className="animate-spin" />;
        }
        return (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin" />
            Loading...
          </span>
        );
      }
      
      if (success) {
        if (isIconOnly) {
          return <Check className="animate-in zoom-in-50 duration-200" strokeWidth={3} />;
        }
        return (
          <span className="inline-flex items-center gap-2">
            <Check className="animate-in zoom-in-50 duration-200" strokeWidth={3} />
            Done!
          </span>
        );
      }
      
      return children;
    };
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          success && "!bg-success hover:!bg-success"
        )}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {renderContent()}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };