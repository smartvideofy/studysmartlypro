import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, BookOpen, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useHelpArticle, useHelpArticles, useHelpCategories, HelpArticle } from "@/hooks/useHelpCenter";
import { HelpArticleItem } from "@/components/help/HelpArticleItem";
import { ArticleFeedback } from "@/components/help/ArticleFeedback";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

// Article link pattern: [[article-slug|Display Text]] or [[article-slug]]
const parseArticleLinks = (text: string, articles: HelpArticle[]): string => {
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, slug, displayText) => {
    const linkedArticle = articles.find(a => a.slug === slug.trim());
    if (linkedArticle) {
      const text = displayText || linkedArticle.title;
      return `<a href="/help/article/${slug.trim()}" class="text-primary hover:underline font-medium inline-flex items-center gap-1">${text}</a>`;
    }
    return displayText || slug;
  });
};

// Simple markdown-like renderer with article linking
const renderContent = (content: string, allArticles: HelpArticle[] = []) => {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-4 text-muted-foreground">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  const parseInline = (text: string) => {
    let parsed = text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm font-mono'>$1</code>");
    
    // Parse article links
    parsed = parseArticleLinks(parsed, allArticles);
    
    return parsed;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={index} className="text-xl font-bold text-foreground mt-8 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4">
          {trimmed.slice(2)}
        </h1>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        flushList();
        inList = true;
      }
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
    }
    // Bullet list
    else if (trimmed.startsWith("- ")) {
      if (!inList) {
        flushList();
        inList = true;
      }
      listItems.push(trimmed.slice(2));
    }
    // Empty line
    else if (trimmed === "") {
      flushList();
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p
          key={index}
          className="text-muted-foreground leading-relaxed my-3"
          dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }}
        />
      );
    }
  });

  flushList();
  return elements;
};

const SkeletonArticle = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <div className="flex gap-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="space-y-3 mt-8">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-6 w-1/3 mt-6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  </div>
);

// Suggested articles based on content keywords
const getSuggestedArticles = (currentArticle: HelpArticle, allArticles: HelpArticle[]): HelpArticle[] => {
  const keywords = [
    'flashcard', 'note', 'study', 'export', 'import', 'account', 'password', 
    'ai', 'keyboard', 'shortcut', 'subscription', 'billing', 'sync', 'upload'
  ];
  
  const currentContent = (currentArticle.title + ' ' + currentArticle.content).toLowerCase();
  const matchedKeywords = keywords.filter(k => currentContent.includes(k));
  
  return allArticles
    .filter(a => a.id !== currentArticle.id)
    .map(article => {
      const articleContent = (article.title + ' ' + article.content).toLowerCase();
      const score = matchedKeywords.filter(k => articleContent.includes(k)).length;
      return { article, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ article }) => article);
};

const HelpArticlePage = () => {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  const { data: article, isLoading } = useHelpArticle(articleSlug || "");
  const { data: allArticles } = useHelpArticles();
  const { data: categories } = useHelpCategories();
  const category = article?.category as any;
  const { data: categoryArticles } = useHelpArticles(category?.slug);

  // Increment view count on mount
  useEffect(() => {
    if (article?.id) {
      supabase
        .from("help_articles")
        .update({ views: (article.views || 0) + 1 })
        .eq("id", article.id)
        .then(() => {});
    }
  }, [article?.id]);

  // Related articles from same category
  const sameCategory = categoryArticles?.filter((a) => a.id !== article?.id).slice(0, 3) || [];
  
  // AI-suggested articles from other categories
  const suggestedArticles = article && allArticles 
    ? getSuggestedArticles(article, allArticles).filter(a => a.category_id !== article.category_id)
    : [];

  // Other categories for exploration
  const otherCategories = categories?.filter(c => c.id !== article?.category_id).slice(0, 3) || [];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/help">Help Center</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/help/category/${category.slug}`}>{category.title}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[200px]">
                {article?.title || "Article"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Link
          to={category ? `/help/category/${category.slug}` : "/help"}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {category?.title || "Help Center"}</span>
        </Link>

        {/* Article Content */}
        {isLoading ? (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <SkeletonArticle />
            </CardContent>
          </Card>
        ) : article ? (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                {category && (
                  <Link to={`/help/category/${category.slug}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80">
                      {category.title}
                    </Badge>
                  </Link>
                )}
                {article.is_featured && (
                  <Badge variant="default">Featured</Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-4">
                {article.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {article.views} views
                </span>
              </div>

              <div className="prose prose-sm max-w-none">
                {renderContent(article.content, allArticles || [])}
              </div>

              <ArticleFeedback
                articleId={article.id}
                helpfulCount={article.helpful_count || 0}
                notHelpfulCount={article.not_helpful_count || 0}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Article not found</p>
            <Link to="/help" className="text-primary hover:underline mt-2 inline-block">
              Return to Help Center
            </Link>
          </div>
        )}

        {/* More in This Category */}
        {sameCategory.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                More in {category?.title}
              </h2>
              <Link 
                to={`/help/category/${category?.slug}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {sameCategory.map((relatedArticle, index) => (
                <HelpArticleItem key={relatedArticle.id} article={relatedArticle} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* You Might Also Like */}
        {suggestedArticles.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4">You Might Also Like</h2>
            <div className="space-y-3">
              {suggestedArticles.map((suggestedArticle, index) => (
                <HelpArticleItem key={suggestedArticle.id} article={suggestedArticle} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Explore Other Topics */}
        {otherCategories.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4">Explore Other Topics</h2>
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((cat) => (
                <Link key={cat.id} to={`/help/category/${cat.slug}`}>
                  <Badge 
                    variant="outline" 
                    className="px-4 py-2 hover:bg-primary/10 hover:border-primary transition-colors cursor-pointer"
                  >
                    {cat.title}
                    <span className="ml-2 text-muted-foreground">({cat.article_count})</span>
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default HelpArticlePage;
