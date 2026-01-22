import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, ChevronRight } from "lucide-react";
import type { HelpArticle } from "@/hooks/useHelpCenter";

interface HelpArticleItemProps {
  article: HelpArticle;
  index: number;
}

export const HelpArticleItem = ({ article, index }: HelpArticleItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Link
        to={`/help/article/${article.slug}`}
        className="group flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {article.title}
          </h4>
          {article.summary && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
              {article.summary}
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </Link>
    </motion.div>
  );
};
