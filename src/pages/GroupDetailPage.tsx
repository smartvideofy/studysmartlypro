import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Send, 
  Share2,
  Settings,
  LogOut,
  Loader2,
  Link2,
  Paperclip,
  CalendarPlus,
  Calendar
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useGroup, useGroupMembers, useLeaveGroup } from "@/hooks/useGroups";
import { useGroupMessages, useSendMessage, useDeleteMessage, GroupMessage } from "@/hooks/useGroupChat";
import { useSharedNotes, SharedNote } from "@/hooks/useSharedNotes";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useMarkAsRead } from "@/hooks/useUnreadMessages";
import { useMessageReactions, useToggleReaction } from "@/hooks/useMessageReactions";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useUploadAttachment } from "@/hooks/useChatAttachments";
import { useMentionNotifications } from "@/hooks/useMentionNotifications";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { usePinnedMessages, useTogglePin } from "@/hooks/useMessagePinning";
import { useGroupStudySessions } from "@/hooks/useGroupStudySessions";
import { useReadReceipts, useBulkMarkAsRead } from "@/hooks/useReadReceipts";
import { useEditMessage } from "@/hooks/useEditMessage";
import { useGroupPolls } from "@/hooks/useGroupPolls";
import ShareNoteModal from "@/components/groups/ShareNoteModal";
import UploadNoteModal from "@/components/groups/UploadNoteModal";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { MemberManagementPanel } from "@/components/groups/MemberManagementPanel";
import { SharedNotePreview } from "@/components/groups/SharedNotePreview";
import { InviteLinkModal } from "@/components/groups/InviteLinkModal";
import { TypingIndicator } from "@/components/groups/TypingIndicator";
import { MentionInput, parseMentions } from "@/components/groups/MentionInput";
import { ReplyPreview } from "@/components/groups/ReplyPreview";
import { AttachmentPreview } from "@/components/groups/MessageAttachments";
import { MessageSearchBar } from "@/components/groups/MessageSearchBar";
import { PinnedMessagesPanel } from "@/components/groups/PinnedMessagesPanel";
import { UpcomingSessionsBanner } from "@/components/groups/UpcomingSessionsBanner";
import { ScheduleSessionModal } from "@/components/groups/ScheduleSessionModal";
import { StudySessionCard } from "@/components/groups/StudySessionCard";
import { ChatMessageBubble } from "@/components/groups/ChatMessageBubble";
import { VoiceRecorderInput } from "@/components/groups/VoiceRecorderInput";
import { ScrollToBottomFab, NewMessagesDivider } from "@/components/groups/ScrollToBottomFab";
import { MessageEditModal } from "@/components/groups/MessageEditModal";
import { CreatePollModal } from "@/components/groups/CreatePollModal";
import { PollCard } from "@/components/groups/PollCard";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [uploadNoteModalOpen, setUploadNoteModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<SharedNote | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [editingMessage, setEditingMessage] = useState<GroupMessage | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [pollModalOpen, setPollModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const { data: group, isLoading: groupLoading } = useGroup(groupId || "");
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId || "");
  const { data: messages, isLoading: messagesLoading } = useGroupMessages(groupId || "");
  const { data: sharedNotes, isLoading: notesLoading } = useSharedNotes(groupId || "");
  const { data: profile } = useProfile();
  const { data: pinnedMessages } = usePinnedMessages(groupId || "");
  const { data: studySessions } = useGroupStudySessions(groupId || "");
  const { data: polls, isLoading: pollsLoading } = useGroupPolls(groupId || "");
  const { getReadStatusForMessage } = useReadReceipts(groupId || "");
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();
  const leaveGroup = useLeaveGroup();
  const markAsRead = useMarkAsRead();
  const bulkMarkAsRead = useBulkMarkAsRead();
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(groupId || "");
  const { getReactionsForMessage } = useMessageReactions(groupId || "");
  const toggleReaction = useToggleReaction();
  const togglePin = useTogglePin();
  const { onlineUsers, isOnline } = useOnlinePresence(groupId || "");
  const { uploadAttachment, isUploading } = useUploadAttachment();
  const sendMentionNotifications = useMentionNotifications();
  const { searchTerm, setSearchTerm, results: searchResults, isLoading: searchLoading, isSearching, setIsSearching } = useMessageSearch(groupId || "");

  const isOwner = group?.owner_id === user?.id;
  const isAdmin = members?.find(m => m.user_id === user?.id)?.role === 'admin' || isOwner;
  const myName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const memberCount = members?.length || 0;

  // Keyboard avoidance for mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
      }
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (groupId && messages?.length) {
      markAsRead.mutate(groupId);
      
      // Also mark individual messages as read for read receipts
      const otherUserMessages = messages
        .filter(m => m.user_id !== user?.id)
        .map(m => m.id);
      
      if (otherUserMessages.length > 0) {
        bulkMarkAsRead.mutate({ messageIds: otherUserMessages, groupId });
      }
    }
  }, [groupId, messages?.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle scroll for FAB visibility
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollFab(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
          if (attachmentFile && newMessage) {
            await uploadAttachment(attachmentFile, newMessage.id);
          }
          
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

  const handleVoiceNoteSend = async (audioBlob: Blob) => {
    if (!groupId) return;

    // First send a placeholder message
    sendMessage.mutate(
      { groupId, content: "🎤 Voice note" },
      {
        onSuccess: async (newMessage) => {
          if (newMessage) {
            // Convert blob to File
            const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, {
              type: audioBlob.type,
            });
            await uploadAttachment(file, newMessage.id);
          }
        }
      }
    );
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

  const handleEditSave = async (newContent: string) => {
    if (!editingMessage || !groupId) return;
    await editMessage.mutateAsync({
      messageId: editingMessage.id,
      groupId,
      newContent,
    });
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
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount} members
            </span>
            {onlineUsers.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {onlineUsers.length} online
              </span>
            )}
          </div>
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

      {/* Upcoming Sessions Banner */}
      {studySessions && studySessions.length > 0 && (
        <UpcomingSessionsBanner 
          sessions={studySessions} 
          onViewAll={() => setActiveTab("sessions")} 
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Horizontal scrollable tabs on mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="mb-4 inline-flex min-w-max md:flex">
            <TabsTrigger value="chat" className="gap-2 min-w-[100px] touch-target">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2 min-w-[100px] touch-target">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Shared Notes</span>
              <span className="sm:hidden">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-2 min-w-[100px] touch-target">
              <BarChart3 className="w-4 h-4" />
              Polls
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2 min-w-[100px] touch-target">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
              <span className="sm:hidden">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2 min-w-[100px] touch-target">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Members ({memberCount})</span>
              <span className="sm:hidden">{memberCount}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-0">
          {/* Search Bar */}
          <div className="mb-2 flex justify-end">
            <MessageSearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              results={searchResults}
              isLoading={searchLoading}
              isOpen={isSearching}
              onOpenChange={setIsSearching}
              onResultClick={(messageId) => {
                console.log("Jump to message:", messageId);
              }}
            />
          </div>

          <div className="relative border border-border rounded-xl bg-card overflow-hidden">
            {/* Pinned Messages Panel */}
            <PinnedMessagesPanel
              pinnedMessages={pinnedMessages || []}
              groupId={groupId || ""}
              canUnpin={isAdmin}
              onJumpToMessage={(messageId) => {
                console.log("Jump to message:", messageId);
              }}
            />

            <ScrollArea 
              className={cn(
                "p-4",
                isMobile ? "h-[calc(100vh-20rem)]" : "h-[400px]"
              )}
              ref={scrollAreaRef}
              onScrollCapture={handleScroll}
            >
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
                        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full font-medium">
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
                          
                          const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                          const isContinuation = prevMsg && 
                            prevMsg.user_id === msg.user_id &&
                            (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 5 * 60 * 1000;

                          return (
                            <ChatMessageBubble
                              key={msg.id}
                              message={msg}
                              isMe={isMe}
                              isContinuation={!!isContinuation}
                              isOwner={isOwnerMember}
                              isAdmin={isAdmin}
                              displayName={displayName}
                              avatarUrl={msg.profiles?.avatar_url}
                              isOnline={isOnline(msg.user_id)}
                              myName={myName}
                              reactions={getReactionsForMessage(msg.id)}
                              readStatus={isMe ? getReadStatusForMessage(msg.id, msg.user_id, memberCount) : undefined}
                              onReply={() => handleReply(msg)}
                              onDelete={() => handleDeleteMessage(msg.id)}
                              onPin={() => togglePin.mutate({ 
                                messageId: msg.id, 
                                groupId: groupId || "",
                                isPinned: !!msg.is_pinned
                              })}
                              onToggleReaction={(emoji) => 
                                toggleReaction.mutate({ messageId: msg.id, emoji, groupId: groupId || "" })
                              }
                              onEdit={() => setEditingMessage(msg)}
                              isPinned={msg.is_pinned}
                              reactionsPending={toggleReaction.isPending}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Scroll to Bottom FAB */}
            <ScrollToBottomFab 
              show={showScrollFab} 
              onClick={scrollToBottom}
            />

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
            <form 
              onSubmit={handleSendMessage} 
              className="border-t border-border p-3 flex gap-2 items-end transition-all duration-200"
              style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 12 : undefined }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,audio/*"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <div className="flex-1">
                <MentionInput
                  value={message}
                  onChange={handleMessageChange}
                  onSubmit={() => handleSendMessage({ preventDefault: () => {} } as React.FormEvent)}
                  members={members || []}
                  placeholder="Type a message... Use @ to mention"
                  disabled={sendMessage.isPending || isUploading}
                />
              </div>

              {/* Voice recorder or send button */}
              {!message.trim() && !attachmentFile ? (
                <VoiceRecorderInput 
                  onSend={handleVoiceNoteSend}
                  disabled={sendMessage.isPending || isUploading}
                />
              ) : (
                <Button 
                  type="submit" 
                  size="icon" 
                  className="shrink-0"
                  disabled={(!message.trim() && !attachmentFile) || sendMessage.isPending || isUploading}
                >
                  {sendMessage.isPending || isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              )}
            </form>
          </div>
        </TabsContent>

        {/* Shared Notes Tab */}
        <TabsContent value="notes" className="mt-0">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {sharedNotes?.length || 0} shared notes
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-4 h-4 mr-1" />
                Share Existing
              </Button>
              <Button size="sm" onClick={() => setUploadNoteModalOpen(true)}>
                <FileText className="w-4 h-4 mr-1" />
                Create New
              </Button>
            </div>
          </div>

          {notesLoading ? (
            <div className="grid gap-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : !sharedNotes?.length ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No notes shared yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Share an existing note or create a new one
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
                  Share Existing
                </Button>
                <Button size="sm" onClick={() => setUploadNoteModalOpen(true)}>
                  Create New
                </Button>
              </div>
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

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="mt-0">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {studySessions?.length || 0} scheduled sessions
            </p>
            <Button size="sm" onClick={() => setScheduleModalOpen(true)}>
              <CalendarPlus className="w-4 h-4 mr-1" />
              Schedule Session
            </Button>
          </div>

          {!studySessions?.length ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No sessions scheduled yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setScheduleModalOpen(true)}>
                Schedule your first session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {studySessions.map((session) => (
                <StudySessionCard 
                  key={session.id} 
                  session={session}
                  groupId={groupId || ""}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Polls Tab */}
        <TabsContent value="polls" className="mt-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Group Polls</h3>
            <Button onClick={() => setPollModalOpen(true)} size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          </div>

          {pollsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="border border-border rounded-xl p-4">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-6 w-full mb-3" />
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : !polls?.length ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-1">No polls yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create a poll to get group input on decisions</p>
              <Button onClick={() => setPollModalOpen(true)} size="sm">
                Create First Poll
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <PollCard 
                  key={poll.id} 
                  poll={poll}
                  groupId={groupId || ""}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-0">
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
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

      <ScheduleSessionModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        groupId={groupId || ""}
      />

      <UploadNoteModal
        open={uploadNoteModalOpen}
        onOpenChange={setUploadNoteModalOpen}
        groupId={groupId || ""}
      />

      <MessageEditModal
        open={!!editingMessage}
        onOpenChange={(open) => !open && setEditingMessage(null)}
        originalContent={editingMessage?.content || ""}
        onSave={handleEditSave}
      />

      <CreatePollModal
        open={pollModalOpen}
        onOpenChange={setPollModalOpen}
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
