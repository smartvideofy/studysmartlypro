import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder, formatDuration } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

interface VoiceRecorderInputProps {
  onSend: (audioBlob: Blob) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function VoiceRecorderInput({ onSend, onCancel, disabled }: VoiceRecorderInputProps) {
  const { isRecording, duration, waveform, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();
  const [isLocked, setIsLocked] = useState(false);
  const [slideDistance, setSlideDistance] = useState(0);

  const handleMouseDown = async () => {
    if (disabled) return;
    try {
      await startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const handleMouseUp = async () => {
    if (!isRecording || isLocked) return;
    
    if (slideDistance < -80) {
      // Slid left to cancel
      cancelRecording();
      onCancel?.();
    } else {
      // Normal release - send
      const blob = await stopRecording();
      if (blob) {
        onSend(blob);
      }
    }
    setSlideDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRecording) return;
    const touch = e.touches[0];
    const startX = (e.target as HTMLElement).getBoundingClientRect().right;
    const distance = touch.clientX - startX;
    
    if (distance < 0) {
      setSlideDistance(Math.max(distance, -120));
    }
  };

  const handleSendLocked = async () => {
    const blob = await stopRecording();
    if (blob) {
      onSend(blob);
    }
    setIsLocked(false);
  };

  const handleCancelLocked = () => {
    cancelRecording();
    setIsLocked(false);
    onCancel?.();
  };

  // Locked recording UI
  if (isLocked && isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 w-full"
      >
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleCancelLocked}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Waveform */}
        <div className="flex-1 flex items-center gap-1 h-8 px-3 bg-secondary rounded-full">
          {waveform.map((value, index) => (
            <motion.div
              key={index}
              className="w-1 bg-primary rounded-full"
              animate={{ height: `${Math.max(4, value * 24)}px` }}
              transition={{ duration: 0.1 }}
            />
          ))}
          <span className="ml-auto text-sm font-medium text-primary">
            {formatDuration(duration)}
          </span>
        </div>

        <Button
          size="icon"
          className="shrink-0"
          onClick={handleSendLocked}
        >
          <Send className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  // Recording in progress
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 w-full relative"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Cancel hint */}
        <motion.div
          className="flex items-center gap-2 text-muted-foreground text-sm"
          animate={{ x: slideDistance }}
        >
          <X className="w-4 h-4" />
          <span>Slide to cancel</span>
        </motion.div>

        {/* Duration */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="flex items-center gap-2"
            animate={{ x: slideDistance }}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium">{formatDuration(duration)}</span>
          </motion.div>
        </div>

        {/* Lock button */}
        <motion.button
          className={cn(
            "p-2 rounded-full transition-colors",
            "hover:bg-primary/10"
          )}
          onClick={() => setIsLocked(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Lock className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Recording indicator - using semantic design tokens */}
        <motion.div
          className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center cursor-pointer"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Mic className="w-5 h-5 text-destructive-foreground" />
        </motion.div>
      </motion.div>
    );
  }

  // Default mic button
  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 text-muted-foreground hover:text-primary"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      disabled={disabled}
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}
