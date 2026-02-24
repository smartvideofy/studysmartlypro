import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotebook, useNotebookMaterials } from '@/hooks/useNotebooks';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function NotebookWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: notebook, isLoading: nbLoading } = useNotebook(id || '');
  const { data: materials, isLoading: matLoading } = useNotebookMaterials(id || '');

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

  const isProcessing = notebook.processing_status === 'processing';
  const isCompleted = notebook.processing_status === 'completed';
  const isPending = notebook.processing_status === 'pending';

  // Check how many materials have finished extraction
  const extractedCount = materials?.filter(m => m.extracted_content).length || 0;
  const totalCount = materials?.length || 0;
  const allExtracted = totalCount > 0 && extractedCount === totalCount;

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
            <div className="flex items-center gap-2 mt-2 ml-9">
              {notebook.subject && <Badge variant="outline">{notebook.subject}</Badge>}
              {notebook.topic && <Badge variant="secondary">{notebook.topic}</Badge>}
              <Badge variant={isCompleted ? 'default' : 'secondary'} className="gap-1">
                {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
                {isCompleted && <CheckCircle className="w-3 h-3" />}
                {isPending && <Clock className="w-3 h-3" />}
                {notebook.processing_status}
              </Badge>
            </div>
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

        {/* Status / Combined Content */}
        {isProcessing && (
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

        {isPending && (
          <Card className="p-8 text-center space-y-3">
            <Clock className="w-10 h-10 text-yellow-500 mx-auto" />
            <h3 className="text-lg font-semibold">Processing Queued</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Individual materials are being extracted. Combined content will be generated once all sources are ready.
            </p>
            <p className="text-xs text-muted-foreground">
              Materials extracted: {extractedCount}/{totalCount}
            </p>
          </Card>
        )}

        {isCompleted && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Combined Study Tools</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Combined content has been generated from all {totalCount} sources. 
              Study tools coming soon — for now, you can access each material's individual workspace.
            </p>
          </Card>
        )}

        {notebook.processing_status === 'failed' && (
          <Card className="p-6 border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h3 className="text-lg font-semibold text-destructive">Processing Failed</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {notebook.processing_error || 'An error occurred while generating combined content.'}
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
