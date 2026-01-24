import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users,
  Plus,
  Search,
  MessageSquare,
  Crown,
  MoreHorizontal,
  UserPlus,
  Globe,
  Lock,
  Loader2,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Calculator,
  Languages,
  Palette,
  Code,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { useGroups, usePublicGroups, useJoinGroup } from "@/hooks/useGroups";
import { useUnreadCounts } from "@/hooks/useUnreadMessages";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Skeleton, SkeletonGroupCard } from "@/components/ui/skeleton";
import { ErrorRecovery } from "@/components/ui/error-recovery";
import { useQueryClient } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";

// Subject categories for discovery
const subjectCategories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "science", label: "Science", icon: FlaskConical },
  { id: "math", label: "Mathematics", icon: Calculator },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "humanities", label: "Humanities", icon: BookOpen },
  { id: "tech", label: "Technology", icon: Code },
  { id: "arts", label: "Arts", icon: Palette },
  { id: "business", label: "Business", icon: TrendingUp },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function GroupsPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const queryClient = useQueryClient();
  const { data: myGroups, isLoading: groupsLoading, isError: groupsError } = useGroups();
  const { data: publicGroups, isLoading: publicLoading, isError: publicError } = usePublicGroups();
  const joinGroup = useJoinGroup();
  
  const groupIds = useMemo(() => myGroups?.map(g => g.id) || [], [myGroups]);
  const { data: unreadCounts } = useUnreadCounts(groupIds);

  const isLoading = groupsLoading || publicLoading;
  const hasError = groupsError || publicError;

  const handleRetry = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['groups'] }),
      queryClient.invalidateQueries({ queryKey: ['public-groups'] }),
    ]);
  };

  // Filter groups based on search
  const filteredMyGroups = myGroups?.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter public groups to exclude ones user is already in
  const myGroupIds = new Set(myGroups?.map(g => g.id) || []);
  const availablePublicGroups = publicGroups?.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const notJoined = !myGroupIds.has(g.id);
    return matchesSearch && notJoined;
  }) || [];

  const handleJoinGroup = async (groupId: string) => {
    await joinGroup.mutateAsync(groupId);
  };

  // Get icon for group based on name/description keywords
  const getGroupIcon = (name: string, description?: string | null) => {
    const text = `${name} ${description || ''}`.toLowerCase();
    if (text.includes('science') || text.includes('biology') || text.includes('chemistry') || text.includes('physics')) return FlaskConical;
    if (text.includes('math') || text.includes('calculus') || text.includes('algebra')) return Calculator;
    if (text.includes('language') || text.includes('english') || text.includes('spanish') || text.includes('french')) return Languages;
    if (text.includes('art') || text.includes('design') || text.includes('music')) return Palette;
    if (text.includes('code') || text.includes('programming') || text.includes('computer') || text.includes('tech')) return Code;
    if (text.includes('business') || text.includes('economics') || text.includes('finance')) return TrendingUp;
    if (text.includes('history') || text.includes('literature') || text.includes('philosophy')) return BookOpen;
    return GraduationCap;
  };

  // Get gradient colors for group cards
  const getGroupGradient = (index: number) => {
    const gradients = [
      'from-violet-500/20 to-purple-500/20',
      'from-blue-500/20 to-cyan-500/20',
      'from-emerald-500/20 to-teal-500/20',
      'from-orange-500/20 to-amber-500/20',
      'from-pink-500/20 to-rose-500/20',
      'from-indigo-500/20 to-blue-500/20',
    ];
    return gradients[index % gradients.length];
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Study Groups">
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Search & Actions Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>

          {/* My Groups Skeleton */}
          <div>
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonGroupCard key={i} />
              ))}
            </div>
          </div>

          {/* Discover Groups Skeleton */}
          <Card variant="elevated">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-40 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (hasError) {
    return (
      <DashboardLayout title="Study Groups">
        <ErrorRecovery
          title="Failed to load groups"
          message="We couldn't load your study groups. Please check your connection and try again."
          onRetry={handleRetry}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Study Groups">
      <PullToRefresh onRefresh={handleRetry} disabled={!isMobile}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
        {/* Header Actions */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button variant="hero" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </motion.div>

        {/* My Groups */}
        <motion.div variants={itemVariants}>
          <h3 className="font-display text-lg font-semibold mb-4">My Groups</h3>
          {filteredMyGroups.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyGroups.map((group) => (
                <Card key={group.id} variant="interactive" className="group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {group.owner_id === user?.id && (
                          <Badge variant="accent" className="text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </Badge>
                        )}
                        {group.is_private ? (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        ) : (
                          <Badge variant="muted" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon-sm" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <h4 className="font-display font-semibold mb-2 line-clamp-1">
                      {group.name}
                    </h4>
                    
                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.member_count || 1}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(group.updated_at), { addSuffix: true })}
                      </span>
                      <Button variant="outline" size="sm" asChild className="relative">
                        <Link to={`/groups/${group.id}`}>
                          <MessageSquare className="w-4 h-4" />
                          Open
                          {unreadCounts?.[group.id] > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center px-1">
                              {unreadCounts[group.id] > 99 ? '99+' : unreadCounts[group.id]}
                            </span>
                          )}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="elevated" className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h4 className="font-medium mb-2">No groups yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create a study group or join a public one to get started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Tip: <Link to="/materials" className="text-primary hover:underline">Upload study materials</Link> first, then share them with your group
              </p>
            </Card>
          )}
        </motion.div>

        {/* Discover Public Groups */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    Discover Study Groups
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Join public study communities and learn together
                  </CardDescription>
                </div>
                {availablePublicGroups.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {availablePublicGroups.length} available
                  </Badge>
                )}
              </div>
              
              {/* Category Filter */}
              <ScrollArea className="w-full mt-4">
                <div className="flex gap-2 pb-2">
                  {subjectCategories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <Button
                        key={category.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={`shrink-0 gap-1.5 ${isActive ? '' : 'bg-secondary/50 hover:bg-secondary'}`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {category.label}
                      </Button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardHeader>
            
            <CardContent>
              {availablePublicGroups.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePublicGroups.map((group, index) => {
                    const GroupIcon = getGroupIcon(group.name, group.description);
                    return (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group relative p-4 rounded-xl bg-gradient-to-br ${getGroupGradient(index)} border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                            <GroupIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-0.5 truncate group-hover:text-primary transition-colors">
                              {group.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{group.member_count || 1} members</span>
                            </div>
                          </div>
                        </div>
                        
                        {group.description && (
                          <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                            {group.description}
                          </p>
                        )}
                        
                        {!group.description && (
                          <div className="mb-4 min-h-[2.5rem]" />
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all"
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={joinGroup.isPending}
                        >
                          {joinGroup.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1.5" />
                              Join Group
                            </>
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Globe className="w-10 h-10 text-primary/50" />
                  </div>
                  <h4 className="font-semibold mb-2">No public groups yet</h4>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Be the first to create a public study group and help others learn together!
                  </p>
                  <Button variant="hero" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Public Group
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      </PullToRefresh>

      <CreateGroupModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </DashboardLayout>
  );
}
