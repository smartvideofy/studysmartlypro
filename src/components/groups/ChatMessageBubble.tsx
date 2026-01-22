import React, { useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { format } from "date-fns";
import { 
  Check, 
  CheckCheck, 
  Crown, 
  MoreHorizontal, 
  Pin, 
  Trash2, 
  Reply as ReplyIcon,
  Copy,
  Forward,
  Star,
  Edit3
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          className={cn(
            "relative flex gap-2 max-w-[85%] group/message",
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
                isMe ? "-right-8" : "-left-8"
              )}
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <ReplyIcon className="w-3.5 h-3.5 text-primary" />
              </div>
            </motion.div>
          )}

          {/* Avatar - only show for first in sequence */}
          {!isMe && !isContinuation ? (
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 ring-2 ring-background shadow-md">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <OnlineIndicator 
                isOnline={isOnline} 
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
              <span className="text-xs text-muted-foreground mb-1 ml-1 flex items-center gap-1 font-medium">
                {isOwner && <Crown className="w-3 h-3 text-yellow-500" />}
                {displayName}
              </span>
            )}

            <div className="flex flex-col gap-1">
              {/* Reply reference */}
              {message.reply_to && (
                <div className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg border-l-2 border-primary/50 bg-secondary/70 max-w-[200px] backdrop-blur-sm",
                  isMe ? "ml-auto" : ""
                )}>
                  <span className="font-semibold text-primary text-[10px]">
                    {message.reply_to.profiles?.full_name || "Unknown"}
                  </span>
                  <p className="truncate opacity-70">{message.reply_to.content}</p>
                </div>
              )}

              {/* Message bubble with WhatsApp-style tail */}
              <div className="relative">
                {/* Pinned indicator */}
                {isPinned && (
                  <div className={cn(
                    "absolute -top-1.5 z-10",
                    isMe ? "-left-1.5" : "-right-1.5"
                  )}>
                    <Pin className="w-3 h-3 text-primary fill-primary" />
                  </div>
                )}

                {/* Main bubble - using semantic tokens */}
                <div
                  className={cn(
                    "relative px-3 py-2 rounded-2xl text-sm max-w-md break-words shadow-sm",
                    isMe
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                      : "bg-secondary/80 backdrop-blur-sm",
                    // Tail styling
                    !isContinuation && isMe && "rounded-tr-sm",
                    !isContinuation && !isMe && "rounded-tl-sm"
                  )}
                >
                  {isVoiceNote && voiceAttachment ? (
                    <VoiceNoteMessage
                      audioUrl={voiceAttachment.file_path}
                      duration={0}
                      isMe={isMe}
                    />
                  ) : (
                    renderMessageWithMentions(message.content, myName)
                  )}
                </div>
              </div>

              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && !isVoiceNote && (
                <MessageAttachments attachments={message.attachments} isMe={isMe} />
              )}
            </div>

            {/* Message Reactions */}
            <MessageReactions
              reactions={reactions}
              onToggleReaction={onToggleReaction}
              isMe={isMe}
              isPending={reactionsPending}
            />

            {/* Timestamp and read receipts */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(message.created_at), "h:mm a")}
              </span>
              
              {/* Read receipts for own messages */}
              {isMe && readStatus && (
                <span className="flex items-center">
                  {readStatus.isReadByAll ? (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  ) : readStatus.isDelivered ? (
                    <CheckCheck className="w-3.5 h-3.5 text-muted-foreground/60" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-muted-foreground/60" />
                  )}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        {/* Quick emoji reactions */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="text-lg hover:scale-125 transition-transform p-0.5"
              onClick={() => onToggleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        <ContextMenuItem onClick={onReply}>
          <ReplyIcon className="w-4 h-4 mr-2" />
          Reply
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </ContextMenuItem>

        {isMe && onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </ContextMenuItem>
        )}

        {isAdmin && (
          <ContextMenuItem onClick={onPin}>
            <Pin className="w-4 h-4 mr-2" />
            {isPinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem>
          <Forward className="w-4 h-4 mr-2" />
          Forward
        </ContextMenuItem>

        <ContextMenuItem>
          <Star className="w-4 h-4 mr-2" />
          Star
        </ContextMenuItem>

        {isMe && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
