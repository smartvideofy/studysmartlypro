import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileText, 
  FileAudio, 
  FileImage,
  Sparkles,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCreateStudyMaterial, useUploadMaterialFile } from '@/hooks/useStudyMaterials';
import { useFolders } from '@/hooks/useNotes';

interface UploadMaterialModalProps {
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

export default function UploadMaterialModal({ open, onOpenChange }: UploadMaterialModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [language, setLanguage] = useState('en');
  const [generateTutorNotes, setGenerateTutorNotes] = useState(true);
  const [generateFlashcards, setGenerateFlashcards] = useState(true);
  const [generateQuestions, setGenerateQuestions] = useState(true);
  const [generateConceptMap, setGenerateConceptMap] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: folders } = useFolders();
  const uploadFile = useUploadMaterialFile();
  const createMaterial = useCreateStudyMaterial();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const uploadResult = await uploadFile.mutateAsync(file);

      // Create material record (processing is triggered automatically)
      await createMaterial.mutateAsync({
        title: title.trim(),
        file_name: uploadResult.fileName,
        file_type: uploadResult.fileType,
        file_path: uploadResult.filePath,
        file_size: uploadResult.fileSize,
        subject: subject || null,
        topic: topic || null,
        folder_id: folderId || null,
        language,
        generate_tutor_notes: generateTutorNotes,
        generate_flashcards: generateFlashcards,
        generate_questions: generateQuestions,
        generate_concept_map: generateConceptMap,
      });

      // Reset and close
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setSubject('');
    setTopic('');
    setFolderId('');
    setLanguage('en');
    setGenerateTutorNotes(true);
    setGenerateFlashcards(true);
    setGenerateQuestions(true);
    setGenerateConceptMap(false);
  };

  const getFileIcon = () => {
    if (!file) return FileText;
    if (file.type.startsWith('audio/')) return FileAudio;
    if (file.type.startsWith('image/')) return FileImage;
    return FileText;
  };

  const FileIcon = getFileIcon();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Study Material
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-secondary/50',
              file && 'border-green-500 bg-green-500/5'
            )}
          >
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-2"
                >
                  <div className="w-16 h-16 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto">
                    <FileIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-3"
                >
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {isDragActive ? 'Drop your file here' : 'Drag & drop your file'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PDF, Word, PowerPoint, Audio, or Images (max 50MB)
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Metadata Form */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 5 - Cell Biology"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject / Course</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Biology 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Folder</Label>
                <Select value={folderId || '__none__'} onValueChange={(val) => setFolderId(val === '__none__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No folder</SelectItem>
                    {folders?.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* AI Generation Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Study Tools Generation
            </div>
            <div className="grid gap-3 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tutor Notes</p>
                  <p className="text-xs text-muted-foreground">Structured explanations & key concepts</p>
                </div>
                <Switch checked={generateTutorNotes} onCheckedChange={setGenerateTutorNotes} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Flashcards</p>
                  <p className="text-xs text-muted-foreground">Q&A cards for spaced repetition</p>
                </div>
                <Switch checked={generateFlashcards} onCheckedChange={setGenerateFlashcards} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Practice Questions</p>
                  <p className="text-xs text-muted-foreground">MCQs & short answer questions</p>
                </div>
                <Switch checked={generateQuestions} onCheckedChange={setGenerateQuestions} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Concept Map</p>
                  <p className="text-xs text-muted-foreground">Visual concept relationships</p>
                </div>
                <Switch checked={generateConceptMap} onCheckedChange={setGenerateConceptMap} />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={!file || !title.trim() || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Upload & Process Material
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
