import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Mail, MailX, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEOHead } from "@/components/seo";

interface EmailPrefs {
  weekly_progress: boolean;
  streak_reminders: boolean;
  achievement_alerts: boolean;
  product_updates: boolean;
  welcome_emails: boolean;
}

export default function UnsubscribePage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [preferences, setPreferences] = useState<EmailPrefs>({
    weekly_progress: true,
    streak_reminders: true,
    achievement_alerts: true,
    product_updates: true,
    welcome_emails: true,
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    // Fetch current preferences
    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("unsubscribe_token", token)
        .single();

      if (error || !data) {
        setStatus("error");
        return;
      }

      setPreferences({
        weekly_progress: data.weekly_progress,
        streak_reminders: data.streak_reminders,
        achievement_alerts: data.achievement_alerts,
        product_updates: data.product_updates,
        welcome_emails: data.welcome_emails,
      });
      setStatus("ready");
    };

    fetchPreferences();
  }, [token]);

  const handleUnsubscribeAll = async () => {
    if (!token) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("email_preferences")
        .update({
          weekly_progress: false,
          streak_reminders: false,
          achievement_alerts: false,
          product_updates: false,
          welcome_emails: false,
        })
        .eq("unsubscribe_token", token);

      if (error) throw error;

      setStatus("success");
      toast.success("Successfully unsubscribed from all emails");
    } catch (error) {
      console.error("Unsubscribe error:", error);
      toast.error("Failed to unsubscribe");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePreferences = async () => {
    if (!token) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("email_preferences")
        .update(preferences)
        .eq("unsubscribe_token", token);

      if (error) throw error;

      toast.success("Email preferences updated");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update preferences");
    } finally {
      setUpdating(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <SEOHead
          title="Invalid Link | StudySmartly"
          description="This unsubscribe link is invalid or has expired."
          noindex
        />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This unsubscribe link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              To manage your email preferences, please log in to your account.
            </p>
            <Button asChild>
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <SEOHead
          title="Unsubscribed | StudySmartly"
          description="You have been successfully unsubscribed from StudySmartly emails."
          noindex
        />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Successfully Unsubscribed</CardTitle>
            <CardDescription>
              You've been unsubscribed from all marketing emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You'll still receive important transactional emails about your account and subscription.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" asChild>
                <Link to="/">Go to Homepage</Link>
              </Button>
              <Button asChild>
                <Link to="/settings">Manage Preferences</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEOHead
        title="Email Preferences | StudySmartly"
        description="Manage your email notification preferences for StudySmartly."
        noindex
      />
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Choose which emails you'd like to receive from StudySmartly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="weekly_progress"
                checked={preferences.weekly_progress}
                onCheckedChange={(checked) => 
                  setPreferences((prev) => ({ ...prev, weekly_progress: !!checked }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="weekly_progress" className="font-medium cursor-pointer">
                  Weekly Progress Reports
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get a summary of your study progress every Sunday
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="streak_reminders"
                checked={preferences.streak_reminders}
                onCheckedChange={(checked) => 
                  setPreferences((prev) => ({ ...prev, streak_reminders: !!checked }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="streak_reminders" className="font-medium cursor-pointer">
                  Streak Reminders
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when your study streak is at risk
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="achievement_alerts"
                checked={preferences.achievement_alerts}
                onCheckedChange={(checked) => 
                  setPreferences((prev) => ({ ...prev, achievement_alerts: !!checked }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="achievement_alerts" className="font-medium cursor-pointer">
                  Achievement Celebrations
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive emails when you unlock new achievements
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="product_updates"
                checked={preferences.product_updates}
                onCheckedChange={(checked) => 
                  setPreferences((prev) => ({ ...prev, product_updates: !!checked }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="product_updates" className="font-medium cursor-pointer">
                  Product Updates & Tips
                </Label>
                <p className="text-xs text-muted-foreground">
                  Learn about new features and study tips
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="welcome_emails"
                checked={preferences.welcome_emails}
                onCheckedChange={(checked) => 
                  setPreferences((prev) => ({ ...prev, welcome_emails: !!checked }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="welcome_emails" className="font-medium cursor-pointer">
                  Welcome & Onboarding
                </Label>
                <p className="text-xs text-muted-foreground">
                  Helpful emails when you're getting started
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleUpdatePreferences} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnsubscribeAll}
              disabled={updating}
            >
              <MailX className="h-4 w-4 mr-2" />
              Unsubscribe from All
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Note: You'll still receive important emails about your account and subscription.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
