// P1 遷移驗收（docs/ARCHITECTURE.md §4）：對每個舊 URL，比對舊 HTML（repo＝線上）與 dist 新產出
//   文章頁：title、H1、description、canonical、正文純文字（去空白；不含「相關文章」）、表格數、正文內連數、外連數、圖片數 要一致
//   列表頁／首頁／關於：title、H1、description、canonical 一致；列表頁另列出新舊卡片數
//   node scripts/migrate-diff.mjs  → docs/P1-MIGRATE-DIFF.md；有差異 exit 1
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DIST = path.join(ROOT, 'dist');
const inv = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/url-inventory.json'), 'utf8'));
const norm = (s) => String(s || '').replace(/\s+/g, '').replace(/\.html(?=$|[#?])/g, '');
const noExt = (u) => String(u || '').replace(/\/index\.html$/, '/').replace(/\.html(?=$|[#?])/, '');
function facts(html, isArticle, pageDir = '/') {
  const $ = cheerio.load(html);
  const abs = (h) => { if (!h || /^(https?:|#|mailto:)/.test(h)) return h; return noExt(h.startsWith('/') ? h : path.posix.normalize(path.posix.join(pageDir, h))); };
  const f = { title: $('title').text().trim(), h1: $('h1').first().text().trim(), description: $('meta[name="description"]').attr('content') || '', canonical: $('link[rel="canonical"]').attr('href') || '' };
  if (isArticle) {
    const c = $('.article-content').clone(); c.find('.related-posts').remove();
    f.text = norm(c.text()); f.tables = c.find('table').length; f.imgs = c.find('img').length;
    f.inlinks = c.find('a[href]').filter((_, a) => !/^https?:/.test($(a).attr('href'))).map((_, a) => abs($(a).attr('href'))).get().sort();
    f.outlinks = c.find('a[href^="http"]').length;
  } else { f.cards = $('.post-item, .blog-card').length; }
  return f;
}
const rows = []; let bad = 0;
for (const u of inv) {
  const oldF = [path.join(ROOT, u.file), path.join(ROOT, '..', '..', 'rtp96-live-snapshot-20261003', u.file), path.join(ROOT, '..', 'rtp96-live-snapshot-20261003', u.file)].find(f => fs.existsSync(f));   // 舊 HTML 已從 repo 移除（10-04）：改比線上快照；兩邊都沒有就只檢查新站有沒有這頁
  if (!oldF) { const nf = path.join(DIST, u.url.endsWith('/') ? u.url + 'index.html' : u.url + '.html'); if (!fs.existsSync(nf)) { rows.push(`| ${u.url} | ✗ 新站沒有這頁 |`); bad++; } else rows.push(`| ${u.url} | （無舊檔可比）新站有 |`); continue; } const newF = path.join(DIST, u.url.endsWith('/') ? u.url + 'index.html' : u.url + '.html');
  if (!fs.existsSync(newF)) { rows.push(`| ${u.url} | ✗ 新站沒有這頁 |`); bad++; continue; }
  const isArticle = !/\/$/.test(u.url) && u.url !== '/about';
  const dir = path.posix.dirname(u.file);
  const a = facts(fs.readFileSync(oldF, 'utf8'), isArticle, dir), b = facts(fs.readFileSync(newF, 'utf8'), isArticle, dir);
  const d = [];
  if (a.title !== b.title) d.push(`title「${a.title}」→「${b.title}」`);
  if (a.h1 !== b.h1) d.push(`H1「${a.h1}」→「${b.h1}」`);
  if (a.description !== b.description) d.push('description 不同');
  if (noExt(a.canonical) !== b.canonical) d.push(`canonical ${a.canonical} → ${b.canonical}`);
  if (isArticle) {
    if (a.text !== b.text) { let i = 0; while (i < a.text.length && a.text[i] === b.text[i]) i++; d.push(`正文不同（舊 ${a.text.length} 字／新 ${b.text.length} 字，第 ${i} 字起：舊「${a.text.slice(i, i + 30)}」新「${b.text.slice(i, i + 30)}」）`); }
    if (a.tables !== b.tables) d.push(`表格 ${a.tables}→${b.tables}`); if (a.imgs !== b.imgs) d.push(`圖片 ${a.imgs}→${b.imgs}`); if (a.outlinks !== b.outlinks) d.push(`外連 ${a.outlinks}→${b.outlinks}`);
    if (JSON.stringify(a.inlinks) !== JSON.stringify(b.inlinks)) d.push(`內連 ${a.inlinks.length}→${b.inlinks.length}：少了 ${JSON.stringify(a.inlinks.filter(x => !b.inlinks.includes(x)))} 多了 ${JSON.stringify(b.inlinks.filter(x => !a.inlinks.includes(x)))}`);
  } else if (a.cards !== b.cards) d.push(`（資訊）卡片數 ${a.cards}→${b.cards}`);
  const hard = d.filter(x => !x.startsWith('（資訊）')); if (hard.length) bad++;
  rows.push(`| ${u.url} | ${d.length ? d.join('；') : '✓'} |`);
}
const md = `# P1 遷移比對（${new Date().toISOString().slice(0, 16)}）\n\n舊＝repo HTML（＝線上），新＝dist。${inv.length} 個網址，${bad} 個有差異。\n\n| 網址 | 結果 |\n|---|---|\n${rows.join('\n')}\n`;
fs.writeFileSync(path.join(ROOT, 'docs/P1-MIGRATE-DIFF.md'), md);
console.log(`${inv.length} 個網址，${bad} 個有差異 → docs/P1-MIGRATE-DIFF.md`); if (bad) console.log(rows.filter(r => !r.endsWith('| ✓ |')).slice(0, 15).join('\n'));
process.exit(bad ? 1 : 0);
