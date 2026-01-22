import { Calendar, Clock, ChevronRight, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroupStudySession, useSessionRSVPs } from "@/hooks/useGroupStudySessions";

interface UpcomingSessionsBannerProps {
  sessions: GroupStudySession[];
  onViewAll: () => void;
}

function SessionPreview({ session }: { session: GroupStudySession }) {
  const { data: rsvps } = useSessionRSVPs(session.id);
  const goingCount = rsvps?.filter(r => r.status === 'going').length || 0;
  const scheduledDate = new Date(session.scheduled_at);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{session.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(scheduledDate, "EEE, h:mm a")}
          </span>
          <span>•</span>
          <span className="text-primary font-medium">
            {formatDistanceToNow(scheduledDate, { addSuffix: true })}
          </span>
        </div>
      </div>
      <Badge variant="secondary" className="shrink-0">
        <Users className="h-3 w-3 mr-1" />
        {goingCount}
      </Badge>
    </div>
  );
}

export function UpcomingSessionsBanner({ sessions, onViewAll }: UpcomingSessionsBannerProps) {
  if (!sessions?.length) return null;

  const upcomingSessions = sessions.slice(0, 2);

  return (
    <div className="border border-border rounded-xl bg-card mb-4 overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Upcoming Study Sessions</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {sessions.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs h-7">
          View All
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
      <div className="px-4 divide-y divide-border">
        {upcomingSessions.map(session => (
          <SessionPreview key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
