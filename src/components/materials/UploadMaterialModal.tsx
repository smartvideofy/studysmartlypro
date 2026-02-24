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
  CheckCircle,
  Youtube,
  Link as LinkIcon,
  Lock,
  Crown
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useCreateStudyMaterial, useUploadMaterialFile, useStudyMaterials } from '@/hooks/useStudyMaterials';
import { useFolders } from '@/hooks/useNotes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlanFeatures } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

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

// Validate YouTube URL
function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
  ];
  return patterns.some(pattern => pattern.test(url));
}

// Validate generic web URL
function isValidWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getFileIcon(file: File) {
  if (file.type.startsWith('audio/')) return FileAudio;
  if (file.type.startsWith('image/')) return FileImage;
  return FileText;
}

function fileNameToTitle(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}

export default function UploadMaterialModal({ open, onOpenChange }: UploadMaterialModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'file' | 'youtube' | 'web'>('file');
  
  // File upload state — now supports multiple files
  const [files, setFiles] = useState<File[]>([]);
  
  // YouTube state
  const [videoUrl, setVideoUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  
  // Web URL state
  const [webUrl, setWebUrl] = useState('');
  const [isValidWebUrlState, setIsValidWebUrlState] = useState(false);
  
  // Common state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [language, setLanguage] = useState('en');
  const [generateTutorNotes, setGenerateTutorNotes] = useState(true);
  const [generateFlashcards, setGenerateFlashcards] = useState(true);
  const [generateQuestions, setGenerateQuestions] = useState(false);
  const [generateConceptMap, setGenerateConceptMap] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: folders } = useFolders();
  const { data: materials } = useStudyMaterials();
  const planFeatures = usePlanFeatures();
  const uploadFile = useUploadMaterialFile();
  const createMaterial = useCreateStudyMaterial();

  // Check document limit
  const materialCount = materials?.length || 0;
  const maxDocuments = planFeatures.maxDocuments;
  const isAtLimit = maxDocuments !== 'unlimited' && materialCount >= maxDocuments;
  const remainingSlots = maxDocuments === 'unlimited' ? Infinity : maxDocuments - materialCount;
  const canGenerateQuestions = planFeatures.practiceQuestions;
  const canGenerateConceptMap = planFeatures.conceptMaps;

  const isMultiFile = files.length > 1;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles(prev => {
        const combined = [...prev, ...acceptedFiles];
        // Cap at 10 files
        return combined.slice(0, 10);
      });
      // Auto-set title only for the first single file drop when title is empty
      if (acceptedFiles.length === 1 && files.length === 0 && !title) {
        setTitle(fileNameToTitle(acceptedFiles[0].name));
      }
    }
  }, [title, files.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url);
    setIsValidUrl(isValidYouTubeUrl(url));
  };

  const handleWebUrlChange = (url: string) => {
    setWebUrl(url);
    setIsValidWebUrlState(isValidWebUrl(url));
  };

  const handleSubmitFile = async () => {
    if (files.length === 0) return;
    // For single file, require title; for multi-file, auto-derive titles
    if (!isMultiFile && !title.trim()) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const f of files) {
        try {
          const uploadResult = await uploadFile.mutateAsync(f);
          const fileTitle = isMultiFile ? fileNameToTitle(f.name) : title.trim();
          await createMaterial.mutateAsync({
            title: fileTitle,
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
          successCount++;
        } catch (error) {
          console.error(`Upload failed for ${f.name}:`, error);
          failCount++;
        }
      }

      if (failCount > 0 && successCount > 0) {
        toast.warning(`${successCount} uploaded, ${failCount} failed`);
      } else if (failCount > 0) {
        toast.error('All uploads failed');
      }
      // Success toast is handled by the mutation's onSuccess for single files.
      // For multi-file, show a summary.
      if (successCount > 0 && isMultiFile) {
        toast.success(`${successCount} material${successCount > 1 ? 's' : ''} uploaded successfully`);
      }

      if (successCount > 0) {
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitVideo = async () => {
    if (!videoUrl || !isValidUrl || !title.trim()) return;

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-video`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            videoUrl,
            title: title.trim(),
            subject: subject || null,
            topic: topic || null,
            language,
            folderId: folderId || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process video');
      }

      toast.success('Video is being processed! Check back in a moment.');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Video processing failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitWebUrl = async () => {
    if (!webUrl || !isValidWebUrlState || !title.trim()) return;

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return;
      }

      await createMaterial.mutateAsync({
        title: title.trim(),
        file_name: webUrl,
        file_type: 'web_url',
        file_path: null,
        file_size: null,
        subject: subject || null,
        topic: topic || null,
        folder_id: folderId || null,
        language,
        generate_tutor_notes: generateTutorNotes,
        generate_flashcards: generateFlashcards,
        generate_questions: generateQuestions,
        generate_concept_map: generateConceptMap,
      });

      toast.success('Web page is being processed! Check back in a moment.');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Web URL processing failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process web page');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'file') {
      handleSubmitFile();
    } else if (activeTab === 'youtube') {
      handleSubmitVideo();
    } else {
      handleSubmitWebUrl();
    }
  };

  const resetForm = () => {
    setFiles([]);
    setVideoUrl('');
    setIsValidUrl(false);
    setWebUrl('');
    setIsValidWebUrlState(false);
    setTitle('');
    setSubject('');
    setTopic('');
    setFolderId('');
    setLanguage('en');
    setGenerateTutorNotes(true);
    setGenerateFlashcards(true);
    setGenerateQuestions(true);
    setGenerateConceptMap(false);
    setActiveTab('file');
  };

  // For multi-file, title is auto-derived so not required
  const canSubmit = activeTab === 'file' 
    ? files.length > 0 && (isMultiFile || title.trim()) && !isAtLimit
    : activeTab === 'youtube'
    ? videoUrl && isValidUrl && title.trim() && !isAtLimit
    : webUrl && isValidWebUrlState && title.trim() && !isAtLimit;

  // Check if files exceed remaining slots
  const exceedsLimit = maxDocuments !== 'unlimited' && files.length > remainingSlots;

  // If at document limit, show upgrade prompt
  if (isAtLimit) {
    return (
      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            Document Limit Reached
          </ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <ResponsiveModalBody>
          <div className="text-center space-y-3 py-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground">
              You've reached your limit of <span className="font-semibold text-foreground">{maxDocuments} documents</span> on the free plan.
            </p>
            <p className="text-sm text-muted-foreground">
              Upgrade to Pro for unlimited document uploads and premium AI features.
            </p>
          </div>
        </ResponsiveModalBody>
        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => { onOpenChange(false); navigate('/pricing'); }} className="flex-1">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Upload Study Material
          {maxDocuments !== 'unlimited' && (
            <span className="text-xs text-muted-foreground ml-auto">
              {materialCount}/{maxDocuments} documents
            </span>
          )}
        </ResponsiveModalTitle>
      </ResponsiveModalHeader>

      <ResponsiveModalBody className="space-y-6">
        {/* Source Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'file' | 'youtube' | 'web')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">File</span>
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="w-4 h-4" />
              <span className="hidden sm:inline">YouTube</span>
            </TabsTrigger>
            <TabsTrigger value="web" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Web URL</span>
            </TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="file" className="mt-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all duration-200',
                isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-secondary/50',
                files.length > 0 && 'border-green-500 bg-green-500/5'
              )}
            >
              <input {...getInputProps()} />
              <AnimatePresence mode="wait">
                {files.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-3"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Upload className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">
                        {isDragActive ? 'Drop your files here' : 'Drag & drop your files'}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        PDF, Word, PowerPoint, Audio, or Images (max 50MB each, up to 10 files)
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="files"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm font-medium text-green-600 flex items-center justify-center gap-1.5 mb-3">
                      <CheckCircle className="w-4 h-4" />
                      {files.length} file{files.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 text-left">
                      {files.map((f, idx) => {
                        const Icon = getFileIcon(f);
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/50">
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {(f.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(idx);
                              }}
                              className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p
                      className="text-xs text-primary cursor-pointer hover:underline pt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger file picker by clicking the hidden input
                        const input = document.querySelector<HTMLInputElement>('input[type="file"]');
                        input?.click();
                      }}
                    >
                      + Add more files
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {exceedsLimit && (
              <p className="text-sm text-destructive mt-2">
                You can only upload {remainingSlots} more document{remainingSlots !== 1 ? 's' : ''} on your current plan.
              </p>
            )}
          </TabsContent>

          {/* YouTube URL Tab */}
          <TabsContent value="youtube" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 md:p-6 rounded-xl border-2 border-dashed border-border bg-secondary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Youtube className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">YouTube Video</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Paste a YouTube URL to extract and study from the video
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={cn(
                      "pl-10",
                      videoUrl && (isValidUrl ? "border-green-500" : "border-destructive")
                    )}
                  />
                </div>
                
                {videoUrl && !isValidUrl && (
                  <p className="text-sm text-destructive mt-2">
                    Please enter a valid YouTube URL
                  </p>
                )}
                {videoUrl && isValidUrl && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid YouTube URL
                  </p>
                )}
              </div>

              <div className="p-3 md:p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium mb-2 text-xs md:text-sm">Supported URLs:</p>
                <ul className="space-y-1 text-xs">
                  <li>• youtube.com/watch?v=VIDEO_ID</li>
                  <li>• youtu.be/VIDEO_ID</li>
                  <li>• youtube.com/shorts/VIDEO_ID</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Web URL Tab */}
          <TabsContent value="web" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 md:p-6 rounded-xl border-2 border-dashed border-border bg-secondary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">Web Page</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Paste any web URL to extract and study from the page content
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={webUrl}
                    onChange={(e) => handleWebUrlChange(e.target.value)}
                    placeholder="https://example.com/article..."
                    className={cn(
                      "pl-10",
                      webUrl && (isValidWebUrlState ? "border-success" : "border-destructive")
                    )}
                  />
                </div>
                
                {webUrl && !isValidWebUrlState && (
                  <p className="text-sm text-destructive mt-2">
                    Please enter a valid URL (starting with http:// or https://)
                  </p>
                )}
                {webUrl && isValidWebUrlState && (
                  <p className="text-sm text-success mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid URL
                  </p>
                )}
              </div>

              <div className="p-3 md:p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p className="font-medium mb-2 text-xs md:text-sm">Works best with:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Blog posts and articles</li>
                  <li>• Documentation pages</li>
                  <li>• Wikipedia articles</li>
                  <li>• News articles</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Metadata Form */}
        <div className="grid gap-4">
          {/* Hide title field for multi-file (titles auto-derived from filenames) */}
          {!isMultiFile && (
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeTab === 'youtube' ? "e.g., Calculus Lecture 5" : "e.g., Chapter 5 - Cell Biology"}
              />
            </div>
          )}

          {isMultiFile && (
            <p className="text-xs text-muted-foreground">
              Titles will be auto-generated from file names.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Generation Options */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-sm">AI Generation Options</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-sm">Tutor Notes</span>
              <Switch checked={generateTutorNotes} onCheckedChange={setGenerateTutorNotes} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <span className="text-sm">Flashcards</span>
              <Switch checked={generateFlashcards} onCheckedChange={setGenerateFlashcards} />
            </div>
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              canGenerateQuestions ? "bg-secondary/50" : "bg-muted/50 opacity-70"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-sm">Practice Questions</span>
                {!canGenerateQuestions && <Crown className="w-3 h-3 text-amber-500" />}
              </div>
              <Switch 
                checked={generateQuestions} 
                onCheckedChange={setGenerateQuestions}
                disabled={!canGenerateQuestions}
              />
            </div>
            <div className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              canGenerateConceptMap ? "bg-secondary/50" : "bg-muted/50 opacity-70"
            )}>
              <div className="flex items-center gap-2">
                <span className="text-sm">Concept Map</span>
                {!canGenerateConceptMap && <Crown className="w-3 h-3 text-amber-500" />}
              </div>
              <Switch 
                checked={generateConceptMap} 
                onCheckedChange={setGenerateConceptMap}
                disabled={!canGenerateConceptMap}
              />
            </div>
          </div>
        </div>
      </ResponsiveModalBody>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || isUploading || exceedsLimit}>
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {activeTab === 'youtube' ? 'Processing...' : 'Uploading...'}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {activeTab === 'youtube' 
                ? 'Process Video' 
                : activeTab === 'file' && files.length > 1
                ? `Upload ${files.length} Files`
                : 'Upload'}
            </>
          )}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
}
