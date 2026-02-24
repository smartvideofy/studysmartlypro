import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Brain,
  Network,
  RefreshCw,
  Eye,
  PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotebook, useNotebookMaterials } from '@/hooks/useNotebooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { runNotebookPipeline } from '@/lib/processNotebookPipeline';

// Notebook-specific tab components
import NotebookTutorNotesTab from '@/components/notebooks/NotebookTutorNotesTab';
import NotebookSummariesTab from '@/components/notebooks/NotebookSummariesTab';
import NotebookFlashcardsTab from '@/components/notebooks/NotebookFlashcardsTab';
import NotebookQuestionsTab from '@/components/notebooks/NotebookQuestionsTab';
import NotebookConceptMapTab from '@/components/notebooks/NotebookConceptMapTab';
import NotebookChatTab from '@/components/notebooks/NotebookChatTab';

type MobilePanel = 'sources' | 'tools';

export default function NotebookWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: notebook, isLoading: nbLoading } = useNotebook(id || '');
  const { data: materials, isLoading: matLoading } = useNotebookMaterials(id || '');
  const [activeTab, setActiveTab] = useState('tutor-notes');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('tools');
  const [isRetrying, setIsRetrying] = useState(false);
  const pipelineTriggeredRef = useRef(false);

  const isProcessing = notebook?.processing_status === 'processing';
  const isCompleted = notebook?.processing_status === 'completed';
  const isPending = notebook?.processing_status === 'pending';
  const isFailed = notebook?.processing_status === 'failed';

  // Check if all materials have extracted content
  const extractedCount = materials?.filter(m => m.extracted_content).length || 0;
  const totalCount = materials?.length || 0;
  const allExtracted = totalCount > 0 && extractedCount === totalCount;

  // Reset trigger ref when notebook status changes to failed (allow retry)
  useEffect(() => {
    if (isFailed) pipelineTriggeredRef.current = false;
  }, [isFailed]);

  // Auto-trigger notebook processing when all materials are extracted and notebook is pending
  useEffect(() => {
    if (allExtracted && isPending && !pipelineTriggeredRef.current && id) {
      pipelineTriggeredRef.current = true;
      console.log('All materials extracted, triggering notebook pipeline (fire-and-forget)...');
      setIsRetrying(true);
      runNotebookPipeline(id).catch((err) => {
        console.error('Notebook pipeline error:', err);
        toast.error(err instanceof Error ? err.message : 'Processing failed');
      }).finally(() => setIsRetrying(false));
    }
  }, [allExtracted, isPending, id]);

  const handleRetry = () => {
    if (!id || isRetrying) return;
    setIsRetrying(true);
    toast.info('Retrying notebook processing...');
    runNotebookPipeline(id).catch((err) => {
      console.error('Notebook pipeline error:', err);
      toast.error(err instanceof Error ? err.message : 'Processing failed');
    }).finally(() => setIsRetrying(false));
  };

  if (nbLoading || matLoading) {
    return (
      <DashboardLayout title="Notebook">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!notebook) {
    return (
      <DashboardLayout title="Notebook">
        <div className="text-center py-20 space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Notebook not found</p>
          <Button variant="outline" onClick={() => navigate('/materials')}>
            Back to Materials
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Sources panel
  const SourcesPanel = () => (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Sources ({totalCount})</h3>
        </div>
        <div className="space-y-2">
          {materials?.map((m: any) => (
            <div
              key={m.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/materials/${m.id}`)}
            >
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {m.file_type?.toUpperCase()} • {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="shrink-0">
                {m.processing_status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : m.processing_status === 'processing' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : m.processing_status === 'failed' ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notebook metadata */}
        <div className="pt-4 border-t border-border space-y-2">
          {notebook.subject && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{notebook.subject}</Badge>
            </div>
          )}
          {notebook.topic && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">{notebook.topic}</Badge>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );

  // Processing / pending state
  if (!isCompleted) {
    return (
      <DashboardLayout title={notebook.title}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/materials')} className="mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <BookOpen className="w-6 h-6 text-primary shrink-0" />
                <h1 className="text-2xl font-display font-bold truncate">{notebook.title}</h1>
              </div>
              {notebook.description && (
                <p className="text-muted-foreground text-sm ml-9">{notebook.description}</p>
              )}
            </div>
          </div>

          {/* Source Materials */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Source Materials ({totalCount})
            </h2>
            <div className="space-y-2">
              {materials?.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/materials/${m.id}`)}
                >
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.file_type?.toUpperCase()} • {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {m.processing_status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : m.processing_status === 'processing' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : m.processing_status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Status */}
          {(isProcessing || isRetrying) && (
            <Card className="p-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Generating Combined Study Materials</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                AI is synthesizing content from all {totalCount} sources into unified notes, flashcards, and more.
              </p>
              <p className="text-xs text-muted-foreground">
                Materials extracted: {extractedCount}/{totalCount}
              </p>
            </Card>
          )}

          {isPending && !isRetrying && (
            <Card className="p-8 text-center space-y-3">
              <Clock className="w-10 h-10 text-yellow-500 mx-auto" />
              <h3 className="text-lg font-semibold">Waiting for Materials</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Individual materials are being extracted. Combined content will be generated once all sources are ready.
              </p>
              <p className="text-xs text-muted-foreground">
                Materials extracted: {extractedCount}/{totalCount}
              </p>
            </Card>
          )}

          {isFailed && (
            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <h3 className="text-lg font-semibold text-destructive">Processing Failed</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {notebook.processing_error || 'An error occurred while generating combined content.'}
              </p>
              <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
                {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Retry Processing
              </Button>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─── Completed state: Full workspace ───

  // Get combined extracted content for AI Chat
  const combinedExtractedContent = materials
    ?.filter((m: any) => m.extracted_content)
    .map((m: any) => `[Source: ${m.title}]\n${m.extracted_content}`)
    .join('\n\n---\n\n') || '';

  // Mobile layout
  if (isMobile) {
    return (
      <DashboardLayout title={notebook.title}>
        <div className="flex flex-col h-[calc(100dvh-9rem)] -mx-4 overflow-hidden pb-safe">
          {/* Panel Toggle */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <Button
              variant={mobilePanel === 'sources' ? 'default' : 'outline'}
              onClick={() => setMobilePanel('sources')}
              className="flex-1 gap-2 h-11 min-h-[44px]"
            >
              <Eye className="w-4 h-4" />
              Sources ({totalCount})
            </Button>
            <Button
              variant={mobilePanel === 'tools' ? 'default' : 'outline'}
              onClick={() => setMobilePanel('tools')}
              className="flex-1 gap-2 h-11 min-h-[44px]"
            >
              <PenTool className="w-4 h-4" />
              Study Tools
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {mobilePanel === 'sources' ? (
              <motion.div key="sources" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-hidden">
                <SourcesPanel />
              </motion.div>
            ) : (
              <motion.div key="tools" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <div className="border-b border-border overflow-x-auto scrollbar-hide">
                    <TabsList className="justify-start rounded-none bg-transparent p-0 h-auto w-max min-w-full">
                      <TabsTrigger value="tutor-notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target">
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs">Notes</span>
                      </TabsTrigger>
                      <TabsTrigger value="summaries" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Summary</span>
                      </TabsTrigger>
                      <TabsTrigger value="flashcards" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-xs">Cards</span>
                      </TabsTrigger>
                      <TabsTrigger value="questions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target">
                        <Brain className="w-4 h-4" />
                        <span className="text-xs">Quiz</span>
                      </TabsTrigger>
                      <TabsTrigger value="concept-map" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target">
                        <Network className="w-4 h-4" />
                        <span className="text-xs">Map</span>
                      </TabsTrigger>
                      <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2 touch-target">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs">Chat</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <TabsContent value="tutor-notes" className="m-0 h-full"><NotebookTutorNotesTab notebookId={id!} /></TabsContent>
                    <TabsContent value="summaries" className="m-0 h-full"><NotebookSummariesTab notebookId={id!} /></TabsContent>
                    <TabsContent value="flashcards" className="m-0 h-full"><NotebookFlashcardsTab notebookId={id!} /></TabsContent>
                    <TabsContent value="questions" className="m-0 h-full"><NotebookQuestionsTab notebookId={id!} /></TabsContent>
                    <TabsContent value="concept-map" className="m-0 h-full"><NotebookConceptMapTab notebookId={id!} /></TabsContent>
                    <TabsContent value="chat" className="m-0 h-full"><NotebookChatTab notebookId={id!} extractedContent={combinedExtractedContent} /></TabsContent>
                  </div>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardLayout>
    );
  }

  // Desktop layout - split view
  return (
    <DashboardLayout title={notebook.title}>
      <div className="flex h-[calc(100vh-8rem)] -m-6 mt-0 overflow-hidden">
        {/* Left Panel - Sources */}
        <div className="w-[280px] border-r border-border overflow-hidden shrink-0">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/materials')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{notebook.title}</h2>
              <p className="text-xs text-muted-foreground">{totalCount} sources</p>
            </div>
          </div>
          <SourcesPanel />
        </div>

        {/* Right Panel - Study Tools */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-border">
              <TabsList className="justify-start rounded-none bg-transparent p-0 h-auto overflow-x-auto flex-1">
                <TabsTrigger value="tutor-notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Tutor Notes</span>
                </TabsTrigger>
                <TabsTrigger value="summaries" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Summaries</span>
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline">Flashcards</span>
                </TabsTrigger>
                <TabsTrigger value="questions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2">
                  <Brain className="w-4 h-4" />
                  <span className="hidden sm:inline">Questions</span>
                </TabsTrigger>
                <TabsTrigger value="concept-map" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2">
                  <Network className="w-4 h-4" />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">AI Chat</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="tutor-notes" className="m-0 h-full"><NotebookTutorNotesTab notebookId={id!} /></TabsContent>
              <TabsContent value="summaries" className="m-0 h-full"><NotebookSummariesTab notebookId={id!} /></TabsContent>
              <TabsContent value="flashcards" className="m-0 h-full"><NotebookFlashcardsTab notebookId={id!} /></TabsContent>
              <TabsContent value="questions" className="m-0 h-full"><NotebookQuestionsTab notebookId={id!} /></TabsContent>
              <TabsContent value="concept-map" className="m-0 h-full"><NotebookConceptMapTab notebookId={id!} /></TabsContent>
              <TabsContent value="chat" className="m-0 h-full"><NotebookChatTab notebookId={id!} extractedContent={combinedExtractedContent} /></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
