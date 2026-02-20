

# Fix: Sidebar Showing on Tablet Viewports

## Problem
The app switches from mobile layout (bottom nav + compact header) to desktop layout (sidebar) at **768px** (`md:` breakpoint). On tablets and narrow windows (768-1024px), the 260px sidebar consumes ~34% of the screen width, leaving content severely cramped -- exactly what your screenshot shows.

## Solution
Raise the layout breakpoint from **768px** (`md:`) to **1024px** (`lg:`) so that tablets and narrow windows get the mobile-optimized layout instead of the desktop sidebar.

## Changes Required

### 1. Update `useIsMobile` hook
**File:** `src/hooks/use-mobile.tsx`
- Change `MOBILE_BREAKPOINT` from `768` to `1024`
- This controls the React conditional rendering (`isMobile` flag) used by `DashboardLayout` to decide whether to show the sidebar or mobile nav

### 2. Update `DashboardLayout` Tailwind classes
**File:** `src/components/layout/DashboardLayout.tsx`
- Change `md:pb-0` to `lg:pb-0` (bottom padding for mobile nav)
- Change `md:ml-[72px]` / `md:ml-[260px]` to `lg:ml-[72px]` / `lg:ml-[260px]` (sidebar margin)

### 3. Update `MobileBottomNav` visibility
**File:** `src/components/layout/MobileBottomNav.tsx`
- Change `md:hidden` to `lg:hidden` so bottom nav stays visible up to 1024px

### 4. Update `MobileHeader` visibility
**File:** `src/components/layout/MobileHeader.tsx`
- Change `md:hidden` to `lg:hidden` on the header and search overlay

### 5. Update `SettingsPage` save button positioning
**File:** `src/pages/SettingsPage.tsx`
- Change `md:bottom-6` to `lg:bottom-6` to match the new breakpoint

### 6. Update `GroupDetailPage` mobile margin
**File:** `src/pages/GroupDetailPage.tsx`
- Update any `md:mb-0` references to `lg:mb-0`

## Result
- Devices under 1024px wide (phones and tablets) get the clean mobile layout with bottom navigation
- Devices 1024px and above get the full desktop sidebar layout
- No visual change on phones or large desktops -- only tablets are affected

