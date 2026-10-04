// 靜態產生器（docs/ARCHITECTURE.md §2）：content/ ＋ assets/ ＋ images/ → dist/
//   node build.mjs            產出 dist/（含 sitemap.xml、blog/rss.xml、robots.txt、functions/）
//   品質閘門（§2.4）：legacy 舊文只做硬檢查（permalink 唯一、canonical＝permalink、title/description 有、舊 URL 全有去向）；新文（legacy 不為 true）全套嚴格
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import * as T from './templates/index.mjs';
import * as L from './templates/lotto.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const DIST = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const BUILD = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const md = new MarkdownIt({ html: true, linkify: false, typographer: false });
const games = Object.keys(L.GAMES).map(id => L.loadGame(ROOT, id)).filter(g => g && g.draws.length);   // data/lotto 沒資料就不產工具頁
const LOTTO_JS = `<script src="/js/lotto.js?v=__BUILD__" defer></script>`;
const esc = T.esc;
const FILLER = ['在這篇文章中，我們將從數據分析的角度', '作為一名長期研究電子遊戲數學模型的軟體工程師'];
const errors = [], warns = [];
const fail = (m) => errors.push(m), warn = (m) => warns.push(m);

// ---------- 讀內容 ----------
const readMd = (f) => { const { data, content } = matter(fs.readFileSync(f, 'utf8')); return { ...data, body: content }; };
const posts = fs.readdirSync(path.join(ROOT, 'content/posts')).filter(f => f.endsWith('.md')).map(f => readMd(path.join(ROOT, 'content/posts', f)))
  .filter(p => p.status !== 'draft').sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title));
const pages = fs.existsSync(path.join(ROOT, 'content/pages')) ? fs.readdirSync(path.join(ROOT, 'content/pages')).filter(f => f.endsWith('.md')).map(f => readMd(path.join(ROOT, 'content/pages', f))) : [];
const byLink = new Map(); for (const p of posts) { if (byLink.has(p.permalink)) fail(`permalink 重複 ${p.permalink}`); byLink.set(p.permalink, p); }
const counts = posts.reduce((a, p) => (a[p.category] = (a[p.category] || 0) + 1, a), {});
const url = (perma) => site.url + perma;
const render = (p) => /<(p|h2|div|ul|table)[\s>]/.test(p.body.trim().slice(0, 200)) ? p.body : md.render(p.body);   // 舊文是 HTML 原樣；新文是 Markdown

// ---------- 正文處理：h2 補 id → 目錄；相關文章 ----------
function prepBody(p) {
  let html = render(p); const toc = []; const seen = new Set();
  html = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (m, attrs, inner) => {
    let id = /id="([^"]+)"/.exec(attrs)?.[1]; const text = inner.replace(/<[^>]+>/g, '').trim();
    if (!id) { id = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'h2'; let k = id, c = 2; while (seen.has(k)) k = `${id}-${c++}`; id = k; attrs += ` id="${id}"`; }
    seen.add(id); toc.push({ id, text }); return `<h2${attrs}>${inner}</h2>`;
  });
  // :::david / :::tip / :::info / :::disclaimer（新文 Markdown 用）
  html = html.replace(/<p>:::(david|tip|info|disclaimer)<\/p>([\s\S]*?)<p>:::<\/p>/g, (m, k, inner) => `<div class="${k === 'david' ? 'david-note' : k === 'disclaimer' ? 'disclaimer-box' : 'info-box'}">${inner}</div>`);
  return { html, toc };
}
function relatedOf(p) {
  const picked = (p.related || []).map(r => byLink.get(typeof r === 'string' && r.startsWith('/') ? r : posts.find(x => x.id === r)?.permalink)).filter(Boolean);
  const auto = posts.filter(x => x !== p && x.category === p.category && !picked.includes(x)).slice(0, Math.max(0, 2 - picked.length));
  return [...picked, ...auto].slice(0, 3);
}
const postCard = (p) => `<a href="${p.permalink}" class="post-item"><div class="post-accent post-accent-${site.accent[p.category] || 'green'}"></div><div class="post-body"><div class="post-title">${esc(p.title)}</div><div class="post-meta"><span class="cat-pill cat-${p.category}">${esc(site.categories[p.category]?.label || p.category)}</span><span>${p.readTime} min read</span></div></div></a>`;

