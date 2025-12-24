import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Save,
  MoreHorizontal,
  Image,
  Mic,
  Link as LinkIcon,
  Sparkles,
  Layers,
  Tag,
  Folder,
  Clock,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Loader2,
  Trash2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DeleteConfirmModal } from "@/components/notes/DeleteConfirmModal";
import { 
  useNote, 
  useCreateNote, 
  useUpdateNote, 
  useDeleteNote,
  useFolders,
  useTags,
  useNoteTags,
  useAddTagToNote,
  useRemoveTagFromNote,
  useCreateTag
} from "@/hooks/useNotes";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const toolbarButtons = [
  { icon: Bold, label: "Bold" },
  { icon: Italic, label: "Italic" },
  { icon: Heading1, label: "Heading 1" },
  { icon: Heading2, label: "Heading 2" },
  { icon: List, label: "Bullet List" },
  { icon: ListOrdered, label: "Numbered List" },
  { icon: Quote, label: "Quote" },
  { icon: Code, label: "Code" },
];

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewNote = !id || id === "new";
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  const { data: note, isLoading: noteLoading } = useNote(isNewNote ? "" : id!);
  const { data: folders } = useFolders();
  const { data: tags } = useTags();
  const { data: noteTags, isLoading: noteTagsLoading } = useNoteTags(isNewNote ? "" : id!);
  
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createTag = useCreateTag();
  const addTagToNote = useAddTagToNote();
  const removeTagFromNote = useRemoveTagFromNote();

  // Load note data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || "");
      setFolderId(note.folder_id);
      setLastSaved(new Date(note.updated_at));
      setHasChanges(false);
    }
  }, [note]);

  // Track changes
  useEffect(() => {
    if (!isNewNote && note) {
      const changed = 
        title !== note.title || 
        content !== (note.content || "") ||
        folderId !== note.folder_id;
      setHasChanges(changed);
    } else if (isNewNote) {
      setHasChanges(title.length > 0 || content.length > 0);
    }
  }, [title, content, folderId, note, isNewNote]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      if (isNewNote) {
        const newNote = await createNote.mutateAsync({
          title: title.trim(),
          content,
          folder_id: folderId || undefined,
        });
        navigate(`/notes/${newNote.id}`, { replace: true });
      } else {
        await updateNote.mutateAsync({
          id: id!,
          title: title.trim(),
          content,
          folder_id: folderId,
        });
        setLastSaved(new Date());
        setHasChanges(false);
      }
    } catch (error) {
      // Error handled by mutation
    }
  }, [title, content, folderId, isNewNote, id, createNote, updateNote, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteNote.mutateAsync(id);
      navigate("/notes");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleAddTag = async (tagId: string) => {
    if (!id || isNewNote) return;
    try {
      await addTagToNote.mutateAsync({ noteId: id, tagId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!id || isNewNote) return;
    try {
      await removeTagFromNote.mutateAsync({ noteId: id, tagId });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!newTagInput.trim() || !id || isNewNote) return;
    try {
      const newTag = await createTag.mutateAsync({ name: newTagInput.trim() });
      await addTagToNote.mutateAsync({ noteId: id, tagId: newTag.id });
      setNewTagInput("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSaving = createNote.isPending || updateNote.isPending;
  const isLoading = noteLoading && !isNewNote;

  // Get current note tags
  const currentTagIds = noteTags?.map(nt => nt.tag_id) || [];
  const availableTags = tags?.filter(t => !currentTagIds.includes(t.id)) || [];
  const currentTags = noteTags?.map(nt => nt.tags).filter(Boolean) || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => navigate("/notes")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                {lastSaved 
                  ? `Last saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
                  : isNewNote ? "New note" : "Not saved yet"
                }
              </span>
              {hasChanges && (
                <Badge variant="muted" className="text-xs">Unsaved changes</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isNewNote}>
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Summarize</span>
            </Button>
            <Button variant="outline" size="sm" disabled={isNewNote}>
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Flashcards</span>
            </Button>
            <Button 
              variant="hero" 
              size="sm"
              onClick={handleSave}
              disabled={isSaving || (!hasChanges && !isNewNote)}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </Button>
            {!isNewNote && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,280px] gap-6">
          {/* Main Editor */}
          <Card variant="elevated" className="p-6">
            {/* Title */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Note"
              className="text-2xl font-display font-bold border-0 px-0 focus-visible:ring-0 mb-4"
            />

            {/* Toolbar */}
            <div className="flex items-center gap-1 pb-4 mb-4 border-b border-border overflow-x-auto">
              {toolbarButtons.map((btn) => (
                <Button
                  key={btn.label}
                  variant="ghost"
                  size="icon-sm"
                  title={btn.label}
                >
                  <btn.icon className="w-4 h-4" />
                </Button>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              <Button variant="ghost" size="icon-sm" title="Add Image">
                <Image className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Add Audio">
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" title="Add Link">
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Area */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your notes..."
              className="w-full min-h-[500px] resize-none bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground font-mono text-sm leading-relaxed"
            />
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Folder */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Folder</span>
              </div>
              <Select 
                value={folderId || "none"} 
                onValueChange={(v) => setFolderId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-sm" 
                          style={{ backgroundColor: folder.color }}
                        />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {/* Tags */}
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tags</span>
              </div>
              
              {/* Current Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {currentTags.map((tag: any) => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary" 
                    className="text-xs"
                    style={{ borderColor: tag.color }}
                  >
                    {tag.name}
                    <button 
                      className="ml-1 hover:text-destructive"
                      onClick={() => handleRemoveTag(tag.id)}
                      disabled={isNewNote}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {currentTags.length === 0 && !isNewNote && (
                  <span className="text-xs text-muted-foreground">No tags</span>
                )}
                {isNewNote && (
                  <span className="text-xs text-muted-foreground">Save note first to add tags</span>
                )}
              </div>

              {/* Add Existing Tag */}
              {!isNewNote && availableTags.length > 0 && (
                <Select onValueChange={handleAddTag}>
                  <SelectTrigger className="h-8 text-sm mb-2">
                    <SelectValue placeholder="Add existing tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Create New Tag */}
              {!isNewNote && (
                <div className="flex gap-2">
                  <Input 
                    placeholder="New tag name..." 
                    className="h-8 text-sm flex-1"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateAndAddTag();
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    onClick={handleCreateAndAddTag}
                    disabled={!newTagInput.trim() || createTag.isPending}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>

            {/* AI Actions */}
            <Card variant="gradient" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">AI Actions</span>
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" disabled={isNewNote}>
                  <Sparkles className="w-4 h-4 text-accent" />
                  Summarize Note
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" disabled={isNewNote}>
                  <Layers className="w-4 h-4 text-primary" />
                  Generate Flashcards
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={deleteNote.isPending}
      />
    </DashboardLayout>
  );
}
