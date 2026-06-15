import { Smartphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAY_STORE_URL } from "@/lib/device";

interface AndroidAppLinkProps {
  variant?: "sidebar" | "drawer";
  collapsed?: boolean;
  onClick?: () => void;
}

/**
 * Compact "Get the Android app" entry for the sidebar and mobile menu drawer.
 * Opens the Play Store listing in a new tab.
 */
export function AndroidAppLink({
  variant = "sidebar",
  collapsed = false,
  onClick,
}: AndroidAppLinkProps) {
  if (variant === "sidebar") {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
        title="Get the Android app"
      >
        <Smartphone className="h-5 w-5 shrink-0 group-hover:text-primary transition-colors" />
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1 truncate">
              Android app
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </>
        )}
      </a>
    );
  }

  // drawer variant
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted/50 transition-colors min-h-[48px]"
    >
      <Smartphone className="w-5 h-5 shrink-0 text-primary" />
      <span className="font-medium flex-1 text-left">Get the Android app</span>
      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}
