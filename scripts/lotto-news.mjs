// 台彩相關新聞標題（Google News RSS，繁中台灣）→ data/lotto/news.json：給專區與工具頁的「台彩動態」區塊，讓時事關鍵字（加碼、連摃、頭獎幾億）進到頁面
//   node scripts/lotto-news.mjs      只存標題／來源／連結／時間，不抓內文；保留最近 14 天、最多 40 則；同標題去重
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'data/lotto/news.json');
const QUERIES = ['大樂透', '威力彩', '今彩539', '台灣彩券 加碼', '樂透 頭獎'];
const dec = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const items = new Map();
for (const q of QUERIES) {
  const u = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
  let xml = ''; try { xml = await (await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 rtp96-news' }, signal: AbortSignal.timeout(20000) })).text(); } catch (e) { console.error('抓不到', q, e.message); continue; }
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const it = m[1]; const title = dec(/<title>([\s\S]*?)<\/title>/.exec(it)?.[1] || ''); const link = dec(/<link>([\s\S]*?)<\/link>/.exec(it)?.[1] || ''); const date = new Date(/<pubDate>([^<]*)/.exec(it)?.[1] || 0);
    const source = dec(/<source[^>]*>([\s\S]*?)<\/source>/.exec(it)?.[1] || '');
    const t = title.replace(/\s*-\s*[^-]+$/, '').trim();   // Google 會把「 - 媒體名」接在標題後
    if (!t || !link || isNaN(date)) continue; const key = t.replace(/\s+/g, '');
    if (!items.has(key) || items.get(key).date < date.toISOString()) items.set(key, { title: t, link, source, date: date.toISOString(), q });
  }
}
const cutoff = Date.now() - 14 * 864e5;
const list = [...items.values()].filter(x => new Date(x.date).getTime() > cutoff).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { items: [] };
const same = JSON.stringify(prev.items?.map(x => x.title)) === JSON.stringify(list.map(x => x.title));
if (!same || !fs.existsSync(OUT)) fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), items: list }, null, 1));
console.log(`新聞 ${list.length} 則${same ? '（沒變）' : '（已更新）'}；最新：${list[0]?.date?.slice(0, 10)} ${list[0]?.title}`);
