import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Rocket, FileText, Layers, Sparkles, Users, Settings, 
  Book, HelpCircle, Zap, Shield, CreditCard, Bell
} from "lucide-react";
import type { HelpCategory } from "@/hooks/useHelpCenter";

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
  "credit-card": CreditCard,
  bell: Bell,
};

interface HelpCategoryCardProps {
  category: HelpCategory;
  index: number;
}

export const HelpCategoryCard = ({ category, index }: HelpCategoryCardProps) => {
  const Icon = iconMap[category.icon] || Book;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/help/category/${category.slug}`}>
        <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:border-primary/30 cursor-pointer bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {category.description}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {category.article_count} {category.article_count === 1 ? "article" : "articles"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};
