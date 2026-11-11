import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// After a publish, a tab (or a stale cached page) can ask for code chunks that no longer exist.
// Reload once to pick up the current build instead of showing "Something went wrong".
const RELOAD_KEY = "studily:chunk-reload";
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return; // already tried; let the error screen show
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // storage unavailable: still reload once
  }
  event.preventDefault();
  window.location.reload();
});

// Older builds cached Supabase API responses; drop that cache so nobody is served stale account data.
if ("caches" in window) {
  void caches.delete("supabase-api").catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
