import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-large group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:!bg-success/10 group-[.toaster]:!border-success/30 group-[.toaster]:!text-success",
          error: "group-[.toaster]:!bg-destructive/10 group-[.toaster]:!border-destructive/30 group-[.toaster]:!text-destructive",
          warning: "group-[.toaster]:!bg-warning/10 group-[.toaster]:!border-warning/30 group-[.toaster]:!text-warning",
          info: "group-[.toaster]:!bg-primary/10 group-[.toaster]:!border-primary/30 group-[.toaster]:!text-primary",
        },
      }}
      {...props}
    />
  );
};

// Enhanced toast functions with icons
const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.success(message, {
      icon: <CheckCircle2 className="w-5 h-5 text-success" />,
      ...options,
    }),
  error: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.error(message, {
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      ...options,
    }),
  warning: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.warning(message, {
      icon: <AlertCircle className="w-5 h-5 text-warning" />,
      ...options,
    }),
  info: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.info(message, {
      icon: <Info className="w-5 h-5 text-primary" />,
      ...options,
    }),
  loading: (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
    sonnerToast.loading(message, {
      icon: <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />,
      ...options,
    }),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast,
  message: sonnerToast,
};

export { Toaster, toast };
