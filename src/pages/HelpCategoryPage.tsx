import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { 
  Rocket, FileText, Layers, Sparkles, Users, Settings, 
  Book, HelpCircle, Zap, Shield
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useHelpCategory, useHelpArticles } from "@/hooks/useHelpCenter";
import { HelpArticleItem } from "@/components/help/HelpArticleItem";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const iconMap: Record<string, React.ComponentType<any>> = {
  rocket: Rocket,
  "file-text": FileText,
  layers: Layers,
  sparkles: Sparkles,
  users: Users,
  settings: Settings,
  book: Book,
  "help-circle": HelpCircle,
  zap: Zap,
  shield: Shield,
};

const SkeletonArticleList = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-border/50">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const HelpCategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { data: category, isLoading: categoryLoading } = useHelpCategory(categorySlug || "");
  const { data: articles, isLoading: articlesLoading } = useHelpArticles(categorySlug);

  const Icon = category?.icon ? iconMap[category.icon] || Book : Book;

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
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category?.title || "Category"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Link
          to="/help"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Help Center</span>
        </Link>

        {/* Category Header */}
        {categoryLoading ? (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        ) : category ? (
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{category.title}</h1>
                <p className="text-muted-foreground mt-1">{category.description}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Category not found</p>
          </div>
        )}

        {/* Articles List */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Articles in this category
          </h2>
          
          {articlesLoading ? (
            <SkeletonArticleList />
          ) : articles && articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map((article, index) => (
                <HelpArticleItem key={article.id} article={article} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No articles in this category yet.</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default HelpCategoryPage;
