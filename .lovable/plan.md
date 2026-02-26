
# Fix Notebook Audit Issues

## Issues to Fix

### 1. JWT Expiry in Notebook Pipeline
The `processNotebookPipeline.ts` calls `supabase.functions.invoke()` without refreshing the session first, causing "JWT has expired" errors on long-running pipelines.

**Fix:** Call `supabase.auth.getSession()` before each step invocation to get a fresh token, matching the pattern already applied in `useSubscription.tsx`.

**File:** `src/lib/processNotebookPipeline.ts`

### 2. Notebook Chat Passes Wrong Parameter
`NotebookChatTab.tsx` line 79 sends `materialId: notebookId` to the `material-chat` edge function. The edge function likely looks up `study_materials` by that ID and fails to find it, breaking citation context.

**Fix:** Add a `notebookId` parameter alongside `materialId` so the edge function can check `notebooks` table when `materialId` lookup fails. Also refresh session before the fetch call.

**Files:** `src/components/notebooks/NotebookChatTab.tsx`, `supabase/functions/material-chat/index.ts`

### 3. Concept Map Stale State
`NotebookConceptMapTab.tsx` passes `initialNodes` to `useNodesState()` on mount. When data loads asynchronously, the hook already initialized with empty arrays and never updates.

**Fix:** Use a `useEffect` to call the setter from `useNodesState`/`useEdgesState` when `initialNodes`/`initialEdges` change.

**File:** `src/components/notebooks/NotebookConceptMapTab.tsx`

### 4. Pipeline Resilience (Destructive Retries)
Each pipeline step does `DELETE` then `INSERT` for its content type. If a retry occurs after partial success, previously completed steps get wiped and re-run unnecessarily.

**Fix:** In `processNotebookPipeline.ts`, track which steps already have data and skip them on retry. Add a `startFromStep` parameter or check existing content before invoking each step.

**File:** `src/lib/processNotebookPipeline.ts`

### 5. Chat Persistence (sessionStorage)
Notebook chat history is stored in `sessionStorage` and lost on page refresh. This is a lower-priority UX issue.

**Fix:** Migrate chat storage to `localStorage` with a size cap (keep last 50 messages per notebook). This is a minimal change with meaningful UX improvement.

**File:** `src/components/notebooks/NotebookChatTab.tsx`

---

## Technical Implementation Details

### processNotebookPipeline.ts
```typescript
export async function runNotebookPipeline(notebookId: string): Promise<void> {
  for (const step of NOTEBOOK_PIPELINE_STEPS) {
    // Refresh session before each step to prevent JWT expiry
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Session expired. Please sign in again.');

    const { data, error } = await supabase.functions.invoke('process-notebook', {
      body: { notebookId, step },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    // ... existing error handling
  }
}
```

### NotebookConceptMapTab.tsx
```typescript
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);

useEffect(() => {
  setNodes(initialNodes);
  setEdges(initialEdges);
}, [initialNodes, initialEdges]);
```

### NotebookChatTab.tsx
- Change `sessionStorage` to `localStorage`
- Add session refresh before fetch
- Pass `notebookId` explicitly in request body

### material-chat edge function
- Accept optional `notebookId` param
- When present, fetch combined content from notebook materials instead of single material lookup
