import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

interface Member {
  user_id: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  members: Member[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface MentionInputHandle {
  focus: () => void;
}

export const MentionInput = forwardRef<MentionInputHandle, MentionInputProps>(({
  value,
  onChange,
  onSubmit,
  members,
  placeholder = "Type a message...",
  disabled = false,
  className
}, ref) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus()
  }));

  const filteredMembers = members.filter(m => {
    const name = m.profiles?.full_name?.toLowerCase() || "";
    return name.includes(mentionQuery.toLowerCase());
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % filteredMembers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredMembers[suggestionIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const selectMention = (member: Member) => {
    const name = member.profiles?.full_name || "Unknown";
    const beforeMention = value.substring(0, mentionStartPos);
    const afterMention = value.substring(inputRef.current?.selectionStart || mentionStartPos + mentionQuery.length + 1);
    const newValue = `${beforeMention}@${name} ${afterMention}`;
    onChange(newValue);
    setShowSuggestions(false);
    setMentionQuery("");
    setMentionStartPos(-1);
    
    // Set cursor position after the mention
    setTimeout(() => {
      const newPos = mentionStartPos + name.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    onChange(newValue);

    // Check for @ trigger
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtPos + 1);
      // Only show suggestions if there's no space after @
      if (!textAfterAt.includes(" ")) {
        setMentionStartPos(lastAtPos);
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
        setSuggestionIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full h-10 px-4 rounded-lg bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
          className
        )}
      />
      
      {/* Mention suggestions dropdown */}
      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 w-full mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="max-h-40 overflow-y-auto">
            {filteredMembers.map((member, idx) => (
              <button
                key={member.user_id}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent transition-colors",
                  idx === suggestionIndex && "bg-accent"
                )}
                onClick={() => selectMention(member)}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium">
                  {member.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <span>{member.profiles?.full_name || "Unknown"}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MentionInput.displayName = "MentionInput";

// Utility to parse mentions from message content
export function parseMentions(content: string): { text: string; mentions: string[] } {
  const mentionRegex = /@([A-Za-z\s]+?)(?=\s|$|@)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].trim());
  }
  
  return { text: content, mentions };
}

// Render message content with highlighted mentions
export function renderMessageWithMentions(content: string, currentUserName?: string) {
  const parts = content.split(/(@[A-Za-z\s]+?)(?=\s|$|@)/g);
  
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      const name = part.substring(1).trim();
      const isCurrentUser = currentUserName && name.toLowerCase() === currentUserName.toLowerCase();
      return (
        <span 
          key={idx} 
          className={cn(
            "font-medium",
            isCurrentUser ? "text-yellow-300" : "text-blue-300"
          )}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
