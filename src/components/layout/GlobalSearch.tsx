import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Layers, Users, X, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudyMaterials } from "@/hooks/useStudyMaterials";
import { useDecks } from "@/hooks/useFlashcards";
import { useGroups } from "@/hooks/useGroups";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: "material" | "deck" | "group";
  path: string;
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const { data: materials, isLoading: materialsLoading } = useStudyMaterials();
  const { data: decks, isLoading: decksLoading } = useDecks();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  
  const isLoading = materialsLoading || decksLoading || groupsLoading;

  // Reset query when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const searchQuery = query.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search materials
    materials?.forEach((m) => {
      if (
        m.title.toLowerCase().includes(searchQuery) ||
        m.subject?.toLowerCase().includes(searchQuery) ||
        m.topic?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: m.id,
          title: m.title,
          subtitle: m.subject || m.file_type?.toUpperCase(),
          type: "material",
          path: `/materials/${m.id}`,
        });
      }
    });

    // Search decks
    decks?.forEach((d) => {
      if (
        d.name.toLowerCase().includes(searchQuery) ||
        d.subject?.toLowerCase().includes(searchQuery) ||
        d.description?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: d.id,
          title: d.name,
          subtitle: d.subject || `${d.card_count || 0} cards`,
          type: "deck",
          path: `/flashcards/${d.id}`,
        });
      }
    });

    // Search groups
    groups?.forEach((g) => {
      if (
        g.name.toLowerCase().includes(searchQuery) ||
        g.description?.toLowerCase().includes(searchQuery)
      ) {
        allResults.push({
          id: g.id,
          title: g.name,
          subtitle: `${g.member_count || 1} members`,
          type: "group",
          path: `/groups/${g.id}`,
        });
      }
    });

    return allResults.slice(0, 10); // Limit to 10 results
  }, [query, materials, decks, groups]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    navigate(result.path);
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "material":
        return FileText;
      case "deck":
        return Layers;
      case "group":
        return Users;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "material":
        return "bg-primary/10 text-primary";
      case "deck":
        return "bg-accent/10 text-accent";
      case "group":
        return "bg-success/10 text-success";
    }
  };

  // Mobile fullscreen layout
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="h-full w-full max-w-full max-h-full p-0 gap-0 rounded-none border-0 [&>button]:hidden">
          {/* Mobile Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-background pt-safe">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0 h-10 w-10 touch-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="pl-10 h-12 text-base border-0 bg-secondary/50"
                autoFocus
              />
            </div>
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuery("")}
                className="shrink-0 h-10 w-10 touch-target"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto pb-safe">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : query && results.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground px-4">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-base">No results found for "{query}"</p>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2">
                {results.map((result) => {
                  const Icon = getIcon(result.type);
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-secondary active:bg-secondary transition-colors text-left group touch-target"
                    >
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", getTypeColor(result.type))}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <Badge variant="muted" className="text-xs capitalize shrink-0">
                        {result.type}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-4">Quick links</p>
                <div className="space-y-1">
                  {[
                    { label: "Study Materials", path: "/materials", icon: FileText },
                    { label: "Flashcard Decks", path: "/flashcards", icon: Layers },
                    { label: "Study Groups", path: "/groups", icon: Users },
                  ].map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        onOpenChange(false);
                        navigate(item.path);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-secondary active:bg-secondary transition-colors text-left touch-target"
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="text-base">{item.label}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop layout
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search materials, flashcards, groups..."
            className="border-0 p-0 h-auto focus-visible:ring-0 text-base"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setQuery("")}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : query && results.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => {
                const Icon = getIcon(result.type);
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left group"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", getTypeColor(result.type))}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <Badge variant="muted" className="text-xs capitalize shrink-0">
                      {result.type}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-3">Quick links</p>
              <div className="space-y-1">
                {[
                  { label: "Study Materials", path: "/materials", icon: FileText },
                  { label: "Flashcard Decks", path: "/flashcards", icon: Layers },
                  { label: "Study Groups", path: "/groups", icon: Users },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      onOpenChange(false);
                      navigate(item.path);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">ESC</kbd> to close</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd> to search</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
