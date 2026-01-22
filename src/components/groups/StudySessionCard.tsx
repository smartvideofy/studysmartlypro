import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  Users, 
  Link2, 
  Check, 
  HelpCircle, 
  X,
  Trash2,
  ExternalLink,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow, isPast, addMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  GroupStudySession, 
  useSessionRSVPs, 
  useUpdateRSVP, 
  useDeleteGroupStudySession 
} from "@/hooks/useGroupStudySessions";

interface StudySessionCardProps {
  session: GroupStudySession;
  groupId: string;
}

export function StudySessionCard({ session, groupId }: StudySessionCardProps) {
  const { user } = useAuth();
  const { data: rsvps } = useSessionRSVPs(session.id);
  const updateRSVP = useUpdateRSVP();
  const deleteSession = useDeleteGroupStudySession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const scheduledDate = new Date(session.scheduled_at);
  const endDate = addMinutes(scheduledDate, session.duration_minutes);
  const isLive = !isPast(endDate) && isPast(scheduledDate);
  const isUpcoming = !isPast(scheduledDate);
  const isCreator = user?.id === session.created_by;

  const goingCount = rsvps?.filter(r => r.status === 'going').length || 0;
  const maybeCount = rsvps?.filter(r => r.status === 'maybe').length || 0;
  const myRSVP = rsvps?.find(r => r.user_id === user?.id);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleRSVP = (status: 'going' | 'maybe' | 'not_going') => {
    updateRSVP.mutate({ sessionId: session.id, status });
  };

  const handleDelete = () => {
    deleteSession.mutate({ sessionId: session.id, groupId });
    setDeleteDialogOpen(false);
  };

  return (
    <div className={cn(
      "border rounded-xl p-4 bg-card",
      isLive && "border-primary/50 bg-primary/5"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium">{session.title}</h4>
            {isLive && (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
                Live Now
              </Badge>
            )}
          </div>
          
          {session.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {session.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(scheduledDate, "EEE, MMM d")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {format(scheduledDate, "h:mm a")} ({session.duration_minutes} min)
            </span>
            {isUpcoming && (
              <span className="text-primary font-medium">
                {formatDistanceToNow(scheduledDate, { addSuffix: true })}
              </span>
            )}
          </div>

          {session.meeting_link && (
            <a
              href={session.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
            >
              <Link2 className="h-3.5 w-3.5" />
              Join Meeting
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* RSVP counts */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{goingCount}</span>
            {maybeCount > 0 && (
              <span className="text-muted-foreground">(+{maybeCount} maybe)</span>
            )}
          </div>
          
          {/* RSVP avatars */}
          {goingCount > 0 && (
            <TooltipProvider>
              <div className="flex -space-x-2">
                {rsvps?.filter(r => r.status === 'going').slice(0, 5).map((rsvp) => (
                  <Tooltip key={rsvp.id}>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={rsvp.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(rsvp.profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {rsvp.profile?.full_name || "Unknown"}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {goingCount > 5 && (
                  <div className="h-6 w-6 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-[10px] font-medium">
                    +{goingCount - 5}
                  </div>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* RSVP Buttons */}
      {isUpcoming && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground mr-2">RSVP:</span>
          <Button
            variant={myRSVP?.status === 'going' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRSVP('going')}
            disabled={updateRSVP.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Going
          </Button>
          <Button
            variant={myRSVP?.status === 'maybe' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleRSVP('maybe')}
            disabled={updateRSVP.isPending}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Maybe
          </Button>
          <Button
            variant={myRSVP?.status === 'not_going' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => handleRSVP('not_going')}
            disabled={updateRSVP.isPending}
            className={cn(myRSVP?.status === 'not_going' && "text-destructive")}
          >
            <X className="h-4 w-4 mr-1" />
            Can't make it
          </Button>

          {isCreator && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Study Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{session.title}" and remove all RSVPs. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSession.isPending}
            >
              {deleteSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Session"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
