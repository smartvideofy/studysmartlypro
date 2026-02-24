import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText,
  BookOpen,
  Folder,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudyMaterial, useUpdateStudyMaterial, useDeleteStudyMaterial } from "@/hooks/useStudyMaterials";
import { useFolders } from "@/hooks/useNotes";
import { runProcessingPipeline } from "@/lib/processMaterialPipeline";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

export default function MaterialSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: material, isLoading } = useStudyMaterial(id || "");
  const { data: folders } = useFolders();
  const updateMaterial = useUpdateStudyMaterial();
  const deleteMaterial = useDeleteStudyMaterial();
  
  const [formData, setFormData] = useState<{
    title: string;
    subject: string;
    topic: string;
    language: string;
    folder_id: string | null;
  } | null>(null);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Initialize form data when material loads
  if (material && !formData) {
    setFormData({
      title: material.title,
      subject: material.subject || "",
      topic: material.topic || "",
      language: material.language || "en",
      folder_id: material.folder_id,
    });
  }

  const handleSave = async () => {
    if (!material || !formData) return;
    
    try {
      await updateMaterial.mutateAsync({
        id: material.id,
        title: formData.title,
        subject: formData.subject || null,
        topic: formData.topic || null,
        language: formData.language,
        folder_id: formData.folder_id,
      });
      toast.success("Material settings saved");
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleReprocess = async () => {
    if (!material) return;
    
    setIsReprocessing(true);
    try {
      await updateMaterial.mutateAsync({
        id: material.id,
        processing_status: 'pending',
        processing_error: null,
      });
      
      await runProcessingPipeline(material.id);
      
      toast.success("Material reprocessing completed");
      navigate(`/materials/${material.id}`);
    } catch (error) {
      console.error("Failed to reprocess:", error);
      toast.error("Failed to reprocess material");
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!material) return;
    
    try {
      await deleteMaterial.mutateAsync(material.id);
      navigate("/materials");
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!material) {
    return (
      <DashboardLayout title="Not Found">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Material not found</h2>
          <Button onClick={() => navigate("/materials")}>Back to Materials</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Material Settings">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="gap-2" 
          onClick={() => navigate(`/materials/${material.id}`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </Button>

        {/* General Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Update material information and organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData?.title || ""}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Material title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData?.subject || ""}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, subject: e.target.value } : null)}
                    placeholder="e.g., Biology, Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={formData?.topic || ""}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, topic: e.target.value } : null)}
                    placeholder="e.g., Cell Division"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="folder" className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Folder
                  </Label>
                  <Select
                    value={formData?.folder_id || "none"}
                    onValueChange={(value) => setFormData(prev => prev ? { ...prev, folder_id: value === "none" ? null : value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No folder</SelectItem>
                      {folders?.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </Label>
                  <Select
                    value={formData?.language || "en"}
                    onValueChange={(value) => setFormData(prev => prev ? { ...prev, language: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={updateMaterial.isPending}
                  className="gap-2"
                >
                  {updateMaterial.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* File Information (Read-only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                File Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">File Name:</span>
                  <p className="font-medium">{material.file_name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">File Type:</span>
                  <p className="font-medium uppercase">{material.file_type || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">File Size:</span>
                  <p className="font-medium">
                    {material.file_size 
                      ? `${(material.file_size / 1024 / 1024).toFixed(2)} MB`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{material.processing_status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Processing
              </CardTitle>
              <CardDescription>
                Reprocess the material to regenerate all AI content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={handleReprocess}
                disabled={isReprocessing}
                className="gap-2"
              >
                {isReprocessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Reprocess Material
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Material
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{material.title}"? This will permanently remove the material and all associated AI-generated content (notes, flashcards, summaries, etc.). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMaterial.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
