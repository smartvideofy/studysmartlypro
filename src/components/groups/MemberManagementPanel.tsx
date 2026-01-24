import { useState } from "react";
import { Crown, MoreHorizontal, UserMinus, Shield, Loader2, ShieldPlus, ShieldMinus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupMember, useRemoveMember } from "@/hooks/useGroups";
import { useUpdateMemberRole } from "@/hooks/useUpdateMemberRole";
import { useAuth } from "@/hooks/useAuth";
import { OnlineIndicator } from "./OnlineIndicator";

interface MemberManagementPanelProps {
  members: GroupMember[] | undefined;
  isLoading: boolean;
  groupId: string;
  ownerId: string;
  isOnline?: (userId: string) => boolean;
}

export function MemberManagementPanel({ 
  members, 
  isLoading, 
  groupId,
  ownerId,
  isOnline 
}: MemberManagementPanelProps) {
  const { user } = useAuth();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateMemberRole();
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);

  const isOwnerUser = user?.id === ownerId;

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    await removeMember.mutateAsync({ 
      groupId, 
      userId: memberToRemove.user_id 
    });
    setMemberToRemove(null);
  };

  const handleRoleChange = async (member: GroupMember, newRole: 'admin' | 'member') => {
    await updateRole.mutateAsync({
      groupId,
      userId: member.user_id,
      newRole,
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="accent" className="text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Owner
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-xl">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!members?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No members found
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {members.map((member) => {
          const isMe = member.user_id === user?.id;
          const isMemberOwner = member.role === "owner";
          const isMemberAdmin = member.role === "admin";
          const displayName = member.profiles?.full_name || "Unknown User";
          
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(member.profiles?.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <OnlineIndicator 
                    isOnline={isOnline(member.user_id)} 
                    size="md"
                    className="absolute -bottom-0.5 -right-0.5"
                  />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {isMe ? "You" : displayName}
                  </p>
                  {getRoleBadge(member.role)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                </p>
              </div>

              {/* Actions - only show for owner managing other members */}
              {isOwnerUser && !isMe && !isMemberOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isMemberAdmin ? (
                      <DropdownMenuItem onClick={() => handleRoleChange(member, 'member')}>
                        <ShieldMinus className="w-4 h-4 mr-2" />
                        Demote to Member
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleRoleChange(member, 'admin')}>
                        <ShieldPlus className="w-4 h-4 mr-2" />
                        Promote to Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => setMemberToRemove(member)}
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove from Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{memberToRemove?.profiles?.full_name || "this member"}</strong>{" "}
              from the group? They will need to rejoin to access group content again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Remove Member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
