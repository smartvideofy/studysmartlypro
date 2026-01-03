import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-2xl border text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border-border shadow-soft",
        elevated: "bg-card border-border shadow-medium hover:shadow-large",
        glass: "bg-[hsl(var(--glass-bg))] backdrop-blur-2xl border-[hsl(var(--glass-border))] shadow-glass relative overflow-hidden before:absolute before:inset-0 before:bg-[var(--glass-shine)] before:pointer-events-none before:rounded-[inherit]",
        interactive: "bg-[hsl(var(--glass-bg))] backdrop-blur-xl border-[hsl(var(--glass-border))] shadow-soft hover:shadow-card-hover hover:border-primary/25 hover:-translate-y-1 cursor-pointer",
        feature: "bg-card border-border shadow-soft overflow-hidden relative",
        gradient: "bg-[hsl(var(--glass-bg))] backdrop-blur-2xl border-[hsl(var(--glass-border))] shadow-glass relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-mesh before:pointer-events-none",
        premium: "bg-[hsl(var(--glass-bg))] backdrop-blur-2xl border-[hsl(var(--glass-border))] shadow-glass hover:shadow-card-hover hover:border-primary/30 relative overflow-hidden before:absolute before:inset-0 before:bg-[var(--glass-shine)] before:pointer-events-none",
        spotlight: "bg-[hsl(var(--glass-bg))] backdrop-blur-2xl border-[hsl(var(--glass-border))] shadow-glass relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/8 before:via-transparent before:to-accent/6 before:pointer-events-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-display text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };