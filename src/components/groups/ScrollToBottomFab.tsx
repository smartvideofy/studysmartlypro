import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToBottomFabProps {
  show: boolean;
  unreadCount?: number;
  onClick: () => void;
  className?: string;
}

export function ScrollToBottomFab({ 
  show, 
  unreadCount = 0, 
  onClick, 
  className 
}: ScrollToBottomFabProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={onClick}
          className={cn(
            "absolute bottom-20 right-4 z-10",
            "w-10 h-10 rounded-full shadow-lg",
            "bg-card border border-border",
            "flex items-center justify-center",
            "hover:bg-secondary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/50",
            className
          )}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-primary flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </motion.div>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

interface NewMessagesDividerProps {
  show: boolean;
}

export function NewMessagesDivider({ show }: NewMessagesDividerProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center my-4"
    >
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
        <ChevronDown className="w-3 h-3 text-primary" />
        <span className="text-xs font-medium text-primary">New Messages</span>
      </div>
    </motion.div>
  );
}
