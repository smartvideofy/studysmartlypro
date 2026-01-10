import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell,
  Moon,
  Sun,
  LogOut,
  Loader2,
  Clock,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { PushNotificationSettings } from "@/components/settings/PushNotificationSettings";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [studyGoal, setStudyGoal] = useState("general");
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [preferredTime, setPreferredTime] = useState("morning");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

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
      <div className="max-w-2xl space-y-8">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <AvatarUpload 
            avatarUrl={profile?.avatar_url || null}
            fullName={fullName}
            email={user?.email || ""}
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-lg truncate">
              {fullName || "Set your name"}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

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

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-6 flex justify-end">
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}

        {/* Sign Out */}
        <div className="pt-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
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
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {icon && <span className="text-muted-foreground">{icon}</span>}
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
