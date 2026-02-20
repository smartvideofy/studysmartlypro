import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell,
  Moon,
  Sun,
  LogOut,
  Loader2,
  Clock,
  Target,
  Crown,
  CreditCard,
  Shield,
  HelpCircle,
  FileText,
  ExternalLink,
  
  ChevronRight,
  Key,
  ChevronDown,
  Mail,
  Trophy,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalBody,
} from "@/components/ui/responsive-modal";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, useCancelSubscription, type PlanType } from "@/hooks/useSubscription";
import { useTrialStatus } from "@/hooks/useSubscription";
import { useTheme } from "next-themes";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { PushNotificationSettings } from "@/components/settings/PushNotificationSettings";
import { EmailPreferencesSection } from "@/components/settings/EmailPreferencesSection";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { haptics } from "@/lib/haptics";

const APP_VERSION = "1.0.1";

const PLAN_LABELS: Record<PlanType, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-muted text-muted-foreground" },
  pro: { label: "Pro", color: "bg-primary text-primary-foreground" },
  team: { label: "Team", color: "bg-gradient-to-r from-primary to-accent text-white" },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const cancelSubscription = useCancelSubscription();
  const { isOnTrial, trialDaysRemaining, trialExpired } = useTrialStatus();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  // Determine display state
  const isExpiredUser = trialExpired || (subscription?.trial_used && subscription?.plan === 'free');

  const [fullName, setFullName] = useState("");
  const [studyGoal, setStudyGoal] = useState("general");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [preferredTime, setPreferredTime] = useState("morning");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setStudyGoal(profile.study_goal || "general");
      setDailyMinutes(profile.daily_study_minutes || 30);
      setPreferredTime(profile.preferred_study_time || "morning");
      setNotificationEnabled(profile.notification_enabled ?? true);
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({
      full_name: fullName,
      study_goal: studyGoal,
      daily_study_minutes: dailyMinutes,
      preferred_study_time: preferredTime,
      notification_enabled: notificationEnabled,
    }, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };


  const isDark = theme === "dark";
  // Show Pro label if on trial
  const displayPlan = isOnTrial ? 'pro' : (subscription?.plan || 'free');
  const planInfo = PLAN_LABELS[displayPlan];

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-2xl space-y-8 pb-24">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <AvatarUpload 
            avatarUrl={profile?.avatar_url || null}
            fullName={fullName}
            email={user?.email || ""}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-lg truncate">
                {fullName || "Set your name"}
              </h2>
              <Badge className={planInfo.color}>{planInfo.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Activity Section */}
        <Section title="Activity">
          <LinkRow 
            icon={<Trophy className="w-4 h-4" />}
            label="Achievements"
            description="View your earned badges"
            onClick={() => navigate('/achievements')}
          />
          <Separator />
          <LinkRow 
            icon={<BarChart3 className="w-4 h-4" />}
            label="Progress & Stats"
            description="Track your study analytics"
            onClick={() => navigate('/progress')}
          />
        </Section>

        {/* Subscription Section */}
        <Section title="Subscription">
          {subLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <SettingRow 
                icon={<Crown className="w-4 h-4" />}
                label="Current Plan" 
                description={
                  isOnTrial
                    ? `Pro trial - ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining`
                    : isExpiredUser
                    ? 'Your trial has ended. Subscribe to continue.'
                    : subscription?.status === 'active' 
                      ? `Your subscription is active${subscription?.billing_interval ? ` (${subscription.billing_interval === 'yearly' ? 'Annual' : 'Monthly'})` : ''}`
                      : 'Start your free trial'
                }
              >
                <div className="flex items-center gap-2">
                  <Badge className={planInfo.color}>{planInfo.label}</Badge>
                  {isOnTrial && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                      Trial
                    </Badge>
                  )}
                  {isExpiredUser && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      Expired
                    </Badge>
                  )}
                  {subscription?.billing_interval && subscription?.plan !== 'free' && (
                    <Badge variant="outline" className="capitalize text-xs">
                      {subscription.billing_interval === 'yearly' ? 'Annual' : 'Monthly'}
                    </Badge>
                  )}
                  {(subscription?.plan === 'free' || isOnTrial || isExpiredUser) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/pricing')}
                    >
                      {isExpiredUser ? 'Subscribe Now' : isOnTrial ? 'Subscribe' : 'Start Trial'}
                    </Button>
                  )}
                </div>
              </SettingRow>
              {subscription?.plan !== 'free' && subscription?.current_period_end && !isOnTrial && (
                <>
                  <Separator />
                  <SettingRow 
                    icon={<CreditCard className="w-4 h-4" />}
                    label="Next Billing Date" 
                    description="Your subscription renews automatically"
                  >
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
                    </span>
                  </SettingRow>
                  <Separator />
                  <SettingRow 
                    label="Manage Subscription" 
                    description="Cancel or modify your plan"
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        haptics.light();
                        setCancelDialogOpen(true);
                      }}
                    >
                      Cancel Plan
                    </Button>
                  </SettingRow>
                </>
              )}
            </>
          )}
        </Section>

        {/* Account Section */}
        <Section title="Account">
          <SettingRow label="Full Name" description="Your display name">
            <Input
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setHasChanges(true); }}
              placeholder="Enter your name"
              className="max-w-[200px] h-9"
            />
          </SettingRow>
          <Separator />
          <SettingRow label="Email" description="Your account email">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </SettingRow>
          
          {/* Only show password change for email/password users */}
          {user?.app_metadata?.provider === 'email' && (
            <>
              <Separator />
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Change Password</p>
                        <p className="text-xs text-muted-foreground">Update your account password</p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ChangePasswordForm userEmail={user?.email || ""} />
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </Section>

        {/* Study Preferences */}
        <Section title="Study Preferences">
          <SettingRow 
            icon={<Target className="w-4 h-4" />}
            label="Study Goal" 
            description="What's your main focus?"
          >
            <Select value={studyGoal} onValueChange={(v) => { setStudyGoal(v); setHasChanges(true); }}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="exams">Exam Prep</SelectItem>
                <SelectItem value="language">Language</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator />
          <SettingRow 
            icon={<Clock className="w-4 h-4" />}
            label="Daily Goal" 
            description="Target study time per day"
          >
            <Select value={String(dailyMinutes)} onValueChange={(v) => { setDailyMinutes(Number(v)); setHasChanges(true); }}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <Separator />
          <SettingRow label="Preferred Time" description="When do you like to study?">
            <Select value={preferredTime} onValueChange={(v) => { setPreferredTime(v); setHasChanges(true); }}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="night">Night</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <SettingRow 
            icon={<Bell className="w-4 h-4" />}
            label="In-App Notifications" 
            description="Show notifications inside the app"
          >
            <Switch
              checked={notificationEnabled}
              onCheckedChange={(checked) => {
                setNotificationEnabled(checked);
                updateProfile.mutate({ notification_enabled: checked });
              }}
            />
          </SettingRow>
          <Separator />
          <PushNotificationSettings />
        </Section>

        {/* Email Preferences */}
        <Section title="Email Notifications">
          <EmailPreferencesSection />
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow 
            icon={isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            label="Dark Mode" 
            description="Toggle dark theme"
          >
            <Switch
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </SettingRow>
        </Section>

        {/* Support & Legal */}
        <Section title="Support">
          <LinkRow 
            icon={<HelpCircle className="w-4 h-4" />}
            label="Help Center" 
            onClick={() => navigate('/help')}
          />
          <Separator />
          <LinkRow 
            icon={<FileText className="w-4 h-4" />}
            label="Terms of Service" 
            external
            href="https://getstudily.com/terms"
          />
          <Separator />
          <LinkRow 
            icon={<Shield className="w-4 h-4" />}
            label="Privacy Policy" 
            external
            href="https://getstudily.com/privacy"
          />
          <Separator />
          <LinkRow 
            icon={<FileText className="w-4 h-4" />}
            label="Cookie Policy" 
            external
            href="https://getstudily.com/cookies"
          />
        </Section>


        {/* Cancel Subscription Modal */}
        <ResponsiveModal open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Cancel Subscription?</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              You'll lose access to premium features at the end of your billing period. 
              Your data will be preserved.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          <ResponsiveModalFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Plan
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                haptics.error();
                cancelSubscription.mutate();
                setCancelDialogOpen(false);
              }}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModal>


        {/* Save Button */}
        {hasChanges && (
          <div className="fixed bottom-24 lg:bottom-6 left-0 right-0 flex justify-center z-50 px-4">
            <Button 
              onClick={handleSave} 
              disabled={updateProfile.isPending}
              className="shadow-lg"
            >
              {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}

        {/* Sign Out */}
        <div className="pt-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>

        {/* App Version */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            Studily v{APP_VERSION}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
        {title}
      </h3>
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ icon, label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 min-h-[52px]">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <span className="text-muted-foreground">{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface LinkRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}

function LinkRow({ icon, label, description, onClick, href, external }: LinkRowProps) {
  const content = (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 min-h-[52px] hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted/70">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
            <span className="text-muted-foreground">{icon}</span>
          </div>
        )}
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {external ? (
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <div onClick={onClick}>{content}</div>;
}
