import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [user?.id]);

  const checkSubscription = useCallback(async () => {
    if (!user?.id || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Check if subscription exists in database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .single();
        
        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  }, [user?.id]);

  const subscribe = useCallback(async () => {
    if (!user?.id || !isSupported) {
      toast.error('Push notifications are not supported');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      toast.error('Push notifications are not configured');
      return false;
    }

    setIsLoading(true);
    
    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        toast.error('Notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push manager
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      const subscriptionJson = subscription.toJSON();
      
      if (!subscriptionJson.keys) {
        throw new Error('Subscription keys not available');
      }

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh_key: subscriptionJson.keys.p256dh,
          auth_key: subscriptionJson.keys.auth,
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return false;

    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        // Unsubscribe from push manager
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Failed to disable push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const sendTestNotification = useCallback(async () => {
    if (!user?.id || !isSubscribed) return;

    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: '🎉 Test Notification',
          body: 'Push notifications are working! Time to study!',
          data: { type: 'test' }
        }
      });

      if (error) throw error;
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  }, [user?.id, isSubscribed]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription
  };
}
