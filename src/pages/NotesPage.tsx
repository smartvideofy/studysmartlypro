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
  Grid3X3,
  List,
  Loader2,
  Edit,
  Trash2,
  FolderPlus,
  Sparkles,
  BookOpen,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreateFolderModal } from "@/components/notes/CreateFolderModal";
import { DeleteConfirmModal } from "@/components/notes/DeleteConfirmModal";
import { AISummaryModal } from "@/components/notes/AISummaryModal";
import { AIFlashcardsModal } from "@/components/notes/AIFlashcardsModal";
import { ImportDocumentModal } from "@/components/notes/ImportDocumentModal";
import { cn } from "@/lib/utils";
import { useNotes, useFolders, useDeleteNote, useDeleteFolder, Folder as FolderType, Note } from "@/hooks/useNotes";
import { useAISummarize, useAIGenerateFlashcardsAdvanced } from "@/hooks/useAINotes";
import { formatDistanceToNow } from "date-fns";
import { ErrorRecovery } from "@/components/ui/error-recovery";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [summaryNote, setSummaryNote] = useState<Note | null>(null);
  const [flashcardsNote, setFlashcardsNote] = useState<Note | null>(null);
  const [importDocumentOpen, setImportDocumentOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: notes, isLoading: notesLoading, isError: notesError } = useNotes();
  const { data: folders, isLoading: foldersLoading, isError: foldersError } = useFolders();
  const deleteNote = useDeleteNote();
  const deleteFolder = useDeleteFolder();
  const { summarize, isLoading: summaryLoading, summary } = useAISummarize();
  const { generateFlashcards, isLoading: flashcardsLoading, flashcards } = useAIGenerateFlashcardsAdvanced();

  const isLoading = notesLoading || foldersLoading;
  const hasError = notesError || foldersError;

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  // Filter notes based on search query
  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get note count per folder
  const getFolderNoteCount = (folderId: string) => {
    return notes?.filter(note => note.folder_id === folderId).length || 0;
  };

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return;
    try {
      await deleteFolder.mutateAsync(deletingFolder.id);
      setDeletingFolder(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteNote = async () => {
    if (!deletingNoteId) return;
    try {
      await deleteNote.mutateAsync(deletingNoteId);
      setDeletingNoteId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSummarize = (note: Note) => {
    setSummaryNote(note);
    if (note.content) {
      summarize(note.title, note.content);
    }
  };

  const handleGenerateFlashcards = (note: Note) => {
    setFlashcardsNote(note);
    if (note.content) {
      generateFlashcards(note.title, note.content, { cardCount: 10, difficulty: 'mixed', cardType: 'mixed' });
    }
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

  if (hasError) {
    return (
      <DashboardLayout title="Notes">
        <ErrorRecovery
          title="Failed to load notes"
          message="We couldn't load your notes. Please check your connection and try again."
          onRetry={handleRetry}
        />
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
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors touch-target",
                  viewMode === "grid" ? "bg-secondary" : "hover:bg-secondary/50"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-colors touch-target",
                  viewMode === "list" ? "bg-secondary" : "hover:bg-secondary/50"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)} className="h-10 touch-target">
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">New Folder</span>
            </Button>

            <Button variant="outline" size="sm" onClick={() => setImportDocumentOpen(true)} className="h-10 touch-target">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Import</span>
            </Button>
            
            <Button variant="hero" size="sm" asChild className="h-10 touch-target">
              <Link to="/notes/new">
                <Plus className="w-4 h-4" />
                <span className="ml-2">New Note</span>
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Folders */}
        {folders && folders.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="font-display text-lg font-semibold mb-4">Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="glass-card-hover rounded-xl p-4 flex items-center gap-3 group relative"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${folder.color}20` }}
                  >
                    <Folder className="w-5 h-5" style={{ color: folder.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{folder.name}</h4>
                    <p className="text-xs text-muted-foreground">{getFolderNoteCount(folder.id)} notes</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className={cn(
                          "transition-opacity touch-target",
                          isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingFolder(folder)} className="touch-target">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingFolder(folder)}
                        className="text-destructive focus:text-destructive touch-target"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
              {filteredNotes.map((note) => {
                const folder = folders?.find(f => f.id === note.folder_id);
                return (
                  <motion.div
                    key={note.id}
                    variants={itemVariants}
                    layoutId={`note-${note.id}`}
                  >
                    <Card variant="interactive" className="group">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {folder && (
                              <Badge 
                                variant="muted" 
                                className="text-xs"
                                style={{ borderColor: folder.color }}
                              >
                                {folder.name}
                              </Badge>
                            )}
                            {note.is_public && (
                              <Badge variant="accent" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon-sm" 
                                className={cn(
                                  "transition-opacity touch-target",
                                  isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild className="touch-target">
                                <Link to={`/notes/${note.id}`}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleSummarize(note)}
                                disabled={!note.content}
                                className="touch-target"
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                AI Summary
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleGenerateFlashcards(note)}
                                disabled={!note.content}
                                className="touch-target"
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Generate Flashcards
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeletingNoteId(note.id)}
                                className="text-destructive focus:text-destructive touch-target"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                        
                        <div className="flex items-center justify-end">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : notes && notes.length === 0 ? (
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
          ) : (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-semibold mb-2">No matching notes</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Modals */}
      <CreateFolderModal 
        open={createFolderOpen} 
        onOpenChange={setCreateFolderOpen}
      />

      <CreateFolderModal 
        open={!!editingFolder} 
        onOpenChange={(open) => !open && setEditingFolder(null)}
        folder={editingFolder}
      />

      <DeleteConfirmModal
        open={!!deletingFolder}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
        title="Delete Folder"
        description={`Are you sure you want to delete "${deletingFolder?.name}"? Notes in this folder will not be deleted but will be moved out of the folder.`}
        onConfirm={handleDeleteFolder}
        isLoading={deleteFolder.isPending}
      />

      <DeleteConfirmModal
        open={!!deletingNoteId}
        onOpenChange={(open) => !open && setDeletingNoteId(null)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={handleDeleteNote}
        isLoading={deleteNote.isPending}
      />

      <AISummaryModal
        open={!!summaryNote}
        onOpenChange={(open) => !open && setSummaryNote(null)}
        summary={summary}
        isLoading={summaryLoading}
        noteTitle={summaryNote?.title || ''}
      />

      <AIFlashcardsModal
        open={!!flashcardsNote}
        onOpenChange={(open) => !open && setFlashcardsNote(null)}
        flashcards={flashcards}
        isLoading={flashcardsLoading}
        noteTitle={flashcardsNote?.title || ''}
        noteId={flashcardsNote?.id || ''}
      />

      <ImportDocumentModal
        open={importDocumentOpen}
        onOpenChange={setImportDocumentOpen}
      />
    </DashboardLayout>
  );
}
