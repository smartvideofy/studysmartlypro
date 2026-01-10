import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdatePromptProps {
  onUpdate: () => void;
}

export const UpdatePrompt = ({ onUpdate }: UpdatePromptProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = () => {
    setIsUpdating(true);
    onUpdate();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:max-w-md z-[100]"
      >
        <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-xl flex items-center gap-4">
          <div className="flex-1">
            <p className="font-medium">Update available!</p>
            <p className="text-sm opacity-90">A new version of Studily is ready.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
