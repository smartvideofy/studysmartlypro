
# Reorganize Desktop Sidebar for Better Navigation

## Overview

Restructure the desktop sidebar to improve discoverability, visual hierarchy, and user experience. The reorganization will group related items, add missing navigation options, and improve the overall layout.

---

## Proposed Sidebar Structure

```text
┌─────────────────────────────┐
│  [Logo] Studily             │
├─────────────────────────────┤
│  MAIN                       │
│  ├─ Dashboard               │
│  ├─ Study Materials         │
│  └─ Flashcards              │
├─────────────────────────────┤
│  COMMUNITY                  │
│  └─ Groups                  │
├─────────────────────────────┤
│  INSIGHTS                   │
│  ├─ Progress                │
│  └─ Achievements            │
├─────────────────────────────┤
│  [Study Tools Submenu]      │ ← Only when in material workspace
│  ├─ Tutor Notes             │
│  ├─ Summaries               │
│  ├─ Flashcards              │
│  ├─ Questions               │
│  ├─ Concept Map             │
│  └─ AI Chat                 │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐│
│  │ ⭐ Upgrade to Pro       ││ ← CTA card for free users
│  │ Unlock all features     ││
│  └─────────────────────────┘│
│                             │
├─────────────────────────────┤
│  Settings                   │
│  Help                       │
└─────────────────────────────┘
```

---

## Changes Summary

| Change | Description |
|--------|-------------|
| **Add section labels** | Group items under "MAIN", "COMMUNITY", "INSIGHTS" headers |
| **Add Achievements** | Include `/achievements` in the sidebar (currently mobile-only) |
| **Add Premium CTA** | Show upgrade card for free users (like mobile drawer) |
| **Move Pricing** | Remove from bottom nav, integrate as CTA card |
| **Improve collapsed state** | Show tooltips when sidebar is collapsed |
| **Add active state to bottom nav** | Bottom items don't show active indicators currently |

---

## Implementation Details

### File to Modify
**`src/components/layout/DashboardLayout.tsx`**

### 1. Update Navigation Items Structure

Define grouped navigation with section labels:

```typescript
const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "Study Materials", path: "/materials" },
  { icon: Layers, label: "Flashcards", path: "/flashcards" },
];

const communityNavItems = [
  { icon: Users, label: "Groups", path: "/groups" },
];

const insightsNavItems = [
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: Trophy, label: "Achievements", path: "/achievements" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];
```

### 2. Add Section Label Component

Create a reusable section label that hides when collapsed:

```typescript
function SidebarSection({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-3 pt-4 pb-1"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
    </motion.div>
  );
}
```

### 3. Add Premium CTA Card

Add upgrade card above bottom navigation for free users:

```typescript
{subscription?.plan === 'free' && !collapsed && (
  <motion.div className="mx-3 mb-3">
    <Link
      to="/pricing"
      className="block p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 hover:border-primary/40 transition-all"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Go Pro</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Unlock all features
      </p>
    </Link>
  </motion.div>
)}
```

### 4. Add Tooltips for Collapsed State

Wrap nav items in Tooltip when collapsed:

```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// When collapsed, show tooltip on hover
{collapsed ? (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={item.path} className="...">
          <Icon className="w-5 h-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        {item.label}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
) : (
  <Link to={item.path} className="...">
    <Icon className="w-5 h-5" />
    <span>{item.label}</span>
  </Link>
)}
```

### 5. Add Active State to Bottom Nav Items

Update bottom nav to show active indicator:

```typescript
{bottomNavItems.map((item) => {
  const Icon = item.icon;
  const isActive = location.pathname === item.path;
  
  return (
    <Link
      key={item.path}
      to={item.path}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="bottomNavActive"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
        />
      )}
      <Icon className="w-5 h-5" />
      {!collapsed && <span className="text-sm">{item.label}</span>}
    </Link>
  );
})}
```

---

## Additional Imports Required

```typescript
import { Trophy, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
```

---

## Visual Before & After

**Before:**
- Flat list of 5 main items
- 3 bottom items (including Pricing)
- No visual grouping
- No Achievements link
- No upgrade CTA

**After:**
- 3 grouped sections with labels
- Achievements added to Insights section
- Premium CTA card for free users
- Tooltips in collapsed state
- Active states on all nav items

---

## Mobile Considerations

No changes needed for mobile - the MobileBottomNav and MobileMenuDrawer already have:
- Achievements link in drawer
- Premium CTA card in drawer
- 5-item bottom navigation (Home, Materials, Flashcards, Groups, Settings)
