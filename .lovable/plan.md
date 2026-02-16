
# Fix Build Error: pushManager TypeScript Type

## Problem
TypeScript doesn't recognize `pushManager` on `ServiceWorkerRegistration` because the Push API types aren't included in the project's TypeScript configuration.

## Solution
Add a type declaration file to extend `ServiceWorkerRegistration` with the Push API types.

## File to Create

**`src/types/push-api.d.ts`** - Add Push API type declarations:

```typescript
interface PushManager {
  getSubscription(): Promise<PushSubscription | null>;
  subscribe(options?: PushSubscriptionOptionsInit): Promise<PushSubscription>;
}

interface ServiceWorkerRegistration {
  pushManager: PushManager;
}
```

This is a single new file that resolves all 3 TypeScript errors in `usePushNotifications.tsx` without modifying any existing code.
