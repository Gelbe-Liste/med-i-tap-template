self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Bewusst kein aggressives Offline-Caching:
// Bei jedem regulären Aufruf sollen die aktuellen Inhalte des Vercel-Deployments geladen werden.
