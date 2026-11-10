// v2 — network-first for the app shell (so bug fixes arrive right away), cache fallback offline
const V = 'xiaobu-kelas-k160';
const CORE = ['./', 'index.html', 'app.css?v=k160', 'app.js?v=k160', 'data.js?v=k160', 'tocfl.js?v=k160', 'sd.js?v=k160', 'hw.js?v=k160', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && !k.startsWith('xb-tts')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const cdn = /fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(u.host);
  if (u.origin !== location.origin && !cdn) return;
  const shell = r.mode === 'navigate' || (u.origin === location.origin && /\.(html|webmanifest)$|\/$/.test(u.pathname));
  if (shell) {
    e.respondWith(caches.open(V).then(async c => {
      try { const res = await Promise.race([fetch(r), timeout(3500)]); if (res && res.ok) c.put(r, res.clone()); return res; }
      catch (err) { return (await c.match(r, { ignoreSearch: true })) || (await c.match('index.html')) || Response.error(); }
    }));
    return;
  }
  // versioned assets / fonts / CDN: cache-first, fill on miss
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r); if (hit) return hit;
    try { const res = await fetch(r); if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }
    catch (err) { return hit || Response.error(); }
  }));
});
