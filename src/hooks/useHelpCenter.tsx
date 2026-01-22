import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HelpCategory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  article_count?: number;
}

export interface HelpArticle {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  is_faq: boolean;
  is_featured: boolean;
  display_order: number;
  views: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: HelpCategory;
}

export const useHelpCategories = () => {
  return useQuery({
    queryKey: ["help-categories"],
    queryFn: async () => {
      const { data: categories, error } = await supabase
        .from("help_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Get article counts for each category
      const { data: articles } = await supabase
        .from("help_articles")
        .select("category_id")
        .eq("is_active", true);

      const countMap = new Map<string, number>();
      articles?.forEach((a) => {
        countMap.set(a.category_id, (countMap.get(a.category_id) || 0) + 1);
      });

      return (categories as HelpCategory[]).map((cat) => ({
        ...cat,
        article_count: countMap.get(cat.id) || 0,
      }));
    },
  });
};

export const useHelpArticles = (categorySlug?: string) => {
  return useQuery({
    queryKey: ["help-articles", categorySlug],
    queryFn: async () => {
      let query = supabase
        .from("help_articles")
        .select("*, category:help_categories(*)")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (categorySlug) {
        // First get the category ID
        const { data: category } = await supabase
          .from("help_categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();

        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HelpArticle[];
    },
    enabled: categorySlug !== undefined || true,
  });
};

export const useFAQs = () => {
  return useQuery({
    queryKey: ["help-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_articles")
        .select("*, category:help_categories(*)")
        .eq("is_active", true)
        .eq("is_faq", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HelpArticle[];
    },
  });
};

export const useHelpArticle = (articleSlug: string) => {
  return useQuery({
    queryKey: ["help-article", articleSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_articles")
        .select("*, category:help_categories(*)")
        .eq("slug", articleSlug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as HelpArticle;
    },
    enabled: !!articleSlug,
  });
};

export const useSearchHelpArticles = (query: string) => {
  return useQuery({
    queryKey: ["help-search", query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const searchTerm = `%${query.toLowerCase()}%`;
      const { data, error } = await supabase
        .from("help_articles")
        .select("*, category:help_categories(*)")
        .eq("is_active", true)
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},summary.ilike.${searchTerm}`)
        .order("display_order", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as HelpArticle[];
    },
    enabled: query.length >= 2,
  });
};

export const useHelpCategory = (categorySlug: string) => {
  return useQuery({
    queryKey: ["help-category", categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_categories")
        .select("*")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as HelpCategory;
    },
    enabled: !!categorySlug,
  });
};

// View tracking is handled directly in the article page via update query
