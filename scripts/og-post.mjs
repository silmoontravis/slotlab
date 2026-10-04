// 幫 front-matter 有 image: /images/posts/<id>.png 但檔案還不存在的文章，用無頭 Chrome 產 1200×630 的 og 卡（標題＋分類＋站名）
//   node scripts/og-post.mjs            只補缺的；--force 全部重產
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const FORCE = process.argv.includes('--force');
const todo = [];
for (const f of fs.readdirSync(path.join(ROOT, 'content/posts')).filter(f => f.endsWith('.md'))) {
  const { data } = matter(fs.readFileSync(path.join(ROOT, 'content/posts', f), 'utf8'));
  if (!data.image || !/^\/images\/posts\//.test(data.image)) continue;
  const out = path.join(ROOT, data.image.slice(1)); if (fs.existsSync(out) && !FORCE) continue;
  todo.push({ title: data.title, cat: site.categories[data.category]?.label || data.category, out });
}
if (!todo.length) { console.log('og-post：沒有要產的'); process.exit(0); }
fs.mkdirSync(path.join(ROOT, 'images/posts'), { recursive: true });
const logo = fs.readFileSync(path.join(ROOT, 'images/logo.png')).toString('base64');
const COLOR = { 老虎機: '#b45309', 娛樂城: '#0e7490', 攻略: '#15803d', RTP: '#6d28d9', 樂透: '#b91c1c' };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const html = (t) => `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif}
.c{width:1200px;height:630px;box-sizing:border-box;padding:64px 80px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,${COLOR[t.cat] || '#1d4ed8'} 150%);color:#fff;display:flex;flex-direction:column;justify-content:space-between;position:relative}
.c:before{content:"";position:absolute;right:-140px;top:-140px;width:460px;height:460px;border-radius:50%;background:rgba(255,255,255,.06)}
.top{display:flex;align-items:center;gap:18px}.top img{width:72px;height:72px;border-radius:18px;background:#fff;padding:6px;box-sizing:border-box}.top b{font-size:30px}.top span{display:block;font-size:18px;color:#cbd5e1}
.tag{display:inline-block;padding:8px 20px;border-radius:999px;background:${COLOR[t.cat] || '#1d4ed8'};font-size:24px;font-weight:700;margin-bottom:22px}
h1{margin:0;font-size:${t.title.length > 28 ? 50 : 58}px;line-height:1.28;font-weight:800;max-width:1000px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.url{font-size:24px;color:#93c5fd;font-weight:700}
</style><div class="c"><div class="top"><img src="data:image/png;base64,${logo}"><div><b>${esc(site.name)}</b><span>${esc(site.tagline)} · 大衛的研究筆記</span></div></div>
<div><div class="tag">${esc(t.cat)}</div><h1>${esc(t.title)}</h1></div><div class="url">www.rtp96.com</div></div>`;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const prof = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'ogp-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--window-size=1200,630', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let port = 0; chrome.stderr.on('data', d => { const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(String(d)); if (m) port = +m[1]; });
for (let i = 0; i < 100 && !port; i++) await sleep(100);
const t0 = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const s = new WebSocket(t0.webSocketDebuggerUrl); await new Promise(r => s.onopen = r);
let id = 0; const wait = new Map(); s.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && wait.has(j.id)) { wait.get(j.id)(j); wait.delete(j.id); } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); s.send(JSON.stringify({ id: i, method, params })); });
try {
  await cmd('Page.enable'); await cmd('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  for (const t of todo) {
    await cmd('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html(t)) }); await sleep(500);
    const r = await cmd('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
    fs.writeFileSync(t.out, Buffer.from(r.result.data, 'base64'));
  }
  console.log(`og-post：產了 ${todo.length} 張 → images/posts/`);
} finally { s.close(); chrome.kill(); await sleep(200); try { fs.rmSync(prof, { recursive: true, force: true }); } catch { } }
