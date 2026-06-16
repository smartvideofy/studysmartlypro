import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLAY_STORE_URL } from "@/lib/device";
import { toast } from "sonner";

interface AndroidQRModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AndroidQRModal({ trigger, open, onOpenChange }: AndroidQRModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PLAY_STORE_URL);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Get Studily on Android
          </DialogTitle>
          <DialogDescription>
            Scan this QR code with your phone to open the Play Store.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-border shadow-sm">
            <QRCodeSVG
              value={PLAY_STORE_URL}
              size={240}
              level="H"
              marginSize={4}
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button onClick={handleCopy} variant="outline" className="w-full">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </>
              )}
            </Button>
            <Button asChild className="w-full">
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                Open Play Store
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
