import { motion, AnimatePresence } from "framer-motion";

interface SidebarNavSectionProps {
  label: string;
  collapsed: boolean;
}

export function SidebarNavSection({ label, collapsed }: SidebarNavSectionProps) {
  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-3 pt-4 pb-1"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
