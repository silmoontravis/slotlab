// 廣告版位畫面 QA：本機起靜態伺服器跑 dist/，真 Chrome 三種寬度量每個版位的大小、看得到哪一張、圖有沒有載到，並截圖
//   node scripts/qa-ads.mjs <截圖資料夾>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DIST = path.join(ROOT, 'dist'), OUT = process.argv[2] || path.join(ROOT, 'qa-shots'); fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain' };
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  let f = path.join(DIST, p); if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';   // 跟 Pages 一樣：無副檔名也找得到
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s);
}).listen(0);
await new Promise(r => srv.on('listening', r)); const BASE = `http://127.0.0.1:${srv.address().port}`;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const fails = [];
const ok = (c, n, x = '') => { if (c) pass++; else { fail++; fails.push(n); } console.log(c ? '  ✓' : '  ✗', n, c ? '' : String(x).slice(0, 400)); };
const prof = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'qaads-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--window-size=1300,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let port = 0; chrome.stderr.on('data', d => { const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(String(d)); if (m) port = +m[1]; });
for (let i = 0; i < 100 && !port; i++) await sleep(100);
async function page(url, w, h) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const s = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => s.onopen = r);
  let id = 0; const wait = new Map(); const logs = [];
  s.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && wait.has(j.id)) { wait.get(j.id)(j); wait.delete(j.id); } if (j.method === 'Runtime.exceptionThrown') logs.push(JSON.stringify(j.params).slice(0, 300)); };
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); s.send(JSON.stringify({ id: i, method, params })); });
  await cmd('Runtime.enable'); await cmd('Page.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
  const ev = async (expr) => { const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
  await cmd('Page.navigate', { url }); await sleep(1500);
  const shot = async (name) => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name), Buffer.from(r.result.data, 'base64')); };
  return { ev, shot, logs, close: () => s.close() };
}
const MEASURE = `(() => [...document.querySelectorAll('.ad-rotator')].map(el => { const r = el.getBoundingClientRect(); const on = el.querySelector('.ad-item.on'); const img = on && on.querySelector('img'); const all = el.querySelectorAll('.ad-item'); const vis = [...all].filter(a => getComputedStyle(a).opacity === '1').length; return { id: el.dataset.adId, w: Math.round(r.width), h: Math.round(r.height), items: all.length, vis, on: on && on.dataset.ad, href: on && on.href, loaded: (img && img.complete && img.naturalWidth > 0) || (img && img.loading === 'lazy' && r.top > innerHeight), lazyBelow: img && img.loading === 'lazy' && r.top > innerHeight, src: img && img.currentSrc.split('/').pop(), alt: img && img.alt.length, inView: r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' && el.offsetParent !== null }; }))()`;
try {
  for (const [name, url] of [['home', '/'], ['article', '/blog/posts/casino-bonus-types'], ['category', '/slots/']]) {
    for (const [w, h] of [[1300, 900], [1024, 800], [390, 844]]) {
      const P = await page(BASE + url, w, h); await sleep(800);
      const m = (await P.ev(MEASURE)) || [];
      const shown = m.filter(x => x.inView);
      ok(shown.length >= 1, `${name}@${w}：有 ${shown.length} 個版位顯示（共 ${m.length}）`, JSON.stringify(m));
      for (const x of shown) {
        const expectH = x.id.startsWith('B') || x.id.startsWith('E') ? null : Math.round(x.w * 90 / 728);
        ok(x.vis === 1 && x.items === 2 && x.loaded && x.alt > 20 && /cs\.wii789\.com\/ask\/(ceo|123win)$/.test(x.href) && x.w <= 728 && x.w > 0 && (expectH == null || Math.abs(x.h - expectH) <= 2) && (w >= 600 || x.w <= w - 16),
          `  ${x.id} ${x.w}×${x.h} 顯示 ${x.on}（${x.src}）`, JSON.stringify(x));
      }
      const sw = await P.ev('document.documentElement.scrollWidth <= innerWidth'); ok(sw, `  ${name}@${w} 沒有左右捲動`);
      const products = new Set(shown.map(x => x.on)); if (shown.length >= 2) ok(products.size === 2, '  同一頁同時看得到兩個產品', [...products].join(','));
      ok(P.logs.length === 0, '  沒有 JS 例外', P.logs.join(' | '));
      await P.shot(`${name}-${w}.png`); P.close();
    }
  }
  // 輪播會換：等 9 秒看首頁 A 版位換成另一張
  const P = await page(BASE + '/', 1300, 900); const a0 = (await P.ev(MEASURE))[0].on; await sleep(8600); const a1 = (await P.ev(MEASURE))[0].on;
  ok(a0 !== a1, `8 秒後輪播換張（${a0} → ${a1}）`); P.close();
} finally { chrome.kill(); srv.close(); await sleep(200); try { fs.rmSync(prof, { recursive: true, force: true }); } catch { } }
console.log(`\n結果：${pass} 過／${fail} 沒過`); if (fail) console.log('沒過：\n  ' + fails.join('\n  '));
process.exit(fail ? 1 : 0);
