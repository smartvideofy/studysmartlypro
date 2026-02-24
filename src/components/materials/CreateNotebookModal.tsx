import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Upload,
  X,
  FileText,
  FileAudio,
  FileImage,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCreateNotebook } from '@/hooks/useNotebooks';
import { useCreateStudyMaterial, useUploadMaterialFile } from '@/hooks/useStudyMaterials';
import { useFolders } from '@/hooks/useNotes';
import { toast } from 'sonner';
import { runProcessingPipeline } from '@/lib/processMaterialPipeline';

interface CreateNotebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const acceptedFormats = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
  'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
};

function getFileIcon(file: File) {
  if (file.type.startsWith('audio/')) return FileAudio;
  if (file.type.startsWith('image/')) return FileImage;
  return FileText;
}

function fileNameToTitle(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

export default function CreateNotebookModal({ open, onOpenChange }: CreateNotebookModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('en');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createNotebook = useCreateNotebook();
  const uploadFile = useUploadMaterialFile();
  const createMaterial = useCreateStudyMaterial();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 10));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubject('');
    setTopic('');
    setLanguage('en');
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || files.length < 2) return;

    setIsUploading(true);
    try {
      // 1. Create the notebook
      const notebook = await createNotebook.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        subject: subject || undefined,
        topic: topic || undefined,
        language,
      });

      // 2. Upload each file and create material records linked to notebook
      let successCount = 0;
      for (const f of files) {
        try {
          const uploadResult = await uploadFile.mutateAsync(f);
          await createMaterial.mutateAsync({
            title: fileNameToTitle(f.name),
            file_name: uploadResult.fileName,
            file_type: uploadResult.fileType,
            file_path: uploadResult.filePath,
            file_size: uploadResult.fileSize,
            subject: subject || null,
            topic: topic || null,
            language,
            generate_tutor_notes: true,
            generate_flashcards: true,
            generate_questions: true,
            generate_concept_map: false,
            notebook_id: notebook.id,
          } as any);
          successCount++;
        } catch (error) {
          console.error(`Upload failed for ${f.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Notebook created with ${successCount} source${successCount > 1 ? 's' : ''}! Processing will begin shortly.`);
        resetForm();
        onOpenChange(false);
      } else {
        toast.error('All file uploads failed');
      }
    } catch (error) {
      console.error('Notebook creation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create notebook');
    } finally {
      setIsUploading(false);
    }
  };

  const canSubmit = title.trim() && files.length >= 2 && !isUploading;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Create Notebook
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Upload multiple materials for a topic and get <strong>combined</strong> study notes, flashcards, and quizzes that synthesize all sources.
        </p>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="nb-title">Notebook Name *</Label>
          <Input
            id="nb-title"
            placeholder="e.g. Cell Biology Unit 3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="nb-desc">Description (optional)</Label>
          <Textarea
            id="nb-desc"
            placeholder="What are you studying?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none h-16"
          />
        </div>

        {/* Subject & Topic */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nb-subject">Subject</Label>
            <Input id="nb-subject" placeholder="Biology" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nb-topic">Topic</Label>
            <Input id="nb-topic" placeholder="Cell Division" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label>Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File Drop Zone */}
        <div className="space-y-2">
          <Label>Source Materials (minimum 2 files) *</Label>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
              files.length > 0 && 'border-green-500 bg-green-500/5'
            )}
          >
            <input {...getInputProps()} />
            {files.length === 0 ? (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Drop your files here (PDF, Word, PowerPoint, Audio, Images)
                </p>
                <p className="text-xs text-muted-foreground">Up to 10 files, 50MB each</p>
              </div>
            ) : (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-medium text-green-600 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1 text-left">
                  {files.map((f, idx) => {
                    const Icon = getFileIcon(f);
                    return (
                      <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-background/60 border border-border/50">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate flex-1">{f.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {files.length === 1 && (
            <p className="text-xs text-amber-600">Add at least one more file to create a notebook.</p>
          )}
        </div>

        {/* AI Info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Each file will be extracted individually, then AI will generate <strong>combined</strong> tutor notes, flashcards, practice questions, and a concept map from all sources together.
          </p>
        </div>
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Create Notebook
            </>
          )}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
