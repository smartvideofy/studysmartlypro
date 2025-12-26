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

interface MaterialCardProps {
  material: StudyMaterial;
  onClick: () => void;
  onDelete: () => void;
  onSettings: () => void;
}

const fileTypeConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  pdf: { icon: FileText, color: 'text-red-500 bg-red-500/10', label: 'PDF' },
  docx: { icon: FileText, color: 'text-blue-500 bg-blue-500/10', label: 'Word' },
  pptx: { icon: FileSpreadsheet, color: 'text-orange-500 bg-orange-500/10', label: 'PowerPoint' },
  audio: { icon: FileAudio, color: 'text-purple-500 bg-purple-500/10', label: 'Audio' },
  image: { icon: FileImage, color: 'text-green-500 bg-green-500/10', label: 'Image' },
  other: { icon: FileText, color: 'text-muted-foreground bg-muted', label: 'File' },
};

const statusConfig: Record<string, { icon: typeof Loader2; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  processing: { icon: Loader2, color: 'text-blue-500', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Ready' },
  failed: { icon: AlertCircle, color: 'text-red-500', label: 'Failed' },
};

export default function MaterialCard({ material, onClick, onDelete, onSettings }: MaterialCardProps) {
  const fileConfig = fileTypeConfig[material.file_type || 'other'] || fileTypeConfig.other;
  const status = statusConfig[material.processing_status];
  const FileIcon = fileConfig.icon;
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* File Type Banner */}
      <div className={cn('h-24 flex items-center justify-center', fileConfig.color)}>
        <FileIcon className="w-12 h-12" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className={cn('flex items-center gap-1', status.color)}>
            <StatusIcon className={cn('w-3.5 h-3.5', material.processing_status === 'processing' && 'animate-spin')} />
            <span>{status.label}</span>
          </div>
          <span>{formatDistanceToNow(new Date(material.updated_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Processing Overlay */}
      {material.processing_status === 'processing' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm font-medium">Processing...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
