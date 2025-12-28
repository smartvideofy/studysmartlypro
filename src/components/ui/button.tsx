import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:shadow-medium hover:bg-primary-hover active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:shadow-medium hover:brightness-110 active:scale-[0.98]",
        outline:
          "border border-border bg-background hover:bg-secondary hover:border-primary/30 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost: 
          "hover:bg-secondary hover:text-secondary-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        hero:
          "bg-primary text-primary-foreground shadow-glow-sm hover:shadow-glow hover:bg-primary-hover active:scale-[0.98] font-semibold",
        accent:
          "bg-accent text-accent-foreground shadow-soft hover:shadow-accent-glow hover:brightness-105 active:scale-[0.98]",
        success:
          "bg-success text-success-foreground shadow-soft hover:shadow-medium hover:brightness-105 active:scale-[0.98]",
        glass:
          "bg-card/70 backdrop-blur-xl border border-border/60 text-foreground hover:bg-card/85 hover:border-primary/25 active:scale-[0.98] shadow-soft",
        premium:
          "relative overflow-hidden bg-primary text-primary-foreground shadow-glow font-semibold before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 hover:shadow-lg active:scale-[0.98]",
        "outline-primary":
          "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-7 text-base",
        xl: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };