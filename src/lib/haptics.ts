/**
 * Haptic feedback utilities for mobile devices
 * Uses the Vibration API where available
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 20],
  warning: [20, 30, 20],
  error: [30, 50, 30, 50, 30],
  selection: [5],
};

/**
 * Check if haptic feedback is available
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param pattern - The haptic pattern to use
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!isHapticSupported()) return;
  
  try {
    navigator.vibrate(hapticPatterns[pattern]);
  } catch (e) {
    // Silently fail if vibration is blocked
  }
}

/**
 * Trigger a custom haptic pattern
 * @param pattern - Array of vibration durations in ms
 */
export function hapticCustom(pattern: number[]): void {
  if (!isHapticSupported()) return;
  
  try {
    navigator.vibrate(pattern);
  } catch (e) {
    // Silently fail if vibration is blocked
  }
}

/**
 * Stop any ongoing vibration
 */
export function hapticStop(): void {
  if (!isHapticSupported()) return;
  
  try {
    navigator.vibrate(0);
  } catch (e) {
    // Silently fail
  }
}

/**
 * Convenience functions for common haptic patterns
 */
export const haptics = {
  light: () => haptic('light'),
  medium: () => haptic('medium'),
  heavy: () => haptic('heavy'),
  success: () => haptic('success'),
  warning: () => haptic('warning'),
  error: () => haptic('error'),
  selection: () => haptic('selection'),
  tap: () => haptic('light'),
  impact: () => haptic('medium'),
};
