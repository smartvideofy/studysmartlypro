import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Folder, 
  FileText, 
  MoreHorizontal,
  Clock,
  Tag,
  Grid3X3,
  List,
  Filter,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";

const folders = [
  { id: 1, name: "Chemistry", count: 12, color: "bg-primary/10 text-primary" },
  { id: 2, name: "History", count: 8, color: "bg-accent/10 text-accent" },
  { id: 3, name: "Mathematics", count: 15, color: "bg-success/10 text-success" },
  { id: 4, name: "Biology", count: 6, color: "bg-warning/10 text-warning" },
];

const notes = [
  { 
    id: 1, 
    title: "Organic Chemistry - Reactions & Mechanisms", 
    folder: "Chemistry",
    excerpt: "Understanding the fundamental reaction types including substitution, elimination, and addition reactions...",
    tags: ["organic", "reactions", "mechanisms"],
    updated: "2 hours ago",
    hasFlashcards: true,
  },
  { 
    id: 2, 
    title: "World War II - Major Events Timeline", 
    folder: "History",
    excerpt: "A comprehensive timeline of major events from 1939 to 1945, including key battles and political developments...",
    tags: ["wwii", "timeline", "events"],
    updated: "5 hours ago",
    hasFlashcards: true,
  },
  { 
    id: 3, 
    title: "Calculus - Integration Techniques", 
    folder: "Mathematics",
    excerpt: "Advanced integration methods including integration by parts, partial fractions, and trigonometric substitution...",
    tags: ["calculus", "integration"],
    updated: "1 day ago",
    hasFlashcards: false,
  },
  { 
    id: 4, 
    title: "Cell Biology - Mitosis & Meiosis", 
    folder: "Biology",
    excerpt: "Comparing the processes of mitosis and meiosis, their stages, and significance in reproduction...",
    tags: ["cells", "division"],
    updated: "2 days ago",
    hasFlashcards: true,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function NotesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DashboardLayout title="Notes">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header Actions */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "grid" ? "bg-secondary" : "hover:bg-secondary/50"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "list" ? "bg-secondary" : "hover:bg-secondary/50"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            
            <Button variant="hero" size="sm">
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </div>
        </motion.div>

        {/* Folders */}
        <motion.div variants={itemVariants}>
          <h3 className="font-display text-lg font-semibold mb-4">Folders</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                to={`/notes/folder/${folder.id}`}
                className="glass-card-hover rounded-xl p-4 flex items-center gap-3 group"
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", folder.color)}>
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{folder.name}</h4>
                  <p className="text-xs text-muted-foreground">{folder.count} notes</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* All Notes */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">All Notes</h3>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Recently Updated
            </Button>
          </div>
          
          <div className={cn(
            "gap-4",
            viewMode === "grid" 
              ? "grid md:grid-cols-2 lg:grid-cols-3" 
              : "flex flex-col"
          )}>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                variants={itemVariants}
                layoutId={`note-${note.id}`}
              >
                <Card variant="interactive" className="group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="muted" className="text-xs">
                          {note.folder}
                        </Badge>
                        {note.hasFlashcards && (
                          <Badge variant="accent" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Flashcards
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Link to={`/notes/${note.id}`}>
                      <h4 className="font-display font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">
                        {note.title}
                      </h4>
                    </Link>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {note.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 flex-wrap">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="ghost" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {note.updated}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
