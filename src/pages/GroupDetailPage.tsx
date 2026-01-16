import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Crown, 
  Send, 
  Share2,
  Settings,
  LogOut,
  Trash2,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useGroup, useGroupMembers, useLeaveGroup, useDeleteGroup } from "@/hooks/useGroups";
import { useGroupMessages, useSendMessage, useDeleteMessage, GroupMessage } from "@/hooks/useGroupChat";
import { useSharedNotes, SharedNote } from "@/hooks/useSharedNotes";
import ShareNoteModal from "@/components/groups/ShareNoteModal";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { MemberManagementPanel } from "@/components/groups/MemberManagementPanel";
import { SharedNotePreview } from "@/components/groups/SharedNotePreview";
import { cn } from "@/lib/utils";

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SharedNote | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: group, isLoading: groupLoading } = useGroup(groupId || "");
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId || "");
  const { data: messages, isLoading: messagesLoading } = useGroupMessages(groupId || "");
  const { data: sharedNotes, isLoading: notesLoading } = useSharedNotes(groupId || "");
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const leaveGroup = useLeaveGroup();

  const isOwner = group?.owner_id === user?.id;

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !groupId) return;
    sendMessage.mutate({ groupId, content: message.trim() });
    setMessage("");
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!groupId) return;
    deleteMessage.mutate({ messageId, groupId });
  };

  const handleLeaveGroup = () => {
    if (!groupId) return;
    leaveGroup.mutate(groupId, {
      onSuccess: () => navigate("/groups"),
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Group messages by date
  const groupedMessages = messages?.reduce<{ date: string; messages: GroupMessage[] }[]>((groups, msg) => {
    const msgDate = new Date(msg.created_at);
    const dateStr = format(msgDate, "yyyy-MM-dd");
    
    const existingGroup = groups.find(g => g.date === dateStr);
    if (existingGroup) {
      existingGroup.messages.push(msg);
    } else {
      groups.push({ date: dateStr, messages: [msg] });
    }
    return groups;
  }, []) || [];

  if (groupLoading) {
    return (
      <DashboardLayout title="Group">
        <div className="space-y-6 animate-in fade-in duration-300">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <div className="h-[400px] p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`flex gap-3 max-w-[75%] ${i % 2 === 0 ? '' : 'ml-auto flex-row-reverse'}`}>
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className={`space-y-1 ${i % 2 === 0 ? '' : 'items-end'}`}>
                      <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-32'} rounded-xl`} />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout title="Group Not Found">
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">This group doesn't exist or you don't have access.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/groups")}>
            Back to Groups
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <PageBreadcrumb 
        items={[
          { label: "Groups", href: "/groups" },
          { label: group.name }
        ]} 
        className="mb-4"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground text-sm mt-1">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button variant="outline" size="sm" onClick={() => setSettingsModalOpen(true)}>
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLeaveDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Leave
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="w-4 h-4" />
            Shared Notes
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-4 h-4" />
            Members ({members?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0">
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <ScrollArea className="h-[400px] p-4">
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-12 w-3/4 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : !messages?.length ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                          {getDateLabel(new Date(group.messages[0].created_at))}
                        </div>
                      </div>
                      
                      {/* Messages for this date */}
                      <div className="space-y-3">
                        {group.messages.map((msg, idx) => {
                          const isMe = msg.user_id === user?.id;
                          const member = members?.find(m => m.user_id === msg.user_id);
                          const displayName = msg.profiles?.full_name || "Unknown";
                          const isOwnerMember = member?.role === "owner";
                          
                          // Check if previous message is from same user within 5 min
                          const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                          const isContinuation = prevMsg && 
                            prevMsg.user_id === msg.user_id &&
                            (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 5 * 60 * 1000;

                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex gap-2 max-w-[85%] group/message",
                                isMe ? "ml-auto flex-row-reverse" : "items-end"
                              )}
                            >
                              {/* Avatar - only show for first in sequence */}
                              {!isMe && !isContinuation ? (
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {getInitials(msg.profiles?.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : !isMe ? (
                                <div className="w-8 shrink-0" />
                              ) : null}
                              
                              <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                {/* Sender name - only for first in sequence */}
                                {!isMe && !isContinuation && (
                                  <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    {isOwnerMember && <Crown className="w-3 h-3 text-yellow-500" />}
                                    {displayName}
                                  </span>
                                )}
                                
                                <div className="flex items-center gap-1">
                                  {/* Message actions - only for own messages */}
                                  {isMe && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon-sm" 
                                          className="opacity-0 group-hover/message:opacity-100 transition-opacity h-6 w-6"
                                        >
                                          <MoreHorizontal className="w-3 h-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem 
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => handleDeleteMessage(msg.id)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete Message
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                  
                                  <div
                                    className={cn(
                                      "px-3 py-2 rounded-xl text-sm max-w-md break-words",
                                      isMe
                                        ? "bg-primary text-primary-foreground rounded-br-sm"
                                        : "bg-secondary rounded-bl-sm"
                                    )}
                                  >
                                    {msg.content}
                                  </div>
                                </div>
                                
                                <span className="text-[10px] text-muted-foreground mt-1">
                                  {format(new Date(msg.created_at), "h:mm a")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t border-border p-3 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-10 px-4 rounded-lg bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending}>
                {sendMessage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* Shared Notes Tab */}
        <TabsContent value="notes" className="mt-0">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {sharedNotes?.length || 0} shared notes
            </p>
            <Button size="sm" onClick={() => setShareModalOpen(true)}>
              <Share2 className="w-4 h-4 mr-1" />
              Share Note
            </Button>
          </div>

          {notesLoading ? (
            <div className="grid gap-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : !sharedNotes?.length ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No notes shared yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShareModalOpen(true)}>
                Share your first note
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {sharedNotes.map((shared) => (
                <button
                  key={shared.id}
                  onClick={() => setSelectedNote(shared)}
                  className="block w-full text-left p-4 border border-border rounded-xl bg-card hover:bg-secondary/50 transition-colors"
                >
                  <h3 className="font-medium">{shared.notes?.title || "Untitled"}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {shared.notes?.content?.substring(0, 150) || "No content"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Shared {formatDistanceToNow(new Date(shared.shared_at), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-0">
          <MemberManagementPanel
            members={members}
            isLoading={membersLoading}
            groupId={groupId || ""}
            ownerId={group.owner_id}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ShareNoteModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        groupId={groupId || ""}
      />

      {group && (
        <GroupSettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
          group={group}
          onDelete={() => navigate("/groups")}
        />
      )}

      <SharedNotePreview
        sharedNote={selectedNote}
        open={!!selectedNote}
        onOpenChange={(open) => !open && setSelectedNote(null)}
        groupId={groupId || ""}
      />

      {/* Leave Group Confirmation */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{group.name}"? You'll need to rejoin to access 
              group chat and shared notes again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={leaveGroup.isPending}
            >
              {leaveGroup.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Leave Group"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}