/// <reference lib="webworker" />

import {
  CacheFirst,
  ExpirationPlugin,
  Serwist,
  type PrecacheEntry,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: PrecacheEntry[];
};

const SHELL_CACHE = "pickle-king-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch(new Request("/", { cache: "reload" })).then(async (response) => {
      if (!response.ok) throw new Error("App shell request failed.");
      const cache = await caches.open(SHELL_CACHE);
      await cache.put("/", response);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(SHELL_CACHE);
          await cache.put("/", response.clone());
        }
        return response;
      })
      .catch(async () => {
        const shell = await caches.match("/");
        if (shell) return shell;
        return (await caches.match("/offline.html")) ?? Response.error();
      }),
  );
});

const serwist = new Serwist({
  cacheId: "pickle-king-v1",
  clientsClaim: false,
  disableDevLogs: true,
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) =>
        sameOrigin &&
        ["font", "image", "script", "style"].includes(request.destination),
      handler: new CacheFirst({
        cacheName: "pickle-king-assets",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          }),
        ],
      }),
    },
  ],
  skipWaiting: false,
});

serwist.addEventListeners();
