import { useState } from "react";
import { motion } from "framer-motion";
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
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import { useNotes } from "@/hooks/useNotes";
import { useFolders } from "@/hooks/useNotes";
import { formatDistanceToNow } from "date-fns";

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

const folderColors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
];

export default function NotesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: folders, isLoading: foldersLoading } = useFolders();

  const isLoading = notesLoading || foldersLoading;

  // Filter notes based on search query
  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get note count per folder
  const getFolderNoteCount = (folderId: string) => {
    return notes?.filter(note => note.folder_id === folderId).length || 0;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Notes">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
            
            <Button variant="hero" size="sm" asChild>
              <Link to="/notes/new">
                <Plus className="w-4 h-4" />
                New Note
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Folders */}
        {folders && folders.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="font-display text-lg font-semibold mb-4">Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {folders.map((folder, index) => (
                <Link
                  key={folder.id}
                  to={`/notes?folder=${folder.id}`}
                  className="glass-card-hover rounded-xl p-4 flex items-center gap-3 group"
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", folderColors[index % folderColors.length])}>
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{folder.name}</h4>
                    <p className="text-xs text-muted-foreground">{getFolderNoteCount(folder.id)} notes</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Notes */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">All Notes</h3>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Recently Updated
            </Button>
          </div>
          
          {filteredNotes.length > 0 ? (
            <div className={cn(
              "gap-4",
              viewMode === "grid" 
                ? "grid md:grid-cols-2 lg:grid-cols-3" 
                : "flex flex-col"
            )}>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  variants={itemVariants}
                  layoutId={`note-${note.id}`}
                >
                  <Card variant="interactive" className="group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {note.folder_id && (
                            <Badge variant="muted" className="text-xs">
                              {folders?.find(f => f.id === note.folder_id)?.name || 'Folder'}
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
                      
                      {note.content && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {note.content.substring(0, 150)}...
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 flex-wrap">
                          {note.is_public && (
                            <Badge variant="ghost" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-6">Create your first note to get started</p>
              <Button variant="hero" asChild>
                <Link to="/notes/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
