import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FolderPlus, 
  Grid3X3, 
  List, 
  Search, 
  Filter,
  BookOpen,
  FileText,
  FileAudio,
  FileImage,
  X,
  Layers
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import MaterialCard from "@/components/materials/MaterialCard";
import UploadMaterialModal from "@/components/materials/UploadMaterialModal";
import DeleteMaterialModal from "@/components/materials/DeleteMaterialModal";
import { CreateFolderModal } from "@/components/notes/CreateFolderModal";
import { useStudyMaterials, useDeleteStudyMaterial, StudyMaterial } from "@/hooks/useStudyMaterials";
import { useFolders } from "@/hooks/useNotes";
import { SkeletonMaterialCard } from "@/components/ui/skeleton";
import { ErrorRecovery } from "@/components/ui/error-recovery";
import { useQueryClient } from "@tanstack/react-query";

type FileTypeFilter = 'pdf' | 'docx' | 'pptx' | 'audio' | 'image';

export default function StudyMaterialsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [fileTypeFilters, setFileTypeFilters] = useState<FileTypeFilter[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<StudyMaterial | null>(null);

  const queryClient = useQueryClient();
  const { data: materials, isLoading, isError } = useStudyMaterials(selectedFolderId);
  const { data: folders } = useFolders();
  const deleteMaterial = useDeleteStudyMaterial();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['study-materials'] });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const toggleFileTypeFilter = (type: FileTypeFilter) => {
    setFileTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const clearFilters = () => setFileTypeFilters([]);

  const filteredMaterials = materials?.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFileType = fileTypeFilters.length === 0 || 
      fileTypeFilters.includes(m.file_type as FileTypeFilter);
    
    return matchesSearch && matchesFileType;
  }) ?? [];

  const handleDelete = (material: StudyMaterial) => {
    setMaterialToDelete(material);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (materialToDelete) {
      deleteMaterial.mutate(materialToDelete.id);
      setDeleteModalOpen(false);
      setMaterialToDelete(null);
    }
  };

  return (
    <DashboardLayout title="Study Materials">
      <div className="space-y-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 border border-border/50"
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold mb-2">
              Upload & Learn
            </h2>
            <p className="text-muted-foreground max-w-lg mb-6">
              Upload your study materials and let AI generate structured notes, flashcards, and practice questions automatically.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Material
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFolderModalOpen(true)}
                className="gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </Button>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-12 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
        </motion.div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
              <TabsList className="h-9">
                <TabsTrigger value="grid" className="px-3">
                  <Grid3X3 className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={fileTypeFilters.length > 0 ? "secondary" : "outline"} 
                  size="icon" 
                  className="h-9 w-9 relative"
                >
                  <Filter className="w-4 h-4" />
                  {fileTypeFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {fileTypeFilters.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={fileTypeFilters.includes('pdf')}
                  onCheckedChange={() => toggleFileTypeFilter('pdf')}
                >
                  <FileText className="w-4 h-4 mr-2 text-red-500" />
                  PDF
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={fileTypeFilters.includes('docx')}
                  onCheckedChange={() => toggleFileTypeFilter('docx')}
                >
                  <FileText className="w-4 h-4 mr-2 text-blue-500" />
                  Word
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={fileTypeFilters.includes('pptx')}
                  onCheckedChange={() => toggleFileTypeFilter('pptx')}
                >
                  <FileText className="w-4 h-4 mr-2 text-orange-500" />
                  PowerPoint
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={fileTypeFilters.includes('audio')}
                  onCheckedChange={() => toggleFileTypeFilter('audio')}
                >
                  <FileAudio className="w-4 h-4 mr-2 text-purple-500" />
                  Audio
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={fileTypeFilters.includes('image')}
                  onCheckedChange={() => toggleFileTypeFilter('image')}
                >
                  <FileImage className="w-4 h-4 mr-2 text-green-500" />
                  Image
                </DropdownMenuCheckboxItem>
                {fileTypeFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-muted-foreground"
                      onClick={clearFilters}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters */}
        {fileTypeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {fileTypeFilters.map(filter => (
              <Badge 
                key={filter} 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleFileTypeFilter(filter)}
              >
                {filter.toUpperCase()}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
              Clear all
            </Button>
          </div>
        )}

        {/* Folders */}
        {folders && folders.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Folders</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedFolderId ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedFolderId(undefined)}
              >
                All Materials
              </Button>
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={selectedFolderId === folder.id ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolderId(folder.id)}
                  style={{ borderColor: folder.color || undefined }}
                >
                  {folder.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Materials Grid/List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
              }
            >
              {[...Array(8)].map((_, i) => (
                <SkeletonMaterialCard key={i} viewMode={viewMode} />
              ))}
            </motion.div>
          ) : isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ErrorRecovery
                title="Failed to load materials"
                message="We couldn't load your study materials. Please check your connection and try again."
                onRetry={handleRetry}
              />
            </motion.div>
          ) : filteredMaterials.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Upload your first study material to get started with AI-powered learning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Material
                </Button>
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/flashcards">
                    <Layers className="w-4 h-4" />
                    Create Flashcards Manually
                  </Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="materials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
              }
            >
              {filteredMaterials.map((material, index) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MaterialCard
                    material={material}
                    onClick={() => navigate(`/materials/${material.id}`)}
                    onDelete={() => handleDelete(material)}
                    onSettings={() => navigate(`/materials/${material.id}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <UploadMaterialModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
      />

      <CreateFolderModal
        open={folderModalOpen}
        onOpenChange={setFolderModalOpen}
      />

      <DeleteMaterialModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title={materialToDelete?.title || ''}
      />
    </DashboardLayout>
  );
}
