import { motion } from 'framer-motion';
import { 
  BookOpen,
  MoreVertical,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Notebook } from '@/hooks/useNotebooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { haptics } from '@/lib/haptics';

interface NotebookCardProps {
  notebook: Notebook;
  onClick: () => void;
  onDelete: () => void;
}

const statusConfig: Record<string, { icon: typeof Loader2; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Pending' },
  processing: { icon: Loader2, color: 'text-blue-600 dark:text-blue-500', bgColor: 'bg-blue-500/10', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'text-green-600 dark:text-green-500', bgColor: 'bg-green-500/10', label: 'Ready' },
  failed: { icon: AlertCircle, color: 'text-red-600 dark:text-red-500', bgColor: 'bg-red-500/10', label: 'Failed' },
};

export default function NotebookCard({ notebook, onClick, onDelete }: NotebookCardProps) {
  const isMobile = useIsMobile();
  const status = statusConfig[notebook.processing_status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
      onClick={() => {
        haptics.selection();
        onClick();
      }}
    >
      {/* Notebook Banner */}
      <div className="h-20 flex items-center justify-center bg-primary/10">
        <BookOpen className="w-10 h-10 text-primary opacity-70" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
          {notebook.title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs gap-1">
            <FileText className="w-3 h-3" />
            {notebook.material_count || 0} source{(notebook.material_count || 0) !== 1 ? 's' : ''}
          </Badge>
          {notebook.subject && (
            <Badge variant="outline" className="text-xs">
              {notebook.subject}
            </Badge>
          )}
        </div>

        {notebook.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{notebook.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full', status.bgColor)}>
            <StatusIcon className={cn('w-3.5 h-3.5', status.color, notebook.processing_status === 'processing' && 'animate-spin')} />
            <span className={status.color}>{status.label}</span>
          </div>
          <span>{formatDistanceToNow(new Date(notebook.updated_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Actions */}
      <div
        className={cn(
          "absolute top-2 right-2 transition-opacity duration-200",
          isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-8 w-8 p-0" onClick={() => haptics.selection()}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Notebook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Processing Overlay */}
      {notebook.processing_status === 'processing' && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Generating combined content...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
