// 大衛の電子攻略站 - Shared Components

const SITE_NAME = '大衛の電子攻略站';
const BASE_URL = getBaseUrl();
const ARTICLE_COUNTS = { slots: 35, casinos: 20, guides: 37, rtp: 11 };
const TOTAL_ARTICLES = Object.values(ARTICLE_COUNTS).reduce((a,b) => a+b, 0);

function getBaseUrl() {
  const path = window.location.pathname;
  if (path.includes('/slotlab')) {
    const idx = path.indexOf('/slotlab');
    return path.substring(0, idx) + '/slotlab';
  }
  return '';
}

function renderHeader(activePage) {
  const nav = [
    { href: `${BASE_URL}/`, label: '首頁', id: 'home' },
    { href: `${BASE_URL}/slots/`, label: '老虎機', id: 'slots' },
    { href: `${BASE_URL}/casinos/`, label: '娛樂城', id: 'casinos' },
    { href: `${BASE_URL}/guides/`, label: '攻略', id: 'guides' },
    { href: `${BASE_URL}/rtp/`, label: 'RTP', id: 'rtp' },
    { href: `${BASE_URL}/about.html`, label: '關於大衛', id: 'about' },
  ];

  const menuItems = nav.map(item =>
    `<li><a href="${item.href}" class="${activePage === item.id ? 'active' : ''}">${item.label}</a></li>`
  ).join('');

  return `
  <header class="site-header">
    <div class="header-inner">
      <a href="${BASE_URL}/" class="site-logo">
        <img src="${BASE_URL}/images/logo.png" alt="RTP96" height="80">
        <span class="logo-text">
          <span class="logo-main">大衛の電子攻略站</span>
          <span class="logo-sub">// rtp96.com</span>
        </span>
      </a>
      <nav>
        <ul class="nav-menu" id="navMenu">
          ${menuItems}
        </ul>
      </nav>
      <button class="mobile-toggle" onclick="document.getElementById('navMenu').classList.toggle('active')" aria-label="選單">☰</button>
    </div>
  </header>`;
}

function getPageCode() {
  const path = window.location.pathname;
  if (path.includes('what-is-rtp')) return 'RTP01';
  if (path.includes('high-volatility')) return 'VOL01';
  if (path.includes('top-10')) return 'TOP10';
  if (path.includes('how-to-choose')) return 'CSN01';
  if (path.includes('beginner')) return 'BEG01';
  if (path.includes('rtp-myths')) return 'MTH01';
  if (path.includes('/slots/') && !path.includes('.html')) return 'SLOT';
  if (path.includes('/casinos/') && !path.includes('.html')) return 'CSNO';
  if (path.includes('/guides/') && !path.includes('.html')) return 'GUID';
  if (path.includes('/rtp/') && !path.includes('.html')) return 'RTPX';
  return 'HOME';
}

