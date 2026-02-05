
# Fix Caching Issues Causing Old Layout Display

## Problem Summary

The app sometimes displays old layouts due to:
1. React Query cache not being cleared on logout/user switch
2. Sidebar collapsed state not persisted (resets on refresh)
3. No mechanism to detect and clear stale cached data
4. Missing version-based cache busting

---

## Implementation Plan

### Step 1: Clear React Query Cache on Auth Changes

**File:** `src/hooks/useAuth.tsx`

Update the `signOut` function to clear all cached data:

```text
Before signing out:
├─ Clear React Query cache
├─ Clear any localStorage user data
└─ Then sign out from Supabase
```

Also add a hook to detect user ID changes and clear cache when users switch accounts.

---

### Step 2: Persist Sidebar Collapsed State

**File:** `src/components/layout/DashboardLayout.tsx`

Save the sidebar collapsed preference to localStorage so it persists across page refreshes:

```text
┌─────────────────────────────────────────┐
│  Current: useState(false)               │
│  → Resets to expanded on every refresh  │
├─────────────────────────────────────────┤
│  Fixed: Read from localStorage          │
│  → Remembers user's preference          │
└─────────────────────────────────────────┘
```

---

### Step 3: Add User-Change Detection Hook

**File:** `src/hooks/useAuth.tsx`

Create a mechanism that:
- Tracks the previous user ID
- When user changes (login/logout/switch), clears all React Query caches
- Prevents stale data from previous user showing up

---

### Step 4: Add App Version Cache Busting

**File:** `src/App.tsx`

Add a simple version check that clears localStorage and caches when the app is updated:

```text
On App Mount:
├─ Read stored app version from localStorage
├─ Compare with current version
├─ If different:
│   ├─ Clear React Query cache
│   ├─ Clear user-specific localStorage keys
│   └─ Store new version
└─ Continue normal app loading
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAuth.tsx` | Add cache clearing on signOut, add user change detection |
| `src/components/layout/DashboardLayout.tsx` | Persist sidebar collapsed state in localStorage |
| `src/App.tsx` | Add version-based cache busting logic |

---

## Technical Details

### Auth Hook Updates

```typescript
// Add to useAuth.tsx
import { useQueryClient } from '@tanstack/react-query';

// In signOut function:
const signOut = async () => {
  // Clear React Query cache first
  queryClient.clear();
  
  // Clear any user-specific localStorage
  const keysToRemove = ['sidebar-collapsed'];
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Then sign out
  await supabase.auth.signOut();
};

// Add user change detection effect
useEffect(() => {
  // When user ID changes, clear cached queries
  if (user?.id !== prevUserId.current) {
    queryClient.clear();
    prevUserId.current = user?.id ?? null;
  }
}, [user?.id]);
```

### Sidebar Persistence

```typescript
// In DashboardLayout.tsx
const [collapsed, setCollapsed] = useState(() => {
  // Read from localStorage on initial mount
  const stored = localStorage.getItem('sidebar-collapsed');
  return stored === 'true';
});

// Save when it changes
useEffect(() => {
  localStorage.setItem('sidebar-collapsed', String(collapsed));
}, [collapsed]);
```

### Version Cache Busting

```typescript
// In App.tsx - add before providers
const APP_VERSION = '1.0.1'; // Increment when deploying layout changes

useEffect(() => {
  const storedVersion = localStorage.getItem('app-version');
  if (storedVersion !== APP_VERSION) {
    // Version changed - clear caches
    queryClient.clear();
    localStorage.setItem('app-version', APP_VERSION);
    console.log('App updated, caches cleared');
  }
}, []);
```

---

## Expected Outcome

After these changes:

1. **Logout/User Switch**: All cached data is immediately cleared, new user sees fresh data
2. **Sidebar State**: Persists user's collapse preference across sessions
3. **App Updates**: When you deploy new versions, users' caches are automatically cleared
4. **No More "Old Layout"**: Stale React Query data won't persist incorrectly

---

## Immediate Workaround for Users

Until this fix is deployed, users experiencing the old layout can:
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear site data in browser settings
3. Open in incognito/private browsing mode
