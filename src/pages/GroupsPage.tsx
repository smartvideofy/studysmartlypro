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
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: myGroups, isLoading: groupsLoading, isError: groupsError } = useGroups();
  const { data: publicGroups, isLoading: publicLoading, isError: publicError } = usePublicGroups();
  const joinGroup = useJoinGroup();
  
  const groupIds = useMemo(() => myGroups?.map(g => g.id) || [], [myGroups]);
  const { data: unreadCounts } = useUnreadCounts(groupIds);

  const isLoading = groupsLoading || publicLoading;
  const hasError = groupsError || publicError;

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['public-groups'] });
  };

  // Filter groups based on search
  const filteredMyGroups = myGroups?.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter public groups to exclude ones user is already in
  const myGroupIds = new Set(myGroups?.map(g => g.id) || []);
  const availablePublicGroups = publicGroups?.filter(g => 
    !myGroupIds.has(g.id) && 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleJoinGroup = async (groupId: string) => {
    await joinGroup.mutateAsync(groupId);
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
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </Card>
          )}
        </motion.div>

        {/* Discover Public Groups */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Discover Study Groups
              </CardTitle>
              <CardDescription>Join public study communities</CardDescription>
            </CardHeader>
            <CardContent>
              {availablePublicGroups.length > 0 ? (
                <div className="space-y-4">
                  {availablePublicGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">{group.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{group.member_count || 1} members</span>
                            {group.description && (
                              <span className="line-clamp-1 max-w-xs">{group.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No public groups available to join</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <CreateGroupModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </DashboardLayout>
  );
}
