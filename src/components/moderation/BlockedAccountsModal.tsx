import { Loader2, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ResponsiveModal,
  ResponsiveModalBody,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { useBlockedUsers, useUnblockUser } from "@/hooks/useModeration";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function BlockedAccountsModal({ open, onOpenChange }: Props) {
  const { data, isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Blocked accounts
        </ResponsiveModalTitle>
        <ResponsiveModalDescription>
          You won't see messages from these accounts in group chats.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            You haven't blocked anyone.
          </p>
        ) : (
          data.map((b) => (
            <div
              key={b.blocked_id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Avatar className="w-9 h-9">
                <AvatarImage src={b.profile?.avatar_url ?? undefined} />
                <AvatarFallback>{initials(b.profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {b.profile?.full_name || "Unknown user"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Blocked {new Date(b.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => unblock.mutate(b.blocked_id)}
                disabled={unblock.isPending}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Unblock
              </Button>
            </div>
          ))
        )}
      </ResponsiveModalBody>
    </ResponsiveModal>
  );
}