// ---------- 閘門 ----------
function gate(p) {
  const where = p.permalink;
  if (!p.title) fail(`${where} 沒 title`); if (!p.description) fail(`${where} 沒 description`);
  if (!/^\//.test(p.permalink)) fail(`${where} permalink 要以 / 開頭`);
  const text = render(p).replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  const strict = !p.legacy;
  const chk = (ok, m) => ok || (strict ? fail(m) : warn(m));
  chk(p.title.length <= 60, `${where} title ${p.title.length} 字 > 60`);
  chk(p.description.length >= 40 && p.description.length <= 160, `${where} description ${p.description.length} 字（要 40～160）`);
  chk((render(p).match(/<h2[\s>]/g) || []).length >= 3, `${where} H2 少於 3`);
  chk(text.length >= 1500, `${where} 內文 ${text.length} 字 < 1500`);
  chk((render(p).match(/href="\/(?!images)/g) || []).length >= 3, `${where} 內連少於 3`);
  if (p.image && p.image.startsWith('/images/') && !fs.existsSync(path.join(ROOT, p.image.slice(1)))) fail(`${where} image 檔不存在 ${p.image}（先跑 node scripts/og-post.mjs）`);
  if (strict) { if (!(p.sources || []).length) fail(`${where} 沒 sources`); if (!p.image) fail(`${where} 沒 image`); for (const f of FILLER) if (text.includes(f.replace(/\s/g, ''))) fail(`${where} 命中填充句「${f}」`); }
  else for (const f of FILLER) if (text.includes(f.replace(/\s/g, ''))) warn(`${where} 填充句（舊文，P3 重寫）`);
}

// ---------- 輸出 ----------
fs.rmSync(DIST, { recursive: true, force: true }); fs.mkdirSync(DIST, { recursive: true });
const out = (perma, html) => { const f = path.join(DIST, perma.endsWith('/') ? perma + 'index.html' : perma + '.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const shell = (perma, active, inner, opts) => T.layout(site, opts, `${T.header(site, active)}\n${inner}\n${T.footer(site, T.pageCode(perma))}`, BUILD).replace('<html lang="zh-TW">', `<html lang="zh-TW" data-ga="${site.ga}">`);

// 文章
for (const p of posts) {
  gate(p);
  const { html, toc } = prepBody(p); const code = T.pageCode(p.permalink); const cat = site.categories[p.category];
  const crumbs = p.crumb === 'blog' ? [{ href: '/', label: '~' }, { href: '/blog/', label: '部落格' }, { label: p.title }] : [{ href: '/', label: '~' }, { href: `/${p.category}/`, label: cat?.label || p.category }, { label: p.title }];
  const rel = relatedOf(p);
  const inner = `${T.breadcrumb(crumbs)}
<div class="ad-header">${T.adSlot('A', 'banner', code)}</div>
<div class="article-layout">
  <article class="article-main">
    <header class="article-header"><div style="margin-bottom:10px;"><span class="cat-pill cat-${p.category}">${esc(cat?.label || p.category)}</span></div><h1>${esc(p.h1 || p.title)}</h1></header>
    ${T.author(site, p.date, p.readTime)}
    <div class="article-content">
${html}
      ${rel.length ? `<div class="related-posts"><h3>相關文章</h3><div class="post-list">${rel.map(postCard).join('')}</div></div>` : ''}
    </div>
  </article>
  <aside class="toc-sidebar">
    ${toc.length ? `<div class="toc"><div class="toc-title">目錄</div><ul class="toc-list">${toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></div>` : ''}
    <div class="ad-article-sidebar">${T.adSlot('E', 'sidebar', code)}</div>
  </aside>
</div>`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: p.date, dateModified: p.updated || p.date, author: { '@type': 'Person', name: site.author }, publisher: { '@type': 'Person', name: site.author }, description: p.ldDescription || p.description, mainEntityOfPage: url(p.permalink), image: p.image ? url(p.image) : `${site.url}/images/og-default.png` },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label === '~' ? '首頁' : c.label, ...(c.href ? { item: url(c.href) } : {}) })) },
    ...(Array.isArray(p.faq) && p.faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(q => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })) }] : []),
  ];
  out(p.permalink, shell(p.permalink, p.crumb === 'blog' ? 'blog' : p.category, inner, { title: `${p.title} | ${site.name}`, description: p.description, ogDescription: p.ogDescription, canonical: url(p.permalink), ogType: 'article', image: p.image ? url(p.image) : '', jsonld, extraHead: `<meta property="article:published_time" content="${esc(p.date)}">\n  <meta property="article:modified_time" content="${esc(p.updated || p.date)}">\n  <meta property="article:section" content="${esc(cat?.label || p.category)}">` }));
}
// 首頁
{
  const code = 'HOME'; const latest = posts.slice(0, 20); const featured = (site.featured || []).map(f => byLink.get(f)).filter(Boolean);
  const inner = `<div class="ad-header">${T.adSlot('A', 'banner', code)}</div>
<div class="blog-intro"><div class="intro-greeting"><img class="intro-avatar" src="/images/david-avatar.png" alt="大衛" width="96" height="96"><div class="intro-text"><h1>${esc(site.home.h1)}</h1><p>${esc(site.home.intro)}<span class="typing-cursor"></span></p></div></div></div>
<div class="content-grid"><main class="main-content">
  <section class="section"><div class="section-header"><h2 class="section-title">最新文章</h2><a href="/blog/" class="section-link">all posts →</a></div><div class="post-list" data-page-size="5">${latest.map(p => T.postItem(site, p)).join('')}</div></section>
  <div class="ad-inline">${T.adSlot('C1', 'banner', code)}</div>
  ${featured.length ? `<section class="section"><div class="section-header"><h2 class="section-title">熱門研究</h2></div><div class="post-list">${featured.map(p => T.postItem(site, p)).join('')}</div></section>` : ''}
</main>${T.sidebar(site, counts, code)}</div>`;
  out('/', shell('/', 'home', inner, { title: site.home.title, description: site.home.description, canonical: url('/'), jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url, description: site.home.description }] }));
}
// 分類頁
for (const [k, c] of Object.entries(site.categories)) {
  const code = T.pageCode(`/${k}/`); const list = posts.filter(p => p.category === k);
  const hub = k === 'lotto' && games.length ? L.hubCards(games) : '';
  const inner = `<div class="category-hero"><h1>${esc(c.title)}</h1><p>${esc(c.intro)}</p></div>
${T.breadcrumb([{ href: '/', label: '~' }, { label: c.label }])}
<div class="ad-header">${T.adSlot('A', 'banner', code)}</div>
<div class="content-grid"><main class="main-content">${hub}<div class="post-list" data-page-size="10">${list.map(p => T.postItem(site, p)).join('')}</div></main>${T.sidebar(site, counts, code)}</div>`;
  out(`/${k}/`, shell(`/${k}/`, k, inner, { title: `${c.pageTitle || c.title} | ${site.name}`, description: c.description, canonical: url(`/${k}/`), jsonld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.title, url: url(`/${k}/`), description: c.description }] }));
}
// 樂透工具頁（P2）：三彩種開獎／冷熱號／遺漏／對獎器 ＋ 計算機
const toolPages = [];
function toolShell(perma, h1, kicker, bodyHtml, meta) {
  const code = T.pageCode(perma); const toc = [...bodyHtml.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)].map(m => ({ id: m[1], text: m[2] }));
  const crumbs = [{ href: '/', label: '~' }, { href: '/lotto/', label: '樂透' }, { label: h1 }];
  const inner = `${T.breadcrumb(crumbs)}
<div class="ad-header">${T.adSlot('A', 'banner', code)}</div>
<div class="article-layout">
  <article class="article-main">
    <header class="article-header"><div style="margin-bottom:10px;"><span class="cat-pill cat-lotto">樂透</span> <span class="muted">${esc(kicker)}</span></div><h1>${esc(h1)}</h1></header>
    ${T.author(site, meta.date, meta.readTime)}
    <div class="article-content">
${bodyHtml}
    </div>
  </article>
  <aside class="toc-sidebar">
    ${toc.length ? `<div class="toc"><div class="toc-title">目錄</div><ul class="toc-list">${toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul></div>` : ''}
    <div class="ad-article-sidebar">${T.adSlot('E', 'sidebar', code)}</div>
  </aside>
</div>`;
  out(perma, shell(perma, 'lotto', inner, { ...meta.head, canonical: url(perma), extraScripts: LOTTO_JS, jsonld: [...(meta.jsonld || []), { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label === '~' ? '首頁' : c.label, ...(c.href ? { item: url(c.href) } : {}) })) }] }));
  toolPages.push({ loc: perma, mod: meta.date, pri: '0.9' });
}
for (const g of games) {
  const st = L.stats(g); const latest = g.draws[g.draws.length - 1]; const nums = latest.numbers.map(n => String(n).padStart(2, '0')).join('、');
  toolShell(`/lotto/${g.slug}`, `${g.name}開獎號碼、冷熱號與遺漏值（${latest.drawDate} 第 ${latest.period} 期）`, `${g.dayText} · 資料 ${st.first} 起 ${st.n} 期`, L.toolPage(g, site, T.pageCode(`/lotto/${g.slug}`)),
    { date: latest.drawDate, readTime: 6, jsonld: L.toolJsonLd(g, site), head: { title: `${g.name}開獎號碼｜冷熱號、遺漏值、對獎器（${latest.drawDate} 最新） | ${site.name}`, description: `${g.name}第 ${latest.period} 期（${latest.drawDate}）開獎號碼 ${nums}${latest.special != null ? `，${g.special} ${String(latest.special).padStart(2, '0')}` : ''}。近 30／50／100 期冷熱號、每個號碼的遺漏值與連莊、最近 30 期紀錄與對獎器，資料來自台彩官方。`, ogType: 'article' } });
  fs.mkdirSync(path.join(DIST, 'data/lotto'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'data/lotto', g.id + '.min.json'), JSON.stringify({ game: g.id, name: g.name, updatedAt: g.updatedAt, source: 'https://www.taiwanlottery.com/', draws: g.draws.map(x => [x.period, x.drawDate, x.numbers, x.special]) }));
}
if (games.length) toolShell('/lotto/lotto-wheel-calculator', '包牌／連碰計算機：大樂透、威力彩、539 注數與金額', '純前端計算，不會上傳任何資料', L.calculatorPage(),
  { date: BUILD.slice(0, 4) + '-' + BUILD.slice(4, 6) + '-' + BUILD.slice(6, 8), readTime: 4, head: { title: '樂透包牌／連碰計算機：注數、金額、碰數一次算（大樂透、威力彩、539） | ' + site.name, description: '大樂透、威力彩、今彩539 包牌要幾注、多少錢；地下 539／六合術語的二三四星連碰碰數、全車、立柱怎麼算。只算數學，不提供任何投注管道。', ogType: 'article' } });
