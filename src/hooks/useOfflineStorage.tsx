import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage, PendingReview } from '@/lib/offlineStorage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { calculateNextReview } from './useFlashcards';
import { toast } from 'sonner';

// --- Online/Offline status hook ---
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

// --- Sync pending reviews when back online ---
export function useOfflineSync() {
  const isOnline = useOfflineStatus();
  const { user } = useAuth();
  const syncingRef = useRef(false);

  const flushPendingReviews = useCallback(async () => {
    if (syncingRef.current || !user?.id) return;
    syncingRef.current = true;

    try {
      const pending = await offlineStorage.getPendingReviews();
      if (pending.length === 0) {
        syncingRef.current = false;
        return;
      }

      let synced = 0;
      for (const review of pending) {
        const updates = calculateNextReview(
          review.quality,
          review.currentEaseFactor,
          review.currentInterval,
          review.currentRepetitions
        );

        const { error } = await supabase
          .from('flashcards')
          .update(updates)
          .eq('id', review.id);

        if (!error) {
          await offlineStorage.removePendingReview(review.id);
          synced++;
        }
      }

      if (synced > 0) {
        toast.success(`Back online — ${synced} review${synced > 1 ? 's' : ''} synced`);
      }
    } catch (e) {
      console.error('Offline sync failed:', e);
    } finally {
      syncingRef.current = false;
    }
  }, [user?.id]);

  // Flush when coming back online
  useEffect(() => {
    if (isOnline) {
      flushPendingReviews();
    }
  }, [isOnline, flushPendingReviews]);

  return { isOnline, flushPendingReviews };
}

// --- Cache helpers to call after successful fetches ---
export function useCacheOnSuccess() {
  const cacheNotes = useCallback((notes: any[]) => {
    offlineStorage.cacheNotes(notes).catch(console.error);
  }, []);

  const cacheDecks = useCallback((decks: any[]) => {
    offlineStorage.cacheDecks(decks).catch(console.error);
  }, []);

  const cacheFlashcards = useCallback((cards: any[]) => {
    offlineStorage.cacheFlashcards(cards).catch(console.error);
  }, []);

  return { cacheNotes, cacheDecks, cacheFlashcards };
}
