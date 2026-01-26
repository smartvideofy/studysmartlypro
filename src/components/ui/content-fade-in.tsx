import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ContentFadeInProps {
  children: ReactNode;
  show: boolean;
  className?: string;
}

export const ContentFadeIn = ({ children, show, className }: ContentFadeInProps) => (
  <AnimatePresence mode="wait">
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default ContentFadeIn;
