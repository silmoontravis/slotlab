// 台彩官方 JSON API → data/lotto/{lotto649,superlotto638,daily539}.json（docs/ARCHITECTURE.md §2.6）
//   node scripts/lotto-fetch.mjs            增量：從庫內最新一期的月份抓到本月
//   node scripts/lotto-fetch.mjs --backfill 全量：2014-01 至今按月迴圈
//   驗證：期號遞增、號碼數量／範圍／不重複、開獎日合法；任一不過就不寫、記 errors、exit 2。同期內容改變 → 覆寫並記 revisedAt
//   來源 memory reference_taiwanlottery_api_and_gsc_access：免金鑰、Cache-Control no-store、帶 Referer 較保險
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DIR = path.join(ROOT, 'data/lotto'); fs.mkdirSync(DIR, { recursive: true });
const BASE = 'https://api.taiwanlottery.com/TLCAPIWeB/Lottery';
const GAMES = {
  lotto649: { api: 'Lotto649Result', key: 'lotto649Res', pick: 6, max: 49, special: true, name: '大樂透', days: [2, 5] },
  superlotto638: { api: 'SuperLotto638Result', key: 'superLotto638Res', pick: 6, max: 38, special: true, specialMax: 8, name: '威力彩', days: [1, 4] },
  daily539: { api: 'Daily539Result', key: 'daily539Res', pick: 5, max: 39, special: false, name: '今彩539', days: [1, 2, 3, 4, 5, 6] },
};
const BACKFILL = process.argv.includes('--backfill');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function month(g, ym) {
  const u = `${BASE}/${g.api}?period=&month=${ym}&pageNum=1&pageSize=200`;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(u, { headers: { Referer: 'https://www.taiwanlottery.com/', 'User-Agent': 'Mozilla/5.0 rtp96-lotto-fetch' }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json(); if (j.rtCode !== 0) throw new Error('rtCode ' + j.rtCode);
      const list = j.content?.[g.key] || Object.values(j.content || {}).find(Array.isArray) || [];
      return list;
    } catch (e) { if (i === 2) throw e; await sleep(5000 * (i + 1)); }
  }
}
function normalize(g, x) {
  const period = Number(x.period); const drawDate = String(x.lotteryDate || '').slice(0, 10);
  let sorted = (x.drawNumberSize || []).map(Number), appear = (x.drawNumberAppear || []).map(Number);
  let special = null;
  if (g.special) { special = sorted[sorted.length - 1]; sorted = sorted.slice(0, g.pick); appear = appear.slice(0, g.pick); }
  const numbers = [...sorted].sort((a, b) => a - b);
  const prizes = []; for (const k of Object.keys(x)) if (/Assign$/.test(k) && x[k] && typeof x[k] === 'object') prizes.push({ tier: k.replace(/Assign$/, ''), prize: x[k].prize, winners: x[k].winnerCount, perPrize: x[k].perPrize });
  return { period, drawDate, numbers, special, appearOrder: appear, prizes, sales: x.sellAmount ?? null, total: x.totalAmount ?? null, fetchedAt: new Date().toISOString(), source: `${BASE}/${g.api}?period=${period}` };
}
function validate(g, d) {
  const e = [];
  if (!Number.isInteger(d.period) || d.period <= 0) e.push('期號');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.drawDate) || d.drawDate > new Date().toISOString().slice(0, 10)) e.push('開獎日 ' + d.drawDate);
  if (d.numbers.length !== g.pick) e.push(`號碼數 ${d.numbers.length}≠${g.pick}`);
  if (new Set(d.numbers).size !== d.numbers.length) e.push('號碼重複');
  if (d.numbers.some(n => !Number.isInteger(n) || n < 1 || n > g.max)) e.push('號碼範圍');
  if (g.special) { const sm = g.specialMax || g.max; if (!Number.isInteger(d.special) || d.special < 1 || d.special > sm) e.push('特別號範圍'); if (!g.specialMax && d.numbers.includes(d.special)) e.push('特別號重複'); }
  return e;
}
const sig = (d) => JSON.stringify([d.numbers, d.special, d.drawDate, d.prizes.map(p => [p.tier, p.winners, p.perPrize])]);
let exit = 0; const summary = {};
for (const [id, g] of Object.entries(GAMES)) {
  const file = path.join(DIR, id + '.json');
  const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { game: id, name: g.name, draws: [], errors: [] };
  const byP = new Map(db.draws.map(d => [d.period, d]));
  const now = new Date(); const endYm = now.toISOString().slice(0, 7);
  let startYm = '2014-01';
  if (!BACKFILL && db.draws.length) { const last = db.draws[db.draws.length - 1].drawDate; const dt = new Date(last); dt.setDate(1); dt.setMonth(dt.getMonth() - 1); startYm = dt.toISOString().slice(0, 7); }
  const months = []; for (let d = new Date(startYm + '-01T00:00:00Z'); d.toISOString().slice(0, 7) <= endYm; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(d.toISOString().slice(0, 7));
  let added = 0, revised = 0, bad = 0;
  for (const ym of months) {
    let list; try { list = await month(g, ym); } catch (e) { db.errors.push({ at: new Date().toISOString(), month: ym, error: String(e.message) }); bad++; exit = 2; continue; }
    for (const x of list) {
      const d = normalize(g, x); const errs = validate(g, d);
      if (errs.length) { db.errors.push({ at: d.fetchedAt, period: d.period, errors: errs }); bad++; exit = 2; continue; }
      const old = byP.get(d.period);
      if (!old) { byP.set(d.period, d); added++; }
      else if (sig(old) !== sig(d)) { byP.set(d.period, { ...d, revisedAt: d.fetchedAt, previous: { numbers: old.numbers, special: old.special, drawDate: old.drawDate } }); revised++; }
    }
    await sleep(150);
  }
  db.draws = [...byP.values()].sort((a, b) => a.period - b.period);
  // 期號要嚴格遞增、開獎日也要遞增
  for (let i = 1; i < db.draws.length; i++) if (db.draws[i].drawDate < db.draws[i - 1].drawDate) { db.errors.push({ at: new Date().toISOString(), period: db.draws[i].period, errors: ['開獎日倒退'] }); exit = 2; }
  db.errors = db.errors.slice(-200); db.updatedAt = new Date().toISOString(); db.latest = db.draws[db.draws.length - 1]?.period;
  fs.writeFileSync(file, JSON.stringify(db));
  summary[id] = { total: db.draws.length, added, revised, bad, latest: db.draws[db.draws.length - 1]?.drawDate, first: db.draws[0]?.drawDate };
}
console.log(JSON.stringify(summary, null, 1));
process.exit(exit);
