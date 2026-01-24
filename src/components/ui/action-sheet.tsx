import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { haptics } from "@/lib/haptics";

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const handleAction = (action: ActionSheetAction) => {
    if (action.disabled) return;
    haptics.selection();
    action.onClick();
    onOpenChange(false);
  };

  const handleCancel = () => {
    haptics.light();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {/* Main actions card */}
            <div className="rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 overflow-hidden shadow-xl mb-2">
              {/* Header */}
              {(title || description) && (
                <div className="px-4 py-3 border-b border-border/50 text-center">
                  {title && (
                    <h3 className="font-display font-semibold text-foreground">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="divide-y divide-border/50">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-4 text-base font-medium transition-colors",
                      "active:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed",
                      action.destructive
                        ? "text-destructive"
                        : "text-foreground"
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancel button */}
            <button
              onClick={handleCancel}
              className={cn(
                "w-full rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50",
                "px-4 py-4 text-base font-semibold text-primary",
                "active:bg-muted/50 transition-colors"
              )}
            >
              {cancelLabel}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Convenience component for confirmation dialogs
interface ConfirmActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmActionSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
  loading = false,
}: ConfirmActionSheetProps) {
  return (
    <ActionSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      cancelLabel={cancelLabel}
      actions={[
        {
          label: confirmLabel,
          onClick: onConfirm,
          destructive,
          disabled: loading,
        },
      ]}
    />
  );
}
