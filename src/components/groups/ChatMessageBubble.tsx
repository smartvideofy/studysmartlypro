import React, { useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { format } from "date-fns";
import { 
  Check, 
  CheckCheck, 
  Crown, 
  Shield,
  Pin, 
  Trash2, 
  Reply as ReplyIcon,
  Copy,
  Forward,
  Star,
  Edit3,
  Pencil
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { OnlineIndicator } from "./OnlineIndicator";
import { MessageReactions } from "./MessageReactions";
import { MessageAttachments } from "./MessageAttachments";
import { VoiceNoteMessage } from "./VoiceNoteMessage";
import { renderMessageWithMentions } from "./MentionInput";
import { cn } from "@/lib/utils";
import { GroupMessage } from "@/hooks/useGroupChat";
import { ReactionSummary } from "@/hooks/useMessageReactions";
import { toast } from "sonner";

interface MessageReadStatus {
  isDelivered: boolean;
  isReadByAll: boolean;
  readByCount: number;
  totalRecipients: number;
}

interface ChatMessageBubbleProps {
  message: GroupMessage;
  isMe: boolean;
  isContinuation: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  displayName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  myName: string;
  reactions: ReactionSummary[];
  readStatus?: MessageReadStatus;
  onReply: () => void;
  onDelete: () => void;
  onPin: () => void;
  onToggleReaction: (emoji: string) => void;
  onEdit?: () => void;
  isPinned?: boolean;
  reactionsPending?: boolean;
}

const SWIPE_THRESHOLD = 60;
const QUICK_EMOJIS = ["❤️", "😂", "👍", "🔥", "😮", "😢"];

export function ChatMessageBubble({
  message,
  isMe,
  isContinuation,
  isOwner,
  isAdmin,
  displayName,
  avatarUrl,
  isOnline,
  myName,
  reactions,
  readStatus,
  onReply,
  onDelete,
  onPin,
  onToggleReaction,
  onEdit,
  isPinned,
  reactionsPending,
}: ChatMessageBubbleProps) {
  const controls = useAnimation();
  const [showReplyIndicator, setShowReplyIndicator] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      onReply();
    }
    setShowReplyIndicator(false);
    await controls.start({ x: 0 });
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD / 2) {
      setShowReplyIndicator(true);
    } else {
      setShowReplyIndicator(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Message copied");
  };

  const isVoiceNote = message.content.startsWith("🎤 Voice note") || 
    message.attachments?.some(a => a.mime_type?.startsWith("audio/"));

  const voiceAttachment = message.attachments?.find(a => a.mime_type?.startsWith("audio/"));

  // Generate avatar color based on name for consistency
  const getAvatarColor = (name: string) => {
    const colors = [
      "from-rose-400 to-rose-600",
      "from-orange-400 to-orange-600",
      "from-amber-400 to-amber-600",
      "from-emerald-400 to-emerald-600",
      "from-teal-400 to-teal-600",
      "from-cyan-400 to-cyan-600",
      "from-blue-400 to-blue-600",
      "from-indigo-400 to-indigo-600",
      "from-violet-400 to-violet-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
    ];
    const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const canEdit = isMe && message.created_at && 
    (new Date().getTime() - new Date(message.created_at).getTime()) < 15 * 60 * 1000;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          className={cn(
            "relative flex gap-2.5 max-w-[85%] group/message",
            isMe ? "ml-auto flex-row-reverse" : "items-end"
          )}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.3 }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={controls}
          whileTap={{ scale: 0.98 }}
        >
          {/* Swipe to reply indicator */}
          {showReplyIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 z-10",
                isMe ? "-right-10" : "-left-10"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <ReplyIcon className="w-4 h-4 text-primary-foreground" />
              </div>
            </motion.div>
          )}

          {/* Avatar - only show for first in sequence (NOT for own messages) */}
          {!isMe && !isContinuation ? (
            <div className="relative shrink-0 self-end mb-5">
              <Avatar className="h-9 w-9 ring-2 ring-background shadow-lg">
                <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                <AvatarFallback className={cn(
                  "text-xs font-semibold text-white bg-gradient-to-br",
                  getAvatarColor(displayName)
                )}>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <OnlineIndicator 
                isOnline={isOnline} 
                size="sm"
                className="absolute -bottom-0.5 -right-0.5 ring-2 ring-background"
              />
            </div>
          ) : !isMe ? (
            <div className="w-9 shrink-0" />
          ) : null}

          <div className={cn("flex flex-col min-w-0", isMe ? "items-end" : "items-start")}>
            {/* Sender name with role badge - only for first in sequence */}
            {!isMe && !isContinuation && (
              <div className="flex items-center gap-1.5 mb-1 ml-1">
                <span className={cn(
                  "text-xs font-semibold",
                  isOwner ? "text-amber-600 dark:text-amber-400" : 
                  isAdmin ? "text-blue-600 dark:text-blue-400" : 
                  "text-foreground/80"
                )}>
                  {displayName || "Unknown User"}
                </span>
                {isOwner && (
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                    <Crown className="w-2.5 h-2.5" />
                    Owner
                  </span>
                )}
                {isAdmin && !isOwner && (
                  <span className="flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                    <Shield className="w-2.5 h-2.5" />
                    Admin
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              {/* Reply reference */}
              {message.reply_to && (
                <div className={cn(
                  "text-xs px-3 py-2 rounded-xl border-l-3 max-w-[220px]",
                  isMe 
                    ? "bg-primary-foreground/10 border-primary-foreground/40 ml-auto" 
                    : "bg-muted/50 border-primary/50"
                )}>
                  <span className={cn(
                    "font-semibold text-[11px] block",
                    isMe ? "text-primary-foreground/90" : "text-primary"
                  )}>
                    {message.reply_to.profiles?.full_name || "Unknown"}
                  </span>
                  <p className={cn(
                    "truncate mt-0.5",
                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.reply_to.content}
                  </p>
                </div>
              )}

              {/* Message bubble with WhatsApp-style tail */}
              <div className="relative">
                {/* Pinned indicator */}
                {isPinned && (
                  <div className={cn(
                    "absolute -top-2 z-10",
                    isMe ? "-left-2" : "-right-2"
                  )}>
                    <div className="bg-primary rounded-full p-1 shadow-md">
                      <Pin className="w-2.5 h-2.5 text-primary-foreground fill-current" />
                    </div>
                  </div>
                )}

                {/* WhatsApp-style tail */}
                {!isContinuation && (
                  <div className={cn(
                    "absolute top-0 w-3 h-3",
                    isMe 
                      ? "right-[-6px] text-primary" 
                      : "left-[-6px] text-secondary/80"
                  )}>
                    <svg viewBox="0 0 8 13" className="w-full h-full fill-current">
                      {isMe ? (
                        <path d="M5.188,1H0v11.193l6.467-8.625C7.526,2.156,6.958,1,5.188,1z" />
                      ) : (
                        <path d="M2.812,1H8v11.193L1.533,3.568C0.474,2.156,1.042,1,2.812,1z" />
                      )}
                    </svg>
                  </div>
                )}

                {/* Main bubble */}
                <div
                  className={cn(
                    "relative px-3 py-2 rounded-2xl text-sm max-w-sm break-words",
                    isMe
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary/80 text-foreground shadow-sm",
                    // Tail styling adjustments
                    !isContinuation && isMe && "rounded-tr-[4px]",
                    !isContinuation && !isMe && "rounded-tl-[4px]"
                  )}
                >
                  {isVoiceNote && voiceAttachment ? (
                    <VoiceNoteMessage
                      audioUrl={voiceAttachment.file_path}
                      duration={0}
                      isMe={isMe}
                    />
                  ) : (
                    <span className="whitespace-pre-wrap">
                      {renderMessageWithMentions(message.content, myName)}
                    </span>
                  )}

                  {/* Inline timestamp for compact look */}
                  <span className={cn(
                    "inline-flex items-center gap-1 float-right ml-2 mt-1 text-[10px]",
                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {message.is_edited && (
                      <Pencil className="w-2.5 h-2.5" />
                    )}
                    {format(new Date(message.created_at), "h:mm a")}
                    {isMe && readStatus && (
                      <>
                        {readStatus.isReadByAll ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                        ) : readStatus.isDelivered ? (
                          <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                        ) : (
                          <Check className="w-3.5 h-3.5 opacity-70" />
                        )}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && !isVoiceNote && (
                <MessageAttachments attachments={message.attachments} isMe={isMe} />
              )}
            </div>

            {/* Message Reactions */}
            {reactions.length > 0 && (
              <MessageReactions
                reactions={reactions}
                onToggleReaction={onToggleReaction}
                isMe={isMe}
                isPending={reactionsPending}
              />
            )}
          </div>
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52 p-1">
        {/* Quick emoji reactions */}
        <div className="flex items-center justify-around px-2 py-2 border-b border-border mb-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="text-xl hover:scale-125 active:scale-95 transition-transform p-1 rounded-full hover:bg-muted"
              onClick={() => onToggleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        <ContextMenuItem onClick={onReply} className="gap-2">
          <ReplyIcon className="w-4 h-4" />
          Reply
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCopy} className="gap-2">
          <Copy className="w-4 h-4" />
          Copy text
        </ContextMenuItem>

        {canEdit && onEdit && (
          <ContextMenuItem onClick={onEdit} className="gap-2">
            <Edit3 className="w-4 h-4" />
            Edit
          </ContextMenuItem>
        )}

        {isAdmin && (
          <ContextMenuItem onClick={onPin} className="gap-2">
            <Pin className="w-4 h-4" />
            {isPinned ? "Unpin message" : "Pin message"}
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem className="gap-2">
          <Forward className="w-4 h-4" />
          Forward
        </ContextMenuItem>

        <ContextMenuItem className="gap-2">
          <Star className="w-4 h-4" />
          Star message
        </ContextMenuItem>

        {isMe && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete for everyone
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
