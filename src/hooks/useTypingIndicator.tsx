import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingUser {
  userId: string;
  fullName: string;
  timestamp: number;
}

export function useTypingIndicator(groupId: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!groupId || !user?.id) return;

    const channel = supabase.channel(`typing-${groupId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ userId: string; fullName: string; isTyping: boolean }>();
        const now = Date.now();
        
        const typing: TypingUser[] = [];
        Object.entries(state).forEach(([key, presences]) => {
          if (key !== user.id) {
            presences.forEach((presence) => {
              if (presence.isTyping) {
                typing.push({
                  userId: presence.userId,
                  fullName: presence.fullName || 'Someone',
                  timestamp: now,
                });
              }
            });
          }
        });
        
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id) {
          const now = Date.now();
          newPresences.forEach((presence: any) => {
            if (presence.isTyping) {
              setTypingUsers(prev => {
                const exists = prev.some(u => u.userId === presence.userId);
                if (exists) return prev;
                return [...prev, { userId: presence.userId, fullName: presence.fullName || 'Someone', timestamp: now }];
              });
            }
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== user.id) {
          setTypingUsers(prev => prev.filter(u => u.userId !== key));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: user.id, fullName: '', isTyping: false });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id]);

  const startTyping = useCallback(async (fullName: string) => {
    if (!channelRef.current || !user?.id || isTypingRef.current) return;
    
    isTypingRef.current = true;
    await channelRef.current.track({ userId: user.id, fullName, isTyping: true });

    // Auto-stop typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(fullName);
    }, 3000);
  }, [user?.id]);

  const stopTyping = useCallback(async (fullName: string) => {
    if (!channelRef.current || !user?.id || !isTypingRef.current) return;
    
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    await channelRef.current.track({ userId: user.id, fullName, isTyping: false });
  }, [user?.id]);

  // Filter out stale typing indicators (older than 5 seconds)
  const activeTypingUsers = typingUsers.filter(u => Date.now() - u.timestamp < 5000);

  return {
    typingUsers: activeTypingUsers,
    startTyping,
    stopTyping,
  };
}
