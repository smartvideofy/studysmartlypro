import { Bell, BellOff, BellRing, Loader2, Send, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

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

export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    isConfigured,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  if (!isSupported || !isConfigured) {
    return (
      <SettingRow
        icon={<BellOff className="w-4 h-4" />}
        label="Push Notifications"
        description={!isSupported ? "Not supported in this browser" : "Not configured"}
      >
        <span className="text-xs text-muted-foreground">Unavailable</span>
      </SettingRow>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Notifications Blocked</p>
            <p className="text-xs text-muted-foreground mt-1">
              You've blocked notifications for this site. To enable them, click the lock icon in your browser's address bar and allow notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <SettingRow
        icon={
          isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSubscribed ? (
            <BellRing className="w-4 h-4 text-primary" />
          ) : (
            <Bell className="w-4 h-4" />
          )
        }
        label="Push Notifications"
        description={
          isSubscribed
            ? "Receive alerts even when the app is closed"
            : "Get notified about study reminders"
        }
      >
        <Switch
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </SettingRow>

      {isSubscribed && (
        <div className="px-4 pb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="w-full"
          >
            <Send className="w-3.5 h-3.5 mr-2" />
            Send Test Notification
          </Button>
        </div>
      )}
    </div>
  );
}
