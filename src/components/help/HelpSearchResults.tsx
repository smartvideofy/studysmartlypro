import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { HelpArticleItem } from "./HelpArticleItem";
import type { HelpArticle } from "@/hooks/useHelpCenter";

interface HelpSearchResultsProps {
  query: string;
  results: HelpArticle[];
  isLoading: boolean;
}

export const HelpSearchResults = ({ query, results, isLoading }: HelpSearchResultsProps) => {
  if (!query || query.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-medium">
          Search results for "{query}"
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No articles found matching your search.</p>
          <p className="text-sm mt-1">Try different keywords or browse categories below.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {results.map((article, index) => (
              <HelpArticleItem key={article.id} article={article} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
