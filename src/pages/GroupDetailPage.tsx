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
  Loader2,
  Link2,
  Reply,
  Paperclip,
  Image as ImageIcon
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
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
import { useProfile } from "@/hooks/useProfile";
import { useGroup, useGroupMembers, useLeaveGroup, useDeleteGroup } from "@/hooks/useGroups";
import { useGroupMessages, useSendMessage, useDeleteMessage, GroupMessage } from "@/hooks/useGroupChat";
import { useSharedNotes, SharedNote } from "@/hooks/useSharedNotes";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMarkAsRead } from "@/hooks/useUnreadMessages";
import { useMessageReactions, useToggleReaction } from "@/hooks/useMessageReactions";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useUploadAttachment } from "@/hooks/useChatAttachments";
import { useMentionNotifications } from "@/hooks/useMentionNotifications";
import ShareNoteModal from "@/components/groups/ShareNoteModal";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { MemberManagementPanel } from "@/components/groups/MemberManagementPanel";
import { SharedNotePreview } from "@/components/groups/SharedNotePreview";
import { InviteLinkModal } from "@/components/groups/InviteLinkModal";
import { TypingIndicator } from "@/components/groups/TypingIndicator";
import { MessageReactions } from "@/components/groups/MessageReactions";
import { OnlineIndicator } from "@/components/groups/OnlineIndicator";
import { MentionInput, parseMentions, renderMessageWithMentions } from "@/components/groups/MentionInput";
import { ReplyPreview } from "@/components/groups/ReplyPreview";
import { MessageAttachments, AttachmentPreview } from "@/components/groups/MessageAttachments";
import { cn } from "@/lib/utils";

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SharedNote | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: group, isLoading: groupLoading } = useGroup(groupId || "");
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId || "");
  const { data: messages, isLoading: messagesLoading } = useGroupMessages(groupId || "");
  const { data: sharedNotes, isLoading: notesLoading } = useSharedNotes(groupId || "");
  const { data: profile } = useProfile();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const leaveGroup = useLeaveGroup();
  const markAsRead = useMarkAsRead();
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(groupId || "");
  const { getReactionsForMessage } = useMessageReactions(groupId || "");
  const toggleReaction = useToggleReaction();
  const { onlineUsers, isOnline } = useOnlinePresence(groupId || "");
  const { uploadAttachment, isUploading } = useUploadAttachment();
  const sendMentionNotifications = useMentionNotifications();

  const isOwner = group?.owner_id === user?.id;
  const myName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (groupId && messages?.length) {
      markAsRead.mutate(groupId);
    }
  }, [groupId, messages?.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !attachmentFile) || !groupId) return;
    
    const { mentions } = parseMentions(message);
    
    sendMessage.mutate(
      { 
        groupId, 
        content: message.trim() || (attachmentFile ? `📎 ${attachmentFile.name}` : ""), 
        replyToId: replyTo?.id 
      },
      {
        onSuccess: async (newMessage) => {
          // Upload attachment if present
          if (attachmentFile && newMessage) {
            await uploadAttachment(attachmentFile, newMessage.id);
          }
          
          // Send mention notifications
          if (mentions.length > 0 && group) {
            sendMentionNotifications.mutate({
              groupId,
              groupName: group.name,
              mentionedNames: mentions,
              senderName: myName,
              messageContent: message.trim(),
            });
          }
        }
      }
    );
    
    setMessage("");
    setReplyTo(null);
    setAttachmentFile(null);
    stopTyping(myName);
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    if (value.trim()) {
      startTyping(myName);
    } else {
      stopTyping(myName);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!groupId) return;
    deleteMessage.mutate({ messageId, groupId });
  };

  const handleReply = (msg: GroupMessage) => {
    setReplyTo({
      id: msg.id,
      content: msg.content,
      senderName: msg.profiles?.full_name || "Unknown",
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        return;
      }
      setAttachmentFile(file);
    }
    e.target.value = "";
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
          {isOwner && group.is_private && (
            <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(true)}>
              <Link2 className="w-4 h-4 mr-1" />
              Invite
            </Button>
          )}
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
                                <div className="relative shrink-0">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                      {getInitials(msg.profiles?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <OnlineIndicator 
                                    isOnline={isOnline(msg.user_id)} 
                                    size="sm"
                                    className="absolute -bottom-0.5 -right-0.5"
                                  />
                                </div>
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
                                  {/* Reply button for other's messages */}
                                  {!isMe && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon-sm" 
                                      className="opacity-0 group-hover/message:opacity-100 transition-opacity h-6 w-6"
                                      onClick={() => handleReply(msg)}
                                    >
                                      <Reply className="w-3 h-3" />
                                    </Button>
                                  )}
                                  
                                  {/* Message actions - for own messages */}
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
                                  
                                  <div className="flex flex-col gap-1">
                                    {/* Reply reference */}
                                    {msg.reply_to && (
                                      <div className={cn(
                                        "text-xs px-2 py-1 rounded border-l-2 border-primary/50 bg-secondary/50 max-w-[200px]",
                                        isMe ? "ml-auto" : ""
                                      )}>
                                        <span className="font-medium text-primary text-[10px]">
                                          {msg.reply_to.profiles?.full_name || "Unknown"}
                                        </span>
                                        <p className="truncate opacity-70">{msg.reply_to.content}</p>
                                      </div>
                                    )}
                                    
                                    <div
                                      className={cn(
                                        "px-3 py-2 rounded-xl text-sm max-w-md break-words",
                                        isMe
                                          ? "bg-primary text-primary-foreground rounded-br-sm"
                                          : "bg-secondary rounded-bl-sm"
                                      )}
                                    >
                                      {renderMessageWithMentions(msg.content, myName)}
                                    </div>
                                    
                                    {/* Attachments */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                      <MessageAttachments attachments={msg.attachments} isMe={isMe} />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Message Reactions */}
                                <MessageReactions
                                  reactions={getReactionsForMessage(msg.id)}
                                  onToggleReaction={(emoji) => 
                                    toggleReaction.mutate({ messageId: msg.id, emoji, groupId: groupId || "" })
                                  }
                                  isMe={isMe}
                                  isPending={toggleReaction.isPending}
                                />
                                
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

            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />

            {/* Reply Preview */}
            {replyTo && (
              <ReplyPreview replyTo={replyTo} onCancel={() => setReplyTo(null)} className="mx-3 mt-2" />
            )}

            {/* Attachment Preview */}
            {attachmentFile && (
              <div className="px-3 pt-2">
                <AttachmentPreview file={attachmentFile} onRemove={() => setAttachmentFile(null)} />
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t border-border p-3 flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <MentionInput
                value={message}
                onChange={handleMessageChange}
                onSubmit={() => handleSendMessage({ preventDefault: () => {} } as React.FormEvent)}
                members={members || []}
                placeholder="Type a message... Use @ to mention"
                disabled={sendMessage.isPending || isUploading}
              />
              <Button type="submit" size="icon" disabled={(!message.trim() && !attachmentFile) || sendMessage.isPending || isUploading}>
                {sendMessage.isPending || isUploading ? (
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
          {/* Online indicator summary */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {onlineUsers.length} online now
              </span>
            </div>
          )}
          <MemberManagementPanel
            members={members}
            isLoading={membersLoading}
            groupId={groupId || ""}
            ownerId={group.owner_id}
            isOnline={isOnline}
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

      {group && group.is_private && (
        <InviteLinkModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          groupId={groupId || ""}
          groupName={group.name}
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