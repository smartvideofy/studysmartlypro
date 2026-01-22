import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchResult } from "@/hooks/useMessageSearch";

interface MessageSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onResultClick: (messageId: string) => void;
}

export function MessageSearchBar({
  searchTerm,
  onSearchChange,
  results,
  isLoading,
  isOpen,
  onOpenChange,
  onResultClick,
}: MessageSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (searchTerm.trim() === "") {
          onOpenChange(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchTerm, onOpenChange]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const highlightMatch = (text: string, term: string) => {
    if (!term.trim()) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 px-0.5 rounded">{part}</mark>
      ) : part
    );
  };

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onOpenChange(true)}
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="pl-9 pr-8 h-8"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            onSearchChange("");
            onOpenChange(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {searchTerm.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <ScrollArea className="max-h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No messages found for "{searchTerm}"
              </div>
            ) : (
              <div className="divide-y divide-border">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onResultClick(result.id);
                      onSearchChange("");
                      onOpenChange(false);
                    }}
                    className="w-full p-3 text-left hover:bg-secondary/50 transition-colors flex items-start gap-3"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={result.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(result.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {result.profiles?.full_name || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(result.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 line-clamp-2">
                        {highlightMatch(result.content, searchTerm)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