// 部落格總表
{
  const code = 'BLOG';
  const inner = `<div class="ad-header">${T.adSlot('A', 'banner', code)}</div>
<div class="blog-intro" style="padding:32px 20px 16px;max-width:800px;margin:0 auto"><h1 style="font-size:24px;margin-bottom:8px">${esc(site.blog.h1)}</h1><p style="color:var(--text-secondary);font-size:14px">${esc(site.blog.intro)} · 共 ${posts.length} 篇文章</p>
  <div class="blog-filters" data-filters="#blog-post-list"><button type="button" class="filter-btn active" data-filter="">全部</button>${Object.entries(site.categories).map(([k, c]) => `<button type="button" class="filter-btn" data-filter="${k}">${esc(c.label)}</button>`).join('')}</div></div>
<div class="content-grid"><main class="main-content"><section class="section"><div class="post-list" id="blog-post-list" data-page-size="10">${posts.map(p => T.postItem(site, p).replace('class="post-item"', `class="post-item" data-cat="${p.category}"`)).join('')}</div></section></main>${T.sidebar(site, counts, code)}</div>`;
  out('/blog/', shell('/blog/', 'blog', inner, { title: site.blog.title, description: site.blog.description, canonical: url('/blog/') }));
}
// 靜態頁（關於）
for (const pg of pages) {
  const inner = `${T.breadcrumb([{ href: '/', label: '~' }, { label: pg.title.replace(/\s*\|.*$/, '') }])}\n<div class="about-page">${render(pg)}</div>`;
  out(pg.permalink, shell(pg.permalink, pg.id, inner, { title: `${pg.title} | ${site.name}`, description: pg.description, canonical: url(pg.permalink) }));
}
// ---------- 靜態檔 ----------
const cp = (from, to) => { const s = path.join(ROOT, from), d = path.join(DIST, to); if (!fs.existsSync(s)) return; if (fs.statSync(s).isDirectory()) { fs.mkdirSync(d, { recursive: true }); for (const e of fs.readdirSync(s)) cp(path.posix.join(from, e), path.posix.join(to, e)); } else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); } };
const skipImg = /^(logo_combo_\d|logo_final_\d|logo_g\d|logo_gemini|logo_option_\d|logo_rtp_\d|logo_rtp96_p\d|new-template|old-template|qa_).*\.png$/;
fs.mkdirSync(path.join(DIST, 'images'), { recursive: true });
for (const e of fs.readdirSync(path.join(ROOT, 'images'))) { if (skipImg.test(e)) continue; cp('images/' + e, 'images/' + e); }
fs.writeFileSync(path.join(DIST, '_redirects'), (site.redirects || []).map(([f, t]) => f + ' ' + t + ' 301').join(String.fromCharCode(10)) + String.fromCharCode(10));   // 舊站本來就壞的內連、改名的頁：舊網址 301 到新頁（Pages _redirects；主機名層級轉址在 functions/_middleware.js）
cp('assets/style.css', 'style.css'); cp('assets/js/site.js', 'js/site.js'); cp('assets/js/lotto.js', 'js/lotto.js'); cp('functions', 'functions'); cp('robots.txt', 'robots.txt');
// sitemap
const all = [{ loc: '/', mod: posts[0]?.updated || posts[0]?.date, pri: '1.0' }, { loc: '/blog/', mod: posts[0]?.date, pri: '0.8' }, ...toolPages, ...Object.keys(site.categories).map(k => ({ loc: `/${k}/`, mod: posts.find(p => p.category === k)?.date, pri: '0.8' })), ...pages.map(p => ({ loc: p.permalink, mod: BUILD.slice(0, 4) + '-' + BUILD.slice(4, 6) + '-' + BUILD.slice(6, 8), pri: '0.5' })), ...posts.map(p => ({ loc: p.permalink, mod: p.updated || p.date, pri: p.permalink.split('/').filter(Boolean).length === 2 ? '0.7' : '0.6' }))];
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map(u => `  <url>\n    <loc>${url(u.loc)}</loc>\n    <lastmod>${u.mod || BUILD.slice(0, 4) + '-' + BUILD.slice(4, 6) + '-' + BUILD.slice(6, 8)}</lastmod>\n    <priority>${u.pri}</priority>\n  </url>`).join('\n')}\n</urlset>\n`);
// rss（最新 30 篇）
const rss = posts.slice(0, 30).map(p => `    <item><title>${esc(p.title)}</title><link>${url(p.permalink)}</link><guid>${url(p.permalink)}</guid><pubDate>${new Date(p.date || Date.now()).toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join('\n');
fs.mkdirSync(path.join(DIST, 'blog'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'blog/rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(site.name)}</title><link>${site.url}/</link><description>${esc(site.home.description)}</description><language>zh-TW</language>\n${rss}\n</channel></rss>\n`);
// 舊 URL 全有去向（docs/url-inventory.json）
const inv = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/url-inventory.json'), 'utf8'));
for (const u of inv) { if (/^\/blog\/drafts\//.test(u.url)) continue;   /* 草稿路徑從來不是公開網址（07-17 已以 /blog/posts/ 發布） */ const f = path.join(DIST, u.url.endsWith('/') ? u.url + 'index.html' : u.url + '.html'); if (!fs.existsSync(f)) fail(`舊 URL 沒有去向 ${u.url}`); }
// 內連目標存在
const exists = (p) => fs.existsSync(path.join(DIST, p.endsWith('/') ? p + 'index.html' : p + '.html')) || fs.existsSync(path.join(DIST, p));
let broken = 0; for (const p of posts) for (const m of render(p).matchAll(/href="(\/[^"#?]*)/g)) if (!exists(m[1])) { broken++; warn(`${p.permalink} 內連找不到 ${m[1]}`); }

const n = all.length;
fs.writeFileSync(path.join(DIST, 'build.json'), JSON.stringify({ build: BUILD, pages: n, posts: posts.length }));
console.log(`build ${BUILD}：${posts.length} 篇、${n} 個網址、分類 ${JSON.stringify(counts)}；警告 ${warns.length}（內連失效 ${broken}）、錯誤 ${errors.length}`);
if (warns.length) fs.writeFileSync(path.join(ROOT, 'docs/BUILD-WARNINGS.md'), `# build 警告（${BUILD}）\n\n${warns.map(w => '- ' + w).join('\n')}\n`);
if (errors.length) { console.error(errors.map(e => '  ✗ ' + e).join('\n')); process.exit(1); }
