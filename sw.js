/* 초원의 밤 — 서비스워커: 전체 precache + cache-first (오프라인 절대 보장) */
"use strict";
const V = "v2.1.2+__BUILD__"; /* __BUILD__는 CI 배포 시 커밋 SHA로 치환됨 (pages.yml) — 배포마다 SW가 자동 갱신됨 */
const CACHE = "steppe-night-" + V;
const ASSETS = [
  "./",
  "./index.html",
  "./core.js",
  "./shell.js",
  "./games/liar.js",
  "./games/mafia.js",
  "./games/choseong.js",
  "./games/balance.js",
  "./games/roulette.js",
  "./games/fruit.js",
  "./games/omok.js",
  "./games/forehead.js",
  "./games/life.js",
  "./games/drawrelay.js",
  "./games/catchmind.js",
  "./games/wolf.js",
  "./games/bomb.js",
  "./games/tele.js",
  "./games/lv.js",
  "./games/vg.js",
  "./games/bz.js",
  "./games/um.js",
  "./games/gq.js",
  "./games/ta.js",
  "./games/nb.js",
  "./games/gm.js",
  "./games/mp.js",
  "./games/er.js",
  "./games/net.js",
  "./lib/qrcode-gen.js",
  "./lib/jsqr.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-48.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        /* 프리캐시 목록 밖 요청도 성공하면 담아둠 (동일 오리진만) */
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        /* 오프라인 + 미캐시: 내비게이션이면 앱 셸로 */
        if (e.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
