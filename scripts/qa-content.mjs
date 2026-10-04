// 稿件驗收（docs/WRITING-SPEC.md §9 的機器版）：對「非 legacy」文章檢查字數、:::david 數、FAQ、sources 可開、免責、禁用句、front-matter、內連目標存在
//   node scripts/qa-content.mjs [id ...]      不給 id 就檢查所有非 legacy 的文章；有錯 exit 1，報告寫 docs/CONTENT-QA.md
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const ids = process.argv.slice(2);
const files = fs.readdirSync(path.join(ROOT, 'content/posts')).filter(f => f.endsWith('.md'));
const all = files.map(f => ({ f, ...matter(fs.readFileSync(path.join(ROOT, 'content/posts', f), 'utf8')) }));
const links = new Set(['/', '/blog/', '/lotto/', '/about', '/lotto/lotto649-results', '/lotto/superlotto638-results', '/lotto/daily539-results', '/lotto/lotto-wheel-calculator', ...all.map(p => p.data.permalink)]);
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8')); for (const k of Object.keys(site.categories)) links.add(`/${k}/`);
const BAN = ['在這篇文章中，我們將', '作為一名長期研究', '必中', '明牌', '報牌', '穩賺', '保證獲利', '包中', '我們將從數據分析的角度'];
const targets = all.filter(p => !p.data.legacy && (!ids.length || ids.includes(p.data.id)));
const rows = []; let bad = 0;
const head = async (u) => { try { const r = await fetch(u, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 rtp96-qa' } }); return r.status; } catch (e) { return 'ERR'; } };
for (const p of targets) {
  const d = p.data, body = p.content; const e = [], w = [];
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/[#>*|`\-\[\]()]/g, '').replace(/\s+/g, '');
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  for (const k of ['id', 'permalink', 'title', 'category', 'date', 'description', 'excerpt', 'readTime', 'image', 'keywords', 'sources', 'related', 'faq']) if (d[k] == null || (Array.isArray(d[k]) && !d[k].length)) e.push(`缺 ${k}`);
  if (d.id && p.f !== d.id + '.md') e.push(`id 與檔名不符`);
  if (d.title && d.title.length > 60) e.push(`title ${d.title.length} 字`);
  if (d.description && (d.description.length < 40 || d.description.length > 160)) e.push(`description ${d.description.length} 字`);
  if (cjk < 1500) e.push(`中文 ${cjk} 字 < 1500`); else if (cjk < 1800 || cjk > 3000) w.push(`中文 ${cjk} 字（建議 1800～2800）`);
  const david = (body.match(/^:::david\s*$/gm) || []).length; if (david < 2) e.push(`:::david 只有 ${david}`);
  const h2 = (body.match(/^## /gm) || []).length; if (h2 < 4) e.push(`H2 只有 ${h2}`);
  if (!/^## .*常見問題/m.test(body)) e.push('沒有「常見問題」H2');
  if (!/^## .*延伸閱讀/m.test(body)) w.push('沒有「延伸閱讀」H2');
  if (!Array.isArray(d.faq) || d.faq.length < 3) e.push('faq < 3');
  if ((d.tags || []).includes('underground') && !/^:::disclaimer\s*$/m.test(body)) e.push('地下類沒有 :::disclaimer');
  for (const b of BAN) { const re = new RegExp(`(.{0,4})${b}`, 'g'); for (const m of (body + '\n' + (d.title || '')).matchAll(re)) if (!/[不沒非無全]|保證|所謂|「$/.test(m[1])) e.push(`禁用句「${b}」（${m[1]}${b}）`); }   // 否定句（不是必中、沒有包中）放行
  if (/<[a-z][^>]*>/i.test(body.replace(/```[\s\S]*?```/g, ''))) w.push('正文有 HTML 標籤');
  const internal = [...body.matchAll(/\]\((\/[^)\s#]*)/g)].map(m => m[1]); if (internal.length < 3) e.push(`內連 ${internal.length} < 3`);
  for (const l of new Set(internal)) if (!links.has(l) && !l.startsWith('/images/') && !l.startsWith('/data/')) e.push(`內連不存在 ${l}`);
  for (const r of d.related || []) if (!links.has(r)) e.push(`related 不存在 ${r}`);
  if (d.image && !fs.existsSync(path.join(ROOT, d.image.slice(1)))) w.push(`image 還沒產（跑 og-post）`);
  const srcs = Array.isArray(d.sources) ? d.sources : []; if (srcs.length < 2) e.push(`sources ${srcs.length} < 2`);
  for (const s of srcs) { const st = await head(s); if (st === 'ERR' || st >= 400) e.push(`source 打不開（${st}）${s}`); }
  if (e.length) bad++;
  rows.push(`| ${d.permalink || p.f} | ${cjk} | ${david} | ${srcs.length} | ${e.length ? '✗ ' + e.join('；') : '✓'} ${w.length ? '⚠ ' + w.join('；') : ''} |`);
  console.log(e.length ? '  ✗' : '  ✓', d.permalink || p.f, e.join('；'), w.length ? '｜⚠ ' + w.join('；') : '');
}
const md = `# 稿件驗收（${new Date().toISOString().slice(0, 16)}）\n\n${targets.length} 篇，${bad} 篇有錯。\n\n| 文章 | 中文字 | david | sources | 結果 |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
fs.writeFileSync(path.join(ROOT, 'docs/CONTENT-QA.md'), md);
console.log(`\n${targets.length} 篇，${bad} 篇有錯 → docs/CONTENT-QA.md`); process.exit(bad ? 1 : 0);
