import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BarChart3, Check, Lock, Trash2, MoreHorizontal, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GroupPoll, useVotePoll, useClosePoll, useDeletePoll } from "@/hooks/useGroupPolls";
import { useAuth } from "@/hooks/useAuth";

interface PollCardProps {
  poll: GroupPoll;
  groupId: string;
  isAdmin: boolean;
}

export function PollCard({ poll, groupId, isAdmin }: PollCardProps) {
  const { user } = useAuth();
  const votePoll = useVotePoll();
  const closePoll = useClosePoll();
  const deletePoll = useDeletePoll();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCreator = poll.created_by === user?.id;
  const canManage = isCreator || isAdmin;
  const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false;
  const isClosed = poll.is_closed || isExpired;

  const userVotes = poll.votes.filter(v => v.user_id === user?.id);
  const hasVoted = userVotes.length > 0;

  const handleVote = async (optionId: string) => {
    if (isClosed) return;

    // If not allowing multiple and user already voted for different option, don't allow
    if (!poll.allow_multiple && hasVoted) {
      const currentVoteOptionId = userVotes[0]?.option_id;
      if (currentVoteOptionId !== optionId) {
        // Remove old vote first by voting for it again (toggle)
        await votePoll.mutateAsync({ pollId: poll.id, optionId: currentVoteOptionId, groupId });
      }
    }

    await votePoll.mutateAsync({ pollId: poll.id, optionId, groupId });
  };

  const handleClose = () => {
    closePoll.mutate({ pollId: poll.id, groupId });
  };

  const handleDelete = () => {
    deletePoll.mutate({ pollId: poll.id, groupId });
    setDeleteDialogOpen(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const maxVotes = Math.max(...poll.options.map(o => o.vote_count), 1);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={poll.creator?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(poll.creator?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{poll.creator?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isClosed && (
                <Badge variant="secondary" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Closed
                </Badge>
              )}
              {poll.is_anonymous && (
                <Badge variant="outline" className="text-xs">Anonymous</Badge>
              )}
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isClosed && (
                      <DropdownMenuItem onClick={handleClose}>
                        <Lock className="w-4 h-4 mr-2" />
                        Close Poll
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Poll
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">{poll.question}</h3>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {poll.options.map((option) => {
            const percentage = poll.total_votes > 0 
              ? Math.round((option.vote_count / poll.total_votes) * 100) 
              : 0;
            const isSelected = userVotes.some(v => v.option_id === option.id);
            const isWinning = option.vote_count === maxVotes && option.vote_count > 0;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={isClosed || votePoll.isPending}
                className={`w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden ${
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                } ${isClosed ? "cursor-default" : "cursor-pointer"}`}
              >
                {/* Progress bar background */}
                {(hasVoted || isClosed) && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`absolute inset-y-0 left-0 ${
                      isWinning ? "bg-primary/15" : "bg-muted"
                    }`}
                  />
                )}

                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isSelected ? "font-medium" : ""}`}>
                      {option.option_text}
                    </span>
                  </div>

                  {(hasVoted || isClosed) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{option.vote_count}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""}</span>
            </div>
            {poll.allow_multiple && (
              <span>Multiple selection allowed</span>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this poll and all votes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
