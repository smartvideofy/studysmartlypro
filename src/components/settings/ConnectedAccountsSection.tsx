import { useState } from "react";
import { Mail, Loader2, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserIdentity } from "@supabase/supabase-js";

const PROVIDER_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  email: {
    label: "Email",
    icon: <Mail className="w-4 h-4" />,
  },
  google: {
    label: "Google",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
};

export function ConnectedAccountsSection() {
  const { user } = useAuth();
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const identities = user?.identities ?? [];
  const connectedProviders = identities.map((i) => i.provider);
  const canUnlink = identities.length > 1;

  const handleLinkGoogle = async () => {
    setLinkingProvider("google");
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/settings`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to link Google account");
      setLinkingProvider(null);
    }
  };

  const handleUnlink = async (identity: UserIdentity) => {
    if (!canUnlink) {
      toast.error("You must have at least one login method connected.");
      return;
    }

    setUnlinkingId(identity.identity_id);
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      toast.success(`${PROVIDER_CONFIG[identity.provider]?.label || identity.provider} account unlinked`);
      // Refresh user to update identities
      await supabase.auth.refreshSession();
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink account");
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <>
      {identities.map((identity, index) => {
        const config = PROVIDER_CONFIG[identity.provider] || {
          label: identity.provider,
          icon: <Link2 className="w-4 h-4" />,
        };
        const email = identity.identity_data?.email as string | undefined;

        return (
          <div key={identity.identity_id}>
            {index > 0 && <Separator />}
            <div className="flex items-center justify-between gap-4 px-4 py-3.5 min-h-[52px]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                  <span className="text-muted-foreground">{config.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{config.label}</p>
                  {email && (
                    <p className="text-xs text-muted-foreground truncate">{email}</p>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {canUnlink ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnlink(identity)}
                    disabled={unlinkingId === identity.identity_id}
                  >
                    {unlinkingId === identity.identity_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Unlink className="w-3.5 h-3.5 mr-1.5" />
                        Unlink
                      </>
                    )}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Primary</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {!connectedProviders.includes("google") && (
        <>
          {identities.length > 0 && <Separator />}
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 min-h-[52px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <span className="text-muted-foreground">{PROVIDER_CONFIG.google.icon}</span>
              </div>
              <div>
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-muted-foreground">Not connected</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLinkGoogle}
              disabled={linkingProvider === "google"}
            >
              {linkingProvider === "google" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Link2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              Link
            </Button>
          </div>
        </>
      )}
    </>
  );
}
