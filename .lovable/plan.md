
# Getstudily — Runtime Performance Audit

Measured live on `/auth` (preview, dev mode). Production build numbers will be ~40–60% better but the bottleneck **ratios** are accurate.

## 1. Measured Core Web Vitals (dev preview, /auth)

| Metric | Value | Verdict |
|---|---|---|
| TTFB | 698 ms | OK |
| First Paint | **6.23 s** | 🔴 Poor (target <1.8s) |
| First Contentful Paint | **6.58 s** | 🔴 Poor (target <1.8s) |
| DOM Interactive | 1.36 s | OK |
| DOMContentLoaded | **6.24 s** | 🔴 Blocked by scripts |
| Full Load | **6.38 s** | 🔴 |
| CLS | 0.0037 | ✅ Good |
| Total Blocking Tasks | 1.41 s task time / 216 ms script | 🟡 |
| JS Heap | 17.9 MB used / 23.5 MB total | ✅ Fine |
| DOM nodes | 263 | ✅ Tiny |
| Resources fetched | **250 scripts**, 2.35 MB | 🔴 |

**Headline finding:** The `/auth` route — which a brand-new visitor hits — downloads **2.35 MB across 250 script requests** and takes **>6 s to paint**. The auth page itself needs almost none of that JS.

## 2. Top runtime bottlenecks (measured)

### 2.1 Massive eager bundle on the public auth page
The 5 largest scripts loaded on `/auth`:

| Module | Size | Load time |
|---|---|---|
| `lucide-react` | 157 KB | **1.51 s** |
| `chunk-RPCDYKBN` (likely Radix/Supabase pre-bundle) | 140 KB | 1.20 s |
| `framer-motion` | 87 KB | **1.35 s** |
| `@xyflow/react` (concept-map graph lib) | 85 KB | **1.33 s** |
| `@supabase/supabase-js` | 82 KB | 1.27 s |

`@xyflow/react` is only used inside `MaterialWorkspace` / `NotebookWorkspace` concept-map tabs — there is **zero reason** for it to load on `/auth`. Same for `recharts`, `react-day-picker`, `embla-carousel`, `react-resizable-panels`, `vaul`, the markdown renderer, the entire groups chat suite, etc. Root cause: `src/components/AnimatedRoutes.tsx` statically imports every page module, so the dependency graph of every route ships to every visitor.

### 2.2 Lucide-react is the single slowest resource (1.51 s)
At 157 KB in dev it dominates load. In prod it tree-shakes per icon, but only if every import is named (`import { X } from "lucide-react"`). Worth verifying no barrel imports leaked in.

### 2.3 250 script requests = HTTP overhead
Even on HTTP/2, 250 parallel requests saturate the connection. Production will collapse this dramatically, but you still need **manualChunks** in `vite.config.ts` to group vendors (react, supabase, radix, recharts, xyflow, framer-motion) into stable chunks for long-term caching across deploys.

### 2.4 Image weight outside JS
Static assets not picked up in this auth-page profile but verified earlier:
- `public/pwa-192x192.png` = **842 KB** (should be ≤20 KB — the 512 variant is only 14 KB, so the 192 is mis-exported).
- `public/og-image.png` = **708 KB** (target ≤120 KB as WebP).
- Both are precached by the PWA Workbox config (`globPatterns: **/*.{png,…}`), so every PWA install eats ~1.5 MB extra.

### 2.5 Render-blocking marker on `/auth`
The single CLS shift comes from `div.flex-1.flex.items-center.justify-center` in AuthPage — a centered loading container with no reserved size. Negligible CLS now but will worsen on slow mobile.

## 3. Network/data layer (observed in earlier audit, not re-measured live)

- `useUnreadMessages` polls **every 30 s** and issues **one COUNT query per group** (N+1). Database function `get_group_unread_count` already exists but isn't used. ➜ One RPC call instead of N.
- `ProcessingStatus` polls every 3 s while a material is processing — fine but verify it stops on terminal state.
- React Query is constructed with `new QueryClient()` (no defaults). `staleTime: 0` means every component remount refetches. With `AnimatePresence mode="wait"` remounting the entire page tree on every navigation, the cache rarely gets reused.
- Six realtime channels per active group page (`group-chat`, `reactions`, `typing`, `read-receipts`, `presence`, `notifications-realtime`). Each is its own WebSocket frame stream.

## 4. Edge functions

No edge-function invocation logs in the last 7 days for the queried window, so no live latency data to report. Recommend enabling timing logs in `process-material` and `paystack` to track P95 over time.

## 5. Analytics context

Last 7 days: 39 visitors, 24 mobile / 13 desktop, top sources Direct + getstudily.com + Google. **Mobile is the majority of traffic** — a 6 s FCP on a phone is the difference between a sign-up and a bounce.

## 6. Prioritized fixes (impact-ranked, measurement-backed)

```text
Tier 1 — Cuts FCP by an estimated 3–4 s on /auth
  A. React.lazy every route in AnimatedRoutes EXCEPT
     SplashScreen + AuthPage. Wrap <Routes> in <Suspense>.
     ➜ Removes xyflow, recharts, markdown, embla, day-picker,
        resizable-panels, vaul, groups chat suite from the auth bundle.
  B. vite.config.ts: build.rollupOptions.output.manualChunks
     { react, supabase, radix, framer, recharts, xyflow }
  C. Re-export pwa-192x192.png at ≤20 KB.
  D. Re-encode og-image to og-image.webp ≤120 KB.
  E. Workbox: add globIgnores for og-image + any marketing PNG >100 KB.

Tier 2 — Cuts idle network noise and re-paint cost
  F. QueryClient defaults: staleTime 30s, gcTime 5m,
     refetchOnWindowFocus: false.
  G. Replace useUnreadMessages loop with one RPC returning
     all group counts (reuse/extend get_group_unread_count).
  H. Remove AnimatePresence mode="wait" wrapper on the route
     tree (or scope it to a tiny fade), so route changes
     don't remount the whole page and refetch every query.
  I. <link rel="preconnect" href="https://ngcmmvyebvekyutbixee.supabase.co">
     in index.html.

Tier 3 — Polish
  J. Vite esbuild.drop: ['console','debugger'] in prod build
     (70+ console.* calls in source).
  K. Consolidate 6 per-group realtime channels into 1 multiplexed.
  L. Verify lucide-react imports are all named (no barrels).
  M. Add web-vitals reporter (LCP/INP/CLS) to a Supabase table
     for ongoing tracking instead of one-off audits.
```

## 7. Expected post-fix numbers (prod build, mobile 4G estimate)

| Metric | Today (prod est.) | After Tier 1 | After Tier 1+2 |
|---|---|---|---|
| FCP on /auth | ~3.0 s | ~1.2 s | ~1.0 s |
| Initial JS (gz) | ~600 KB | ~180 KB | ~150 KB |
| Initial image weight | ~1.6 MB | ~120 KB | ~120 KB |
| Background Supabase calls/min (idle, in-app) | 6–12 | 6–12 | 1–2 |
| Route nav refetches | every nav | every nav | from cache |

## 8. Open questions

1. Start with **Tier 1 only** (highest impact, lowest risk) and ship?
2. OK to disable `refetchOnWindowFocus` globally? (Saves traffic, slightly delays "fresh" data when tabbing back.)
3. Want me to wire a tiny web-vitals → Supabase reporter so future audits use real user data instead of synthetic profiles?
