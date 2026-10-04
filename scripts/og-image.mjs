// 產站的預設 og:image（1200×630）：用無頭 Chrome 把一張 HTML 卡片截成 PNG → images/og-default.png
//   node scripts/og-image.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const logo = fs.readFileSync(path.join(ROOT, 'images/logo.png')).toString('base64');
const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif}
.c{width:1200px;height:630px;box-sizing:border-box;padding:70px 80px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#1d4ed8 140%);color:#fff;display:flex;flex-direction:column;justify-content:space-between;position:relative}
.c:before{content:"";position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:rgba(37,99,235,.25)}
.top{display:flex;align-items:center;gap:22px}.top img{width:96px;height:96px;border-radius:24px;background:#fff;padding:8px;box-sizing:border-box}
.name{font-size:44px;font-weight:800;letter-spacing:1px}.sub{font-size:22px;color:#cbd5e1;margin-top:6px}
h1{margin:0;font-size:58px;line-height:1.25;font-weight:800;max-width:980px}
.tags{display:flex;gap:14px}.tags span{padding:10px 22px;border-radius:999px;background:rgba(255,255,255,.12);font-size:24px;border:1px solid rgba(255,255,255,.25)}
.url{position:absolute;right:80px;bottom:62px;font-size:26px;color:#93c5fd;font-weight:700}
</style><div class="c"><div class="top"><img src="data:image/png;base64,${logo}"><div><div class="name">大衛の電子攻略站</div><div class="sub">用數據拆解博弈：老虎機 · 樂透 · 娛樂城 · RTP</div></div></div>
<h1>軟體工程師的機率研究筆記<br>看懂 RTP、波動、期望值再下決定</h1>
<div class="tags"><span>RTP 數據</span><span>老虎機機制</span><span>台彩冷熱號</span><span>娛樂城觀察</span></div><div class="url">www.rtp96.com</div></div>`;
const prof = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'og-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--window-size=1200,630', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let port = 0; chrome.stderr.on('data', d => { const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(String(d)); if (m) port = +m[1]; });
for (let i = 0; i < 100 && !port; i++) await sleep(100);
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const s = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => s.onopen = r);
let id = 0; const wait = new Map(); s.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && wait.has(j.id)) { wait.get(j.id)(j); wait.delete(j.id); } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); s.send(JSON.stringify({ id: i, method, params })); });
try {
  await cmd('Page.enable'); await cmd('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) }); await sleep(1200);
  const r = await cmd('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  const out = path.join(ROOT, 'images/og-default.png'); fs.writeFileSync(out, Buffer.from(r.result.data, 'base64'));
  const b = fs.readFileSync(out); console.log(out, b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), (b.length / 1024).toFixed(0) + 'KB');
} finally { s.close(); chrome.kill(); await sleep(200); try { fs.rmSync(prof, { recursive: true, force: true }); } catch { } }
