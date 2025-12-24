import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users,
  Plus,
  Search,
  MessageSquare,
  BookOpen,
  Layers,
  Crown,
  MoreHorizontal,
  UserPlus,
  Globe,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layout/DashboardLayout";

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

const myGroups = [
  { 
    id: 1, 
    name: "Organic Chemistry Study Group", 
    members: 12, 
    notes: 24, 
    decks: 8, 
    isOwner: true,
    isPrivate: false,
    lastActive: "2 hours ago"
  },
  { 
    id: 2, 
    name: "History 101 Finals Prep", 
    members: 8, 
    notes: 15, 
    decks: 5, 
    isOwner: false,
    isPrivate: true,
    lastActive: "Yesterday"
  },
  { 
    id: 3, 
    name: "AP Biology", 
    members: 25, 
    notes: 42, 
    decks: 12, 
    isOwner: false,
    isPrivate: false,
    lastActive: "3 days ago"
  },
];

const publicGroups = [
  { 
    id: 4, 
    name: "MCAT Prep Community", 
    members: 1240, 
    notes: 320, 
    decks: 85, 
    category: "Medical"
  },
  { 
    id: 5, 
    name: "SAT Math Masters", 
    members: 890, 
    notes: 156, 
    decks: 45, 
    category: "Test Prep"
  },
  { 
    id: 6, 
    name: "Spanish Language Learners", 
    members: 2100, 
    notes: 420, 
    decks: 120, 
    category: "Languages"
  },
];

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");

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
          
          <Button variant="hero" size="sm">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </motion.div>

        {/* My Groups */}
        <motion.div variants={itemVariants}>
          <h3 className="font-display text-lg font-semibold mb-4">My Groups</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <Card key={group.id} variant="interactive" className="group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {group.isOwner && (
                        <Badge variant="accent" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                      {group.isPrivate ? (
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
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {group.notes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      {group.decks}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Active {group.lastActive}
                    </span>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4" />
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              <div className="space-y-4">
                {publicGroups.map((group) => (
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
                          <Badge variant="ghost" className="text-xs">
                            {group.category}
                          </Badge>
                          <span>{group.members.toLocaleString()} members</span>
                          <span>{group.notes} notes</span>
                          <span>{group.decks} decks</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <UserPlus className="w-4 h-4" />
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
