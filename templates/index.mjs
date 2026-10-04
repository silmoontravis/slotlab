// 模板（docs/ARCHITECTURE.md §2.2）：全部伺服端產出，瀏覽器只跑 assets/js/site.js（輪播、分頁、篩選、GA）
//   標記沿用舊站的 class（post-item／article-layout／toc-sidebar…），style.css 不用重寫
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ADS = [
  { key: 'ceo', name: 'CEO 傳真系統', href: 'https://cs.wii789.com/ask/ceo', cap: 'LINE BOT 整合 · 傳單直接進掃描列印', alt: 'CEO 傳真系統：LINE BOT 整合，LINE 傳單直接進掃描列印與收發流程', title: '詢問 CEO 傳真系統（LINE BOT 整合、訊息管理、掃描列印）' },
  { key: '123win', name: '123Win 2.0 樂透記帳', href: 'https://cs.wii789.com/ask/123win', cap: 'KEY 單 · 會員群組 · 日月年報表', alt: '123Win 2.0 樂透記帳 KEY 單系統：會員、群組、個人帳單與日月年報表', title: '詢問 123Win 2.0 樂透記帳 KEY 單系統' },
];
export function adSlot(position, size, pageCode) {
  const id = `${position}-${pageCode}-001`; const [w, h] = size === 'sidebar' ? [300, 250] : [728, 90]; const f = `${w}x${h}`, eager = position === 'A';
  const items = ADS.map((a, i) => `<a class="ad-item${i === 0 ? ' on' : ''}" href="${a.href}" title="${esc(a.title)}" data-ad="${a.key}" data-slot="${id}"><picture><source type="image/webp" srcset="/images/ads/${a.key}-${f}.webp 1x, /images/ads/${a.key}-${f}@2x.webp 2x"><img src="/images/ads/${a.key}-${f}.png" alt="${esc(a.alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>${size === 'sidebar' ? `<span class="ad-cap"><b>${a.name}</b>${a.cap}</span>` : ''}</a>`).join('');
  return `<div class="ad-rotator ad-size-${size}" data-ad-id="${id}" style="--ad-w:${w};--ad-h:${h}">${items}</div>`;
}
export const pageCode = (permalink) => permalink === '/' ? 'HOME' : /^\/blog\//.test(permalink) ? 'BLOG' : /^\/slots\//.test(permalink) ? 'SLOT' : /^\/casinos\//.test(permalink) ? 'CSNO' : /^\/guides\//.test(permalink) ? 'GUID' : /^\/rtp\//.test(permalink) ? 'RTPX' : 'PAGE';

export function header(site, active) {
  return `<header class="site-header"><div class="header-inner">
    <a href="/" class="site-logo"><img src="/images/logo.png" alt="RTP96" height="80" width="80"><span class="logo-text"><span class="logo-main">${esc(site.name)}</span><span class="logo-sub">// rtp96.com</span></span></a>
    <nav><ul class="nav-menu" id="navMenu">${site.nav.map(n => `<li><a href="${n.href}" class="${active === n.id ? 'active' : ''}">${esc(n.label)}</a></li>`).join('')}</ul></nav>
    <button class="mobile-toggle" onclick="document.getElementById('navMenu').classList.toggle('active')" aria-label="選單">☰</button>
  </div></header>`;
}
export function breadcrumb(items) {
  return `<div class="breadcrumb">${items.map((it, i) => i === items.length - 1 ? `<span style="color:var(--text-primary)">${esc(it.label)}</span>` : `<a href="${it.href}">${esc(it.label)}</a><span class="sep">/</span>`).join('')}</div>`;
}
export function author(site, date, readTime) {
  return `<div class="article-author"><img src="/images/david-avatar.png" alt="大衛" width="44" height="44"><div class="author-info"><div class="author-name">${esc(site.author)}</div><div class="author-date">${esc(date)} &middot; ${readTime} min read</div></div></div>`;
}
export function postItem(site, p) {
  return `<a href="${p.permalink}" class="post-item"><div class="post-accent post-accent-${site.accent[p.category] || 'green'}"></div><div class="post-body">
    <div class="post-title">${esc(p.title)}</div>${p.excerpt ? `<div class="post-excerpt">${esc(p.excerpt)}</div>` : ''}
    <div class="post-meta"><span class="cat-pill cat-${p.category}">${esc(site.categories[p.category]?.label || p.category)}</span><span>${esc(p.date)}</span><span>${p.readTime} min read</span></div></div></a>`;
}
export function sidebar(site, counts, code) {
  return `<aside class="sidebar">
    <div class="widget widget-about"><img class="widget-avatar" src="/images/david-avatar.png" alt="大衛" width="72" height="72"><div class="widget-name">${esc(site.author)}</div><div class="widget-bio">軟體工程師 / 業餘老虎機研究者<br>用 code 拆解遊戲機率</div></div>
    <div class="widget"><h3 class="widget-title">分類</h3><ul class="widget-list">${Object.entries(site.categories).map(([k, c]) => `<li><a href="/${k}/"><span class="cat-pill cat-${k}">${esc(c.label)}</span> ${esc(c.title.replace(c.label, '').trim() || c.title)} <span class="cat-count">${counts[k] || 0}</span></a></li>`).join('')}</ul></div>
    <div class="ad-sidebar">${adSlot('B', 'sidebar', code)}</div>
    <div class="widget"><h3 class="widget-title">熱門文章</h3><ul class="widget-list">${site.sidebarPicks.map(p => `<li><a href="${p.href}">${esc(p.label)}</a></li>`).join('')}</ul></div>
    <div class="ad-sidebar">${adSlot('B2', 'sidebar', code)}</div>
  </aside>`;
}
export function footer(site, code) {
  return `<div class="ad-footer" style="max-width:1100px;margin:0 auto 24px;padding:0 20px;">${adSlot('D', 'banner', code)}</div>
  <footer class="site-footer"><div class="footer-inner">
    <div class="footer-brand"><div class="footer-logo"><img src="/images/favicon-32.png" alt="" width="24" height="24">${esc(site.name)}</div><p>${esc(site.footer.blurb)}</p></div>
    <div class="footer-links"><div class="footer-col"><h4>// 分類</h4><ul>${Object.entries(site.categories).map(([k, c]) => `<li><a href="/${k}/">${esc(c.title)}</a></li>`).join('')}</ul></div>
    <div class="footer-col"><h4>// 推薦閱讀</h4><ul>${site.footer.picks.map(p => `<li><a href="${p.href}">${esc(p.label)}</a></li>`).join('')}</ul></div></div>
  </div><div class="footer-bottom"><p>&copy; ${new Date().getFullYear()} ${esc(site.name)} // 獨立研究，不收業配，不鼓勵賭博。</p></div></footer>`;
}
/** 共用外殼：head 的 meta 由呼叫端決定（物件），body 片段直接塞 */
export function layout(site, { title, description, canonical, ogType = 'website', ogDescription, image, extraHead = '', jsonld = [], noindex = false }, body, build) {
  const og = image || `${site.url}/images/og-default.png`;
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex">' : ''}
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(title.replace(/\s*\|\s*大衛の電子攻略站$/, ''))}">
  <meta property="og:description" content="${esc(ogDescription || description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" href="/images/favicon-32.png">
  <link rel="preload" href="/style.css?v=${build}" as="style">
  <link rel="stylesheet" href="/style.css?v=${build}">
  ${extraHead}
  ${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n  ')}
</head>
<body>
${body}
<script src="/js/site.js?v=${build}" defer></script>
</body>
</html>
`;
}
export { esc };
