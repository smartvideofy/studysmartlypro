

# Rebrand App Theme to Match Logo Colors

## Overview

Transform the app's color scheme from the current "cool violet" (blue-purple) to a "warm magenta-purple" that matches the logo. This will create visual cohesion between the logo and the entire app experience.

---

## Current vs. New Color Palette

```text
CURRENT THEME:                      NEW THEME (Logo-Matched):
┌────────────────────────┐          ┌────────────────────────┐
│  Cool Violet           │          │  Warm Magenta-Purple   │
│  HSL(262°, 83%, 58%)   │    ──►   │  HSL(285°, 75%, 55%)   │
│  Blue-purple tone      │          │  Pink-purple tone      │
└────────────────────────┘          └────────────────────────┘

The logo has a gradient from ~HSL(285°) magenta to ~HSL(320°) pink
```

---

## Color Scheme Changes

### Primary Color (Main Brand Color)

| Property | Current | New |
|----------|---------|-----|
| Hue | 262° (blue-violet) | 285° (magenta-purple) |
| Saturation | 83% | 75% |
| Lightness | 58% | 55% |
| Dark mode hue | 262° | 285° |

### Background Tints

Update subtle violet tints in backgrounds to use the warmer hue:
- Background: 252° → 290° (subtle magenta tint)
- Muted colors: 252° → 285°
- Ring/focus: Match primary

### Accent Color

Consider updating the accent from coral (12°) to a complementary color:
- Option A: Keep coral (provides contrast)
- Option B: Change to teal/cyan (complements magenta)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Update all HSL hue values from 262/252 to 285/290 |
| `tailwind.config.ts` | No changes needed (uses CSS variables) |

### CSS Variable Updates

```text
Light Mode Changes:
--background: 252 → 290 (subtle magenta tint)
--primary: 262 → 285 (warm magenta-purple)
--primary-muted: 262 → 285
--primary-hover: 262 → 285
--muted: 252 → 285
--border: 252 → 285
--ring: 262 → 285
--sidebar-primary: 262 → 285
--sidebar-ring: 262 → 285

Dark Mode Changes:
--background: 252 → 290
--card: 252 → 285
--primary: 262 → 285
--primary-muted: 265 → 285
--primary-hover: 265 → 285
--muted: 252 → 285
--ring: 262 → 285
--sidebar-primary: 262 → 285
--sidebar-ring: 262 → 285
```

### Deck Colors Update

Update the flashcard deck color palette to match the new brand:

```text
Current deck-color-1: hsl(262 85% 58%)
New deck-color-1: hsl(285 75% 55%)
```

---

## Visual Impact

### Before (Cool Violet)
- Buttons appear blue-purple
- Focus rings have blue tint
- Active navigation has blue-purple accent
- Overall "cool" temperature feeling

### After (Warm Magenta-Purple)
- Buttons match logo color exactly
- Focus rings have pink-purple warmth
- Active navigation feels cohesive with logo
- Overall "warm" energetic feeling

---

## Component Color Classes

These CSS classes will automatically update when CSS variables change (no file edits needed):
- `.text-primary` - Text color
- `.bg-primary` - Button backgrounds
- `.bg-primary/20` - Icon containers
- `.border-primary` - Focus borders
- `.ring-primary` - Focus rings
- `.nav-link.active` - Active navigation

---

## Implementation Details

### Light Mode Primary

```css
/* Current */
--primary: 262 83% 58%;  /* Cool blue-violet */

/* New */
--primary: 285 75% 55%;  /* Warm magenta-purple matching logo */
```

### Dark Mode Primary

```css
/* Current */
--primary: 262 85% 68%;  /* Lighter cool violet */

/* New */
--primary: 285 78% 65%;  /* Lighter warm magenta */
```

### Background Tints

```css
/* Light mode - very subtle magenta tint */
--background: 290 18% 98%;

/* Dark mode - deep magenta-tinted dark */
--background: 285 20% 7%;
```

---

## Testing Checklist

After implementing:
- [ ] Splash screen logo and loading dots match
- [ ] Auth page left panel gradient matches logo
- [ ] All buttons are warm magenta-purple
- [ ] Active navigation items match brand
- [ ] Dark mode looks cohesive
- [ ] Focus states are visible and on-brand
- [ ] Flashcard decks have updated brand color
- [ ] Progress bars and charts use new primary
- [ ] Selection highlight uses new color

---

## Files Changed Summary

Only **1 file** needs modification:
- `src/index.css` - Update CSS custom property values

The entire app will automatically reflect the new branding because all components use the CSS variables.

