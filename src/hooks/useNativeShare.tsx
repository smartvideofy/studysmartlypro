import { useCallback } from "react";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

interface ShareData {
  title: string;
  text?: string;
  url?: string;
}

export function useNativeShare() {
  const isSupported = typeof navigator !== "undefined" && "share" in navigator;

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    // Use native share if available
    if (isSupported) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url,
        });
        haptics.success();
        return true;
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
        return false;
      }
    }

    // Fallback to clipboard
    const textToShare = data.url || data.text || data.title;
    try {
      await navigator.clipboard.writeText(textToShare);
      haptics.success();
      toast.success("Copied to clipboard");
      return true;
    } catch (error) {
      toast.error("Failed to copy");
      return false;
    }
  }, [isSupported]);

  const shareUrl = useCallback(async (url: string, title: string): Promise<boolean> => {
    return share({ title, url });
  }, [share]);

  const shareText = useCallback(async (text: string, title: string): Promise<boolean> => {
    return share({ title, text });
  }, [share]);

  return {
    isSupported,
    share,
    shareUrl,
    shareText,
  };
}