// 自家產品廣告（2026-10-04）：同尺寸的兩張輪播；點了到客服中心落地頁（cs.wii789.com/ask/{product}），對話框第一句自動帶「我要詢問「X」產品」
//   SEO：兩張都在 HTML 裡（輪播只切可見），每張是真的 <a>，alt／title 寫產品關鍵詞，<picture> 給 WebP＋@2x，寫死寬高不跳版，自家產品不加 nofollow
const ADS = [
  { key: 'ceo', name: 'CEO 傳真系統', href: 'https://cs.wii789.com/ask/ceo', cap: 'LINE BOT 整合 · 傳單直接進掃描列印',
    alt: 'CEO 傳真系統：LINE BOT 整合，LINE 傳單直接進掃描列印與收發流程', title: '詢問 CEO 傳真系統（LINE BOT 整合、訊息管理、掃描列印）' },
  { key: '123win', name: '123Win 2.0 樂透記帳', href: 'https://cs.wii789.com/ask/123win', cap: 'KEY 單 · 會員群組 · 日月年報表',
    alt: '123Win 2.0 樂透記帳 KEY 單系統：會員、群組、個人帳單與日月年報表', title: '詢問 123Win 2.0 樂透記帳 KEY 單系統' },
];
function renderAdSlot(position, size) {
  const id = `${position}-${getPageCode()}-001`;
  const [w, h] = size === 'sidebar' ? [300, 250] : [728, 90];
  const f = `${w}x${h}`, eager = position === 'A';
  const items = ADS.map((a, i) => `<a class="ad-item${i === 0 ? ' on' : ''}" href="${a.href}" title="${a.title}" data-ad="${a.key}" data-slot="${id}">
      <picture><source type="image/webp" srcset="${BASE_URL}/images/ads/${a.key}-${f}.webp 1x, ${BASE_URL}/images/ads/${a.key}-${f}@2x.webp 2x">
      <img src="${BASE_URL}/images/ads/${a.key}-${f}.png" alt="${a.alt}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>
      ${size === 'sidebar' ? `<span class="ad-cap"><b>${a.name}</b>${a.cap}</span>` : ''}</a>`).join('');
  return `<div class="ad-rotator ad-size-${size}" data-ad-id="${id}" style="--ad-w:${w};--ad-h:${h}">${items}</div>`;
}
// 輪播：每個版位 8 秒換一張，相鄰版位錯開起始（同一頁同時看得到兩個產品）；滑鼠停著不換；系統設「減少動態」就不自動換；點擊記 GA 事件
function initAds() {
  const slots = [...document.querySelectorAll('.ad-rotator')].filter(el => el.offsetParent !== null);   // 只算看得到的（側欄在手機是 display:none）
  slots.forEach((el, i) => {
    const items = [...el.querySelectorAll('.ad-item')]; if (items.length < 2) return;
    let cur = i % items.length; items.forEach((a, k) => a.classList.toggle('on', k === cur));
    const step = () => { if (el.matches(':hover')) return; cur = (cur + 1) % items.length; items.forEach((a, k) => a.classList.toggle('on', k === cur)); };
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(step, 8000);
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.ad-item'); if (!a || typeof gtag !== 'function') return;
    gtag('event', 'ad_click', { product: a.dataset.ad, slot: a.dataset.slot, page: location.pathname });
  });
}

function renderFooter() {
  return `
  <div class="ad-footer" style="max-width:1100px;margin:0 auto 24px;padding:0 20px;">
    ${renderAdSlot('D', 'banner')}
  </div>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">
          <img src="${BASE_URL}/images/favicon-32.png" alt="" width="24" height="24">
          大衛の電子攻略站
        </div>
        <p>一個軟體工程師的老虎機研究筆記。用 Python 跑數據、用機率論看遊戲，純粹好奇心驅動。所有內容僅供教育與娛樂用途。</p>
      </div>
      <div class="footer-links">
        <div class="footer-col">
          <h4>// 分類</h4>
          <ul>
            <li><a href="${BASE_URL}/slots/">老虎機研究</a></li>
            <li><a href="${BASE_URL}/casinos/">娛樂城觀察</a></li>
            <li><a href="${BASE_URL}/guides/">新手攻略</a></li>
            <li><a href="${BASE_URL}/rtp/">RTP 分析</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>// 推薦閱讀</h4>
          <ul>
            <li><a href="${BASE_URL}/guides/beginner-complete-guide.html">入門指南</a></li>
            <li><a href="${BASE_URL}/slots/what-is-rtp.html">RTP 是什麼</a></li>
            <li><a href="${BASE_URL}/about.html">關於大衛</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 大衛の電子攻略站 // 獨立研究，不收業配，不鼓勵賭博。</p>
    </div>
  </footer>`;
}

function renderBreadcrumb(items) {
  const crumbs = items.map((item, i) => {
    if (i === items.length - 1) {
      return `<span style="color:var(--text-primary)">${item.label}</span>`;
    }
    return `<a href="${item.href}">${item.label}</a><span class="sep">/</span>`;
  }).join('');
  return `<div class="breadcrumb">${crumbs}</div>`;
}

