import { Smartphone, QrCode } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AndroidQRModal } from "./AndroidQRModal";

interface AndroidAppLinkProps {
  variant?: "sidebar" | "drawer";
  collapsed?: boolean;
  onClick?: () => void;
}

/**
 * Compact "Get the Android app" entry for the sidebar and mobile menu drawer.
 * Opens a QR code modal so users can scan with their phone.
 */
export function AndroidAppLink({
  variant = "sidebar",
  collapsed = false,
  onClick,
}: AndroidAppLinkProps) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
    onClick?.();
  };

  return (
    <>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={handleClick}
          title="Get the Android app"
          className={cn(
            "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <Smartphone className="h-5 w-5 shrink-0 group-hover:text-primary transition-colors" />
          {!collapsed && (
            <>
              <span className="text-sm font-medium flex-1 truncate text-left">
                Android app
              </span>
              <QrCode className="h-3.5 w-3.5 opacity-60" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted/50 transition-colors min-h-[48px]"
        >
          <Smartphone className="w-5 h-5 shrink-0 text-primary" />
          <span className="font-medium flex-1 text-left">Get the Android app</span>
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      <AndroidQRModal open={open} onOpenChange={setOpen} />
    </>
  );
}
