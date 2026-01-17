import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useJoinByInvite } from "@/hooks/useGroupInvites";
import { useAuth } from "@/hooks/useAuth";

export default function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const joinByInvite = useJoinByInvite();

  useEffect(() => {
    if (!authLoading && !user) {
      // Store invite code and redirect to login
      sessionStorage.setItem('pendingInvite', inviteCode || '');
      navigate('/auth?redirect=/groups/join/' + inviteCode);
    }
  }, [user, authLoading, inviteCode, navigate]);

  useEffect(() => {
    // Check for pending invite after login
    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (user && pendingInvite && pendingInvite === inviteCode) {
      sessionStorage.removeItem('pendingInvite');
      handleJoin();
    }
  }, [user]);

  const handleJoin = async () => {
    if (!inviteCode) return;
    
    try {
      const groupId = await joinByInvite.mutateAsync(inviteCode);
      navigate(`/groups/${groupId}`);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Join Study Group</CardTitle>
          <CardDescription>
            You've been invited to join a study group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {joinByInvite.isError ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">
                {joinByInvite.error?.message || 'Failed to join group'}
              </p>
              <Button variant="outline" onClick={() => navigate('/groups')}>
                Go to Groups
              </Button>
            </div>
          ) : joinByInvite.isSuccess ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Successfully joined the group!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                <p className="font-mono font-medium">{inviteCode}</p>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleJoin}
                disabled={joinByInvite.isPending}
              >
                {joinByInvite.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Join Group
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => navigate('/groups')}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
