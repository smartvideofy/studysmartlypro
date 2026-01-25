import { motion } from 'framer-motion';
import { 
  FileText, 
  FileAudio, 
  FileImage, 
  FileSpreadsheet,
  MoreVertical,
  Trash2,
  Settings,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { StudyMaterial } from '@/hooks/useStudyMaterials';
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

interface MaterialCardProps {
  material: StudyMaterial;
  onClick: () => void;
  onDelete: () => void;
  onSettings: () => void;
}

const fileTypeConfig: Record<string, { icon: typeof FileText; bgColor: string; label: string }> = {
  pdf: { icon: FileText, bgColor: 'bg-red-500/10', label: 'PDF' },
  docx: { icon: FileText, bgColor: 'bg-blue-500/10', label: 'Word' },
  pptx: { icon: FileSpreadsheet, bgColor: 'bg-orange-500/10', label: 'PowerPoint' },
  audio: { icon: FileAudio, bgColor: 'bg-purple-500/10', label: 'Audio' },
  image: { icon: FileImage, bgColor: 'bg-green-500/10', label: 'Image' },
  other: { icon: FileText, bgColor: 'bg-muted', label: 'File' },
};

const statusConfig: Record<string, { icon: typeof Loader2; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Pending' },
  processing: { icon: Loader2, color: 'text-blue-600 dark:text-blue-500', bgColor: 'bg-blue-500/10', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'text-green-600 dark:text-green-500', bgColor: 'bg-green-500/10', label: 'Ready' },
  failed: { icon: AlertCircle, color: 'text-red-600 dark:text-red-500', bgColor: 'bg-red-500/10', label: 'Failed' },
};

export default function MaterialCard({ material, onClick, onDelete, onSettings }: MaterialCardProps) {
  const fileConfig = fileTypeConfig[material.file_type || 'other'] || fileTypeConfig.other;
  const status = statusConfig[material.processing_status];
  const FileIcon = fileConfig.icon;
  const StatusIcon = status.icon;
  const isMobile = useIsMobile();

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
      onClick={() => {
        haptics.selection();
        onClick();
      }}
    >
      {/* File Type Banner */}
      <div className={cn('h-20 flex items-center justify-center', fileConfig.bgColor)}>
        <FileIcon className="w-10 h-10 opacity-70" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
          {material.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {fileConfig.label}
          </Badge>
          {material.subject && (
            <Badge variant="outline" className="text-xs">
              {material.subject}
            </Badge>
          )}
        </div>

        {/* Status & Time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full', status.bgColor)}>
            <StatusIcon className={cn('w-3.5 h-3.5', status.color, material.processing_status === 'processing' && 'animate-spin')} />
            <span className={status.color}>{status.label}</span>
          </div>
          <span>{formatDistanceToNow(new Date(material.updated_at), { addSuffix: true })}</span>
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
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => haptics.selection()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Processing Overlay */}
      {material.processing_status === 'processing' && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Processing...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
