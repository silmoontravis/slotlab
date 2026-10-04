// P0.5 速修（docs/ARCHITECTURE.md §3）：canonical／og:url／mainEntityOfPage 改無副檔名、og:image 換 1200×630、重產 sitemap.xml（所有公開頁）
//   node scripts/p05-fix.mjs            改檔＋產 sitemap
//   node scripts/p05-fix.mjs --check    只檢查不改
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SITE = 'https://www.rtp96.com';
const CHECK = process.argv.includes('--check');
const OG = `${SITE}/images/og-default.png`;
const skipDir = new Set(['.git', 'docs', 'scripts', 'dist', 'node_modules', '.wrangler', '.github', 'functions']);

function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.isDirectory()) { if (!skipDir.has(e.name)) walk(path.join(d, e.name), out); } else if (e.name.endsWith('.html')) out.push(path.join(d, e.name)); } return out; }
const noExt = (u) => u.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
const rel = (f) => '/' + path.relative(ROOT, f).split(path.sep).join('/');
const gitDate = (f) => { try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { cwd: ROOT }).toString().trim(); } catch { return ''; } };

const urls = []; let changed = 0, warn = 0;
for (const f of walk(ROOT)) {
  const r = rel(f); let s = fs.readFileSync(f, 'utf8'); const orig = s;
  const url = SITE + noExt(r);
  // canonical：一定要有，而且是無副檔名
  if (/<link rel="canonical"/.test(s)) s = s.replace(/<link rel="canonical" href="([^"]+)">/, (m, h) => `<link rel="canonical" href="${noExt(h)}">`);
  else { s = s.replace(/<\/head>/, `  <link rel="canonical" href="${url}">\n</head>`); console.log('  補 canonical', r); }
  const canon = /<link rel="canonical" href="([^"]+)">/.exec(s)?.[1];
  if (canon !== url) { console.log('  ⚠ canonical 跟路徑不一致', r, canon); warn++; }
  s = s.replace(/(<meta property="og:url" content=")([^"]+)(")/, (m, a, h, b) => a + noExt(h) + b);
  s = s.replace(/("mainEntityOfPage":\s*")([^"]+)(")/, (m, a, h, b) => a + noExt(h) + b);
  // og:image：舊的是 32px favicon；沒有的補上（放在 og:title 後面，沒有 og:title 就放 </head> 前）
  if (/<meta property="og:image"/.test(s)) s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${OG}">`);
  else if (/<meta property="og:title"[^>]*>/.test(s)) s = s.replace(/(<meta property="og:title"[^>]*>)/, `$1\n  <meta property="og:image" content="${OG}">`);
  else s = s.replace(/<\/head>/, `  <meta property="og:image" content="${OG}">\n</head>`);
  if (!/og:image:width/.test(s)) s = s.replace(/(<meta property="og:image" content="[^"]*">)/, `$1\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">`);
  if (!/twitter:card/.test(s)) s = s.replace(/(<meta property="og:image:height" content="630">)/, `$1\n  <meta name="twitter:card" content="summary_large_image">`);
  if (s !== orig) { changed++; if (!CHECK) fs.writeFileSync(f, s); }
  // sitemap：lastmod 用 JSON-LD 的 dateModified，沒有就 published_time，再沒有就 git 最後改動日
  const mod = /"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/.exec(s)?.[1] || /article:published_time" content="(\d{4}-\d{2}-\d{2})/.exec(s)?.[1] || gitDate(f) || new Date().toISOString().slice(0, 10);
  const depth = noExt(r).split('/').filter(Boolean).length;
  const pri = r === '/index.html' ? '1.0' : /\/index\.html$/.test(r) ? '0.8' : depth === 1 ? '0.7' : '0.6';
  urls.push({ url, mod, pri });
}
urls.sort((a, b) => a.url.localeCompare(b.url));
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + urls.map(u => `  <url>\n    <loc>${u.url}</loc>\n    <lastmod>${u.mod}</lastmod>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n') + '\n</urlset>\n';
if (!CHECK) fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`${CHECK ? '檢查' : '完成'}：${walk(ROOT).length} 頁、改了 ${changed} 檔、sitemap ${urls.length} 筆、警告 ${warn}`);
