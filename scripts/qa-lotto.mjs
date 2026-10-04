// 樂透工具頁畫面 QA：起 dist 靜態伺服器，真 Chrome 跑：頁籤切換、對獎器（隨機填→對獎→有結果）、四個計算機有輸出、手機不左右滑、沒有 JS 例外；截圖
//   node scripts/qa-lotto.mjs <截圖資料夾>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DIST = path.join(ROOT, 'dist'), OUT = process.argv[2] || path.join(ROOT, 'qa-shots'); fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
const srv = http.createServer((q, s) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; let f = path.join(DIST, p); if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html'; if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r)); const BASE = `http://127.0.0.1:${srv.address().port}`;
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const fails = [];
const ok = (c, n, x = '') => { if (c) pass++; else { fail++; fails.push(n); } console.log(c ? '  ✓' : '  ✗', n, c ? '' : String(x).slice(0, 400)); };
const prof = fs.mkdtempSync(path.join(process.env.TEMP || '/tmp', 'qalt-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${prof}`, '--window-size=1300,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let port = 0; chrome.stderr.on('data', d => { const m = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(String(d)); if (m) port = +m[1]; });
for (let i = 0; i < 100 && !port; i++) await sleep(100);
async function page(url, w, h) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const s = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => s.onopen = r);
  let id = 0; const wait = new Map(); const logs = [];
  s.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && wait.has(j.id)) { wait.get(j.id)(j); wait.delete(j.id); } if (j.method === 'Runtime.exceptionThrown') logs.push(JSON.stringify(j.params).slice(0, 300)); };
  const cmd = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); s.send(JSON.stringify({ id: i, method, params })); });
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
  const ev = async (e) => (await cmd('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const click = async (sel) => { await ev(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(200); };
  const shot = async (n) => fs.writeFileSync(path.join(OUT, n), Buffer.from((await cmd('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
  await cmd('Page.navigate', { url }); await sleep(1200);
  return { ev, click, shot, logs, close: () => s.close() };
}
try {
  for (const g of ['lotto649', 'superlotto638', 'daily539']) {
    const P = await page(`${BASE}/lotto/${g}-results`, 1300, 900);
    ok(await P.ev(`document.querySelectorAll('.balls.big .ball').length >= 5`), `${g}：最新一期有球`);
    ok(await P.ev(`document.querySelector('[data-pane="w30"]') && !document.querySelector('[data-pane="w30"]').hidden && document.querySelector('[data-pane="w50"]').hidden`), `${g}：預設顯示近 30 期`);
    await P.click('[data-tab="w100"]');
    ok(await P.ev(`!document.querySelector('[data-pane="w100"]').hidden && document.querySelector('[data-pane="w30"]').hidden`), `${g}：切到近 100 期`);
    await P.click('[data-random]'); await P.click('[data-check]');
    const res = await P.ev(`document.querySelector('.lt-result').textContent.trim()`);
    ok(/最近 30 期/.test(res), `${g}：對獎器有結果`, res.slice(0, 80));
    const rows = await P.ev(`document.querySelectorAll('.lt-table').length`); ok(rows >= 6, `${g}：統計表 ${rows} 張`);
    ok((await P.ev(`document.documentElement.scrollWidth <= innerWidth`)), `${g}：桌機不左右滑`);
    ok(P.logs.length === 0, `${g}：沒有 JS 例外`, P.logs.join(' | ')); await P.shot(`lotto-${g}-1300.png`); P.close();
    const M = await page(`${BASE}/lotto/${g}-results`, 390, 844);
    ok((await M.ev(`document.documentElement.scrollWidth <= innerWidth`)), `${g}：手機不左右滑`, await M.ev('document.documentElement.scrollWidth + "/" + innerWidth'));
    const ballW = await M.ev(`document.querySelector('.balls.big .ball').getBoundingClientRect().width`); ok(ballW >= 36, `${g}：手機球徑 ${ballW}`);
    await M.shot(`lotto-${g}-390.png`); M.close();
  }
  const C = await page(`${BASE}/lotto/lotto-wheel-calculator`, 1300, 900);
  ok(/28.*1,400/.test((await C.ev(`document.querySelector('[data-calc="wheel"] .calc-out').textContent`)).replace(/\s/g, '')) || /28/.test(await C.ev(`document.querySelector('[data-calc="wheel"] .calc-out').textContent`)), '計算機：大樂透包 8 碼＝28 注 1,400 元', await C.ev(`document.querySelector('[data-calc="wheel"] .calc-out').textContent`));
  await C.click('[data-tab="c2"]'); ok(/15/.test(await C.ev(`document.querySelector('[data-calc="combo"] .calc-out').textContent`)), '計算機：6 碼二星 15 碰');
  await C.click('[data-tab="c3"]'); ok(/38/.test(await C.ev(`document.querySelector('[data-calc="car"] .calc-out').textContent`)), '計算機：539 全車 38 組');
  await C.click('[data-tab="c4"]'); ok(/21/.test(await C.ev(`document.querySelector('[data-calc="pillar"] .calc-out').textContent`)), '計算機：3,3,2 立柱二星 21 碰（9+6+6）', await C.ev(`document.querySelector('[data-calc="pillar"] .calc-out').textContent`));
  ok(C.logs.length === 0, '計算機：沒有 JS 例外', C.logs.join(' | ')); await C.shot('lotto-calc-1300.png'); C.close();
  const H = await page(`${BASE}/lotto/`, 1300, 900);
  ok(await H.ev(`document.querySelectorAll('.lt-card').length === 4`), '專區首頁：三張開獎卡＋計算機卡'); await H.shot('lotto-hub-1300.png'); H.close();
} finally { chrome.kill(); srv.close(); await sleep(200); try { fs.rmSync(prof, { recursive: true, force: true }); } catch { } }
console.log(`\n結果：${pass} 過／${fail} 沒過`); if (fail) console.log('沒過：\n  ' + fails.join('\n  '));
process.exit(fail ? 1 : 0);
