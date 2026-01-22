import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Eye, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useHelpArticle, useHelpArticles } from "@/hooks/useHelpCenter";
import { HelpArticleItem } from "@/components/help/HelpArticleItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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

// Simple markdown-like renderer
const renderContent = (content: string) => {
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
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm font-mono'>$1</code>");
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

const HelpArticlePage = () => {
  const { articleSlug } = useParams<{ articleSlug: string }>();
  const { data: article, isLoading } = useHelpArticle(articleSlug || "");
  const category = article?.category as any;
  const { data: relatedArticles } = useHelpArticles(category?.slug);

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

  const filteredRelated = relatedArticles?.filter((a) => a.id !== article?.id).slice(0, 3);

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
                {renderContent(article.content)}
              </div>
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

        {/* Related Articles */}
        {filteredRelated && filteredRelated.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4">Related Articles</h2>
            <div className="space-y-3">
              {filteredRelated.map((relatedArticle, index) => (
                <HelpArticleItem key={relatedArticle.id} article={relatedArticle} index={index} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default HelpArticlePage;
