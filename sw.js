/* ─────────────────────────────────────────────────────────────
   서비스워커 — 공연장에서 인터넷이 안 돼도 가사가 열리도록 폰에 저장해 둡니다.
   CACHE_VERSION 은 GitHub Actions 가 배포할 때마다 자동으로 바꿉니다.
   (Actions 없이 올린다면 고칠 때마다 직접 올려 주세요: v1 → v2 …)
   ───────────────────────────────────────────────────────────── */
const CACHE_VERSION = "v1";
const CACHE_NAME = `uma-call-guide-${CACHE_VERSION}`;

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./data/index.json"            // 곡 목록 (곡 파일은 처음 열 때 자동 저장)
];
const RUNTIME_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE.map(url =>
      cache.add(new Request(url, { cache: "reload" })).catch(() => {})
    ));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("uma-call-guide-") && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 같은 사이트 파일: 네트워크 우선 → 실패하면 저장본 (가사 수정이 바로 반영되도록)
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
        return Response.error();
      }
    })());
    return;
  }

  // 구글 폰트: 저장본 우선
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
        return res;
      } catch (e) { return Response.error(); }
    })());
  }
  // 유튜브 등 나머지는 손대지 않음 (영상은 인터넷이 있어야 나옵니다)
});
