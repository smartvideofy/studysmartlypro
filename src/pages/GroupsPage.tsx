import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users,
  Plus,
  Search,
  MessageSquare,
  Crown,
  UserPlus,
  Globe,
  Lock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  
  const queryClient = useQueryClient();
  const { data: myGroups, isLoading: groupsLoading, isError: groupsError } = useGroups();
  const { data: publicGroups, isLoading: publicLoading, isError: publicError } = usePublicGroups();
  const joinGroup = useJoinGroup();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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

  const filteredMyGroups = myGroups?.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

  if (isLoading) {
    return (
      <DashboardLayout title="Study Groups">
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonGroupCard key={i} />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonGroupCard key={i} />
              ))}
            </div>
          </div>
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

  // Shared card renderer for both My Groups and Discover groups
  const renderGroupCard = (group: any, variant: 'my' | 'discover') => (
    <Card key={group.id} variant="interactive" className="group">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {variant === 'my' && group.owner_id === user?.id && (
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
            {variant === 'my' 
              ? `Updated ${formatDistanceToNow(new Date(group.updated_at), { addSuffix: true })}`
              : `${group.member_count || 1} members`
            }
          </span>
          {variant === 'my' ? (
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
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleJoinGroup(group.id)}
              disabled={joinGroup.isPending}
            >
              {joinGroup.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Join
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
          <div className="relative w-full flex-1 max-w-md">
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
              {filteredMyGroups.map((group) => renderGroupCard(group, 'my'))}
            </div>
          ) : (
            <Card variant="elevated" className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <h4 className="font-display font-semibold text-lg mb-2">No groups yet</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Create a study group or join a public one to get started.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </Card>
          )}
        </motion.div>

        {/* Discover Public Groups */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-display text-lg font-semibold">Discover</h3>
            {availablePublicGroups.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {availablePublicGroups.length} available
              </span>
            )}
          </div>

          {availablePublicGroups.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePublicGroups.map((group) => renderGroupCard(group, 'discover'))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-border rounded-xl">
              <Globe className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <h4 className="font-semibold mb-2">No public groups yet</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Be the first to create a public study group!
              </p>
              <Button variant="hero" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Public Group
              </Button>
            </div>
          )}
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
