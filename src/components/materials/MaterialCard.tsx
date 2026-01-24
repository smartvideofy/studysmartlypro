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

const fileTypeConfig: Record<string, { icon: typeof FileText; gradient: string; bgColor: string; label: string }> = {
  pdf: { icon: FileText, gradient: 'from-red-500/20 via-red-500/10 to-transparent', bgColor: 'bg-red-500/12', label: 'PDF' },
  docx: { icon: FileText, gradient: 'from-blue-500/20 via-blue-500/10 to-transparent', bgColor: 'bg-blue-500/12', label: 'Word' },
  pptx: { icon: FileSpreadsheet, gradient: 'from-orange-500/20 via-orange-500/10 to-transparent', bgColor: 'bg-orange-500/12', label: 'PowerPoint' },
  audio: { icon: FileAudio, gradient: 'from-purple-500/20 via-purple-500/10 to-transparent', bgColor: 'bg-purple-500/12', label: 'Audio' },
  image: { icon: FileImage, gradient: 'from-green-500/20 via-green-500/10 to-transparent', bgColor: 'bg-green-500/12', label: 'Image' },
  other: { icon: FileText, gradient: 'from-muted-foreground/20 via-muted/10 to-transparent', bgColor: 'bg-muted/30', label: 'File' },
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
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden hover:border-primary/25 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => {
        haptics.selection();
        onClick();
      }}
    >
      {/* File Type Banner with gradient */}
      <div className={cn('relative h-24 flex items-center justify-center overflow-hidden', fileConfig.bgColor)}>
        {/* Decorative gradient orb */}
        <div className={cn("absolute inset-0 bg-gradient-to-br", fileConfig.gradient)} />
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-60 -translate-y-1/2 translate-x-1/4 bg-gradient-to-br from-white/20 to-transparent" />
        
        <motion.div
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <FileIcon className="w-12 h-12 opacity-80" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
          {material.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs rounded-full px-2.5">
            {fileConfig.label}
          </Badge>
          {material.subject && (
            <Badge variant="outline" className="text-xs rounded-full px-2.5">
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
          <span className="opacity-75">{formatDistanceToNow(new Date(material.updated_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Actions - Always visible on mobile */}
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
              size="icon" 
              className="h-9 w-9 rounded-xl shadow-sm backdrop-blur-sm"
              onClick={() => haptics.selection()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-background/85 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-md bg-primary/20 animate-pulse" />
              <Loader2 className="relative w-10 h-10 animate-spin text-primary" />
            </div>
            <p className="text-sm font-medium">Processing...</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
