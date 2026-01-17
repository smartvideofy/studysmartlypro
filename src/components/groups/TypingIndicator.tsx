import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
  typingUsers: { userId: string; fullName: string }[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].fullName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].fullName} and ${typingUsers[1].fullName} are typing`;
    } else {
      return `${typingUsers[0].fullName} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground"
      >
        <div className="flex gap-1">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          />
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          />
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          />
        </div>
        <span>{getTypingText()}</span>
      </motion.div>
    </AnimatePresence>
  );
}
