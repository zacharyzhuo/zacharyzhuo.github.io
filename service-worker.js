// Service Worker for Tokyo & Hokkaido Trip PWA
// 版本號會在 build 時自動替換，無需手動修改
const CACHE_NAME = "tokyo-hokkaido-trip-v1772217244266";
const RUNTIME_CACHE = "tokyo-hokkaido-runtime-v1772217244266";

// 需要快取的靜態資源
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/static/css/main.css",
  "/static/js/main.js",
  "/manifest.json",
];

// 安裝 Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching static assets");
      // 只快取關鍵資源，其他資源使用 runtime cache
      return cache.addAll(STATIC_CACHE_URLS).catch((err) => {
        console.log("[Service Worker] Cache failed:", err);
      });
    })
  );
  // 強制激活新的 Service Worker
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 刪除所有舊版本的快取（包括 v1 和其他版本）
              return (
                cacheName !== CACHE_NAME &&
                cacheName !== RUNTIME_CACHE &&
                (cacheName.startsWith("tokyo-hokkaido-") || 
                 cacheName.startsWith("fukuoka-"))
              );
            })
            .map((cacheName) => {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // 立即控制所有客戶端
        return self.clients.claim();
      })
  );
});

// 攔截網路請求
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== "GET") {
    return;
  }

  // 跳過 Chrome 擴展和開發工具
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // 策略：Cache First（快取優先）用於靜態資源
  if (
    url.pathname.startsWith("/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname === "/" ||
    url.pathname === "/index.html"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            // 只快取有效的回應
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // 如果網路失敗，嘗試返回快取
            return caches.match(request);
          });
      })
    );
    return;
  }

  // 策略：Network First（網路優先）用於 API 和外部資源
  // 對於外部圖片（如 Unsplash），使用網路優先
  if (url.hostname === "images.unsplash.com") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // 網路失敗時返回快取
          return caches.match(request);
        })
    );
    return;
  }

  // 預設：網路優先，失敗時使用快取
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 如果沒有快取，返回離線頁面或錯誤
          return new Response("離線中，請檢查網路連線", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain; charset=utf-8",
            }),
          });
        });
      })
  );
});

// 處理背景同步（可選功能）
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag);
  // 可以在這裡實作背景同步邏輯
});

// 處理推送通知（可選功能）
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push notification received");
  // 可以在這裡實作推送通知邏輯
});

// 處理來自客戶端的消息（用於強制更新）
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