function renderSidebar() {
  return `
  <aside class="sidebar">
    <div class="widget widget-about">
      <img class="widget-avatar" src="${BASE_URL}/images/david-avatar.png" alt="大衛">
      <div class="widget-name">大衛 (David)</div>
      <div class="widget-bio">軟體工程師 / 業餘老虎機研究者<br>用 code 拆解遊戲機率</div>
    </div>
    <div class="widget">
      <h3 class="widget-title">分類</h3>
      <ul class="widget-list">
        <li><a href="${BASE_URL}/slots/"><span class="cat-pill cat-slots">老虎機</span> 研究筆記 <span class="cat-count">${ARTICLE_COUNTS.slots}</span></a></li>
        <li><a href="${BASE_URL}/casinos/"><span class="cat-pill cat-casinos">娛樂城</span> 平台觀察 <span class="cat-count">${ARTICLE_COUNTS.casinos}</span></a></li>
        <li><a href="${BASE_URL}/guides/"><span class="cat-pill cat-guides">攻略</span> 新手指南 <span class="cat-count">${ARTICLE_COUNTS.guides}</span></a></li>
        <li><a href="${BASE_URL}/rtp/"><span class="cat-pill cat-rtp">RTP</span> 數據分析 <span class="cat-count">${ARTICLE_COUNTS.rtp}</span></a></li>
      </ul>
    </div>
    <div class="ad-sidebar">${renderAdSlot('B', 'sidebar')}</div>
    <div class="widget">
      <h3 class="widget-title">熱門文章</h3>
      <ul class="widget-list">
        <li><a href="${BASE_URL}/guides/beginner-complete-guide.html">新手完整入門指南</a></li>
        <li><a href="${BASE_URL}/slots/what-is-rtp.html">RTP 到底是什麼？</a></li>
        <li><a href="${BASE_URL}/slots/top-10-slots-2026.html">2026 十大推薦機台</a></li>
        <li><a href="${BASE_URL}/rtp/rtp-myths.html">RTP 五大迷思破解</a></li>
        <li><a href="${BASE_URL}/slots/high-volatility-guide.html">高波動 vs 低波動</a></li>
      </ul>
    </div>
    <div class="ad-sidebar">${renderAdSlot('B2', 'sidebar')}</div>
  </aside>`;
}

// Generate article author block
function renderAuthor(date, readTime) {
  return `
  <div class="article-author">
    <img src="${BASE_URL}/images/david-avatar.png" alt="大衛">
    <div class="author-info">
      <div class="author-name">大衛 (David)</div>
      <div class="author-date">${date} &middot; ${readTime}</div>
    </div>
  </div>`;
}

// GA4 Tracking
function initGA() {
  if (document.querySelector('script[src*="gtag"]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-WD5D746KC6';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-WD5D746KC6');
}

// Initialize page
function initPage(activePage) {
  initGA();
  const headerEl = document.getElementById('site-header');
  if (headerEl) headerEl.innerHTML = renderHeader(activePage);

  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.innerHTML = renderFooter();

  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) sidebarEl.innerHTML = renderSidebar();

  // Header ad
  const headerAdEl = document.getElementById('header-ad');
  if (headerAdEl) headerAdEl.innerHTML = `<div class="ad-header">${renderAdSlot('A', 'banner')}</div>`;

  // Inline ads
  document.querySelectorAll('.ad-inline').forEach((el, i) => {
    el.innerHTML = renderAdSlot(`C${i+1}`, 'banner');
  });

  // Article sidebar ad (next to TOC)
  const articleSidebarAd = document.getElementById('article-sidebar-ad');
  if (articleSidebarAd) {
    articleSidebarAd.innerHTML = renderAdSlot('E', 'sidebar');
  }
  initAds();
}
