import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Crown, 
  Send, 
  ArrowLeft,
  Share2,
  Trash2,
  LogOut
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useGroup, useGroupMembers, useLeaveGroup, useDeleteGroup } from "@/hooks/useGroups";
import { useGroupMessages, useSendMessage } from "@/hooks/useGroupChat";
import { useSharedNotes } from "@/hooks/useSharedNotes";
import { useNotes } from "@/hooks/useNotes";
import ShareNoteModal from "@/components/groups/ShareNoteModal";
import { cn } from "@/lib/utils";

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: group, isLoading: groupLoading } = useGroup(groupId || "");
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId || "");
  const { data: messages, isLoading: messagesLoading } = useGroupMessages(groupId || "");
  const { data: sharedNotes, isLoading: notesLoading } = useSharedNotes(groupId || "");
  const sendMessage = useSendMessage();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const isOwner = group?.owner_id === user?.id;
  const currentMember = members?.find(m => m.user_id === user?.id);

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

  const handleLeaveGroup = () => {
    if (!groupId) return;
    leaveGroup.mutate(groupId, {
      onSuccess: () => navigate("/groups"),
    });
  };

  const handleDeleteGroup = () => {
    if (!groupId || !confirm("Are you sure you want to delete this group?")) return;
    deleteGroup.mutate(groupId, {
      onSuccess: () => navigate("/groups"),
    });
  };

  if (groupLoading) {
    return (
      <DashboardLayout title="Group">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout title="Group Not Found">
        <div className="text-center py-12">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/groups")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground text-sm mt-1">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button variant="destructive" size="sm" onClick={handleDeleteGroup}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleLeaveGroup}>
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
                    <Skeleton key={i} className="h-12 w-3/4" />
                  ))}
                </div>
              ) : !messages?.length ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.user_id === user?.id;
                    const member = members?.find(m => m.user_id === msg.user_id);
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col max-w-[75%]",
                          isMe ? "ml-auto items-end" : "items-start"
                        )}
                      >
                        {!isMe && (
                          <span className="text-xs text-muted-foreground mb-1">
                            {member?.role === "owner" && <Crown className="w-3 h-3 inline mr-1 text-yellow-500" />}
                            User
                          </span>
                        )}
                        <div
                          className={cn(
                            "px-3 py-2 rounded-xl text-sm",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-secondary rounded-bl-sm"
                          )}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })}
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
                <Send className="w-4 h-4" />
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
              {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
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
                <div
                  key={shared.id}
                  className="block p-4 border border-border rounded-xl bg-card"
                >
                  <h3 className="font-medium">{shared.notes?.title || "Untitled"}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {shared.notes?.content?.substring(0, 100) || "No content"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Shared {formatDistanceToNow(new Date(shared.shared_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-0">
          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-xl"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {member.role === "owner" ? (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    ) : (
                      "U"
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {member.user_id === user?.id ? "You" : "Member"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Share Note Modal */}
      <ShareNoteModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        groupId={groupId || ""}
      />
    </DashboardLayout>
  );
}
