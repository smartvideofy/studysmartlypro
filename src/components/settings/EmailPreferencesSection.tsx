import { Mail, TrendingUp, Flame, Trophy, Sparkles, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useEmailPreferences, useUpdateEmailPreferences } from "@/hooks/useEmailPreferences";

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingRow = ({ icon, label, description, children }: SettingRowProps) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3">
    <div className="flex items-center gap-3">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

export function EmailPreferencesSection() {
  const { data: preferences, isLoading } = useEmailPreferences();
  const updatePreferences = useUpdateEmailPreferences();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleToggle = (field: string, value: boolean) => {
    updatePreferences.mutate({ [field]: value });
  };

  return (
    <>
      <SettingRow
        icon={<TrendingUp className="w-4 h-4" />}
        label="Weekly Progress Reports"
        description="Get a summary of your study progress every Sunday"
      >
        <Switch
          checked={preferences?.weekly_progress ?? true}
          onCheckedChange={(checked) => handleToggle("weekly_progress", checked)}
          disabled={updatePreferences.isPending}
        />
      </SettingRow>
      <Separator />
      <SettingRow
        icon={<Flame className="w-4 h-4" />}
        label="Streak Reminders"
        description="Get notified when your study streak is at risk"
      >
        <Switch
          checked={preferences?.streak_reminders ?? true}
          onCheckedChange={(checked) => handleToggle("streak_reminders", checked)}
          disabled={updatePreferences.isPending}
        />
      </SettingRow>
      <Separator />
      <SettingRow
        icon={<Trophy className="w-4 h-4" />}
        label="Achievement Celebrations"
        description="Receive emails when you unlock new achievements"
      >
        <Switch
          checked={preferences?.achievement_alerts ?? true}
          onCheckedChange={(checked) => handleToggle("achievement_alerts", checked)}
          disabled={updatePreferences.isPending}
        />
      </SettingRow>
      <Separator />
      <SettingRow
        icon={<Sparkles className="w-4 h-4" />}
        label="Product Updates & Tips"
        description="Learn about new features and study tips"
      >
        <Switch
          checked={preferences?.product_updates ?? true}
          onCheckedChange={(checked) => handleToggle("product_updates", checked)}
          disabled={updatePreferences.isPending}
        />
      </SettingRow>
      <Separator />
      <SettingRow
        icon={<Mail className="w-4 h-4" />}
        label="Welcome & Onboarding"
        description="Helpful emails when you're getting started"
      >
        <Switch
          checked={preferences?.welcome_emails ?? true}
          onCheckedChange={(checked) => handleToggle("welcome_emails", checked)}
          disabled={updatePreferences.isPending}
        />
      </SettingRow>
    </>
  );
}
