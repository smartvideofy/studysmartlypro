import { useState } from "react";
import { Copy, Link2, Trash2, Loader2, Clock, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGroupInvites, useCreateInvite, useRevokeInvite } from "@/hooks/useGroupInvites";
import { toast } from "sonner";

interface InviteLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

export function InviteLinkModal({ open, onOpenChange, groupId, groupName }: InviteLinkModalProps) {
  const [expiresIn, setExpiresIn] = useState("7");
  const [maxUses, setMaxUses] = useState<string>("unlimited");

  const { data: invites, isLoading } = useGroupInvites(groupId);
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();

  const handleCreateInvite = () => {
    createInvite.mutate({
      groupId,
      expiresInDays: parseInt(expiresIn),
      maxUses: maxUses === "unlimited" ? null : parseInt(maxUses),
    });
  };

  const handleCopyLink = (inviteCode: string) => {
    const link = `${window.location.origin}/groups/join/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard");
  };

  const handleRevokeInvite = (inviteId: string) => {
    revokeInvite.mutate({ inviteId, groupId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Invite Links
          </DialogTitle>
          <DialogDescription>
            Create and manage invite links for "{groupName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Invite */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-secondary/30">
            <h4 className="font-medium text-sm">Create New Invite</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Expires In</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Max Uses</Label>
                <Select value={maxUses} onValueChange={setMaxUses}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="1">1 use</SelectItem>
                    <SelectItem value="5">5 uses</SelectItem>
                    <SelectItem value="10">10 uses</SelectItem>
                    <SelectItem value="25">25 uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleCreateInvite} 
              className="w-full"
              disabled={createInvite.isPending}
            >
              {createInvite.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Generate Link
            </Button>
          </div>

          {/* Active Invites */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Active Invites</h4>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !invites?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active invites
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invites.map((invite) => (
                  <div 
                    key={invite.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium truncate">
                        {invite.invite_code}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {invite.use_count}/{invite.max_uses ?? "∞"} uses
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleCopyLink(invite.invite_code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={revokeInvite.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
