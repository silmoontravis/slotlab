// 大衛の電子攻略站 - Shared Components

const SITE_NAME = '大衛の電子攻略站';
const BASE_URL = getBaseUrl();
const ARTICLE_COUNTS = { slots: 35, casinos: 20, guides: 32, rtp: 11 };
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

function renderAdSlot(position, size) {
  const page = getPageCode();
  const id = `${position}-${page}-001`;
  const sizeLabel = size === 'banner' ? '728×90' : size === 'sidebar' ? '300×250' : '728×90';
  return `<div class="ad-banner" data-ad-id="${id}">
    <div class="ad-placeholder">
      <div class="ad-label">廣告版位 ${id}</div>
      <div class="ad-size">${sizeLabel}</div>
      <div class="ad-cta">歡迎洽詢合作 📩</div>
    </div>
  </div>`;
}

function renderFooter() {
  return `
  <div class="ad-footer" style="max-width:1100px;margin:0 auto 24px;padding:0 20px;height:90px;">
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
  if (headerAdEl) headerAdEl.innerHTML = `<div class="ad-header"><div style="height:90px;">${renderAdSlot('A', 'banner')}</div></div>`;

  // Inline ads
  document.querySelectorAll('.ad-inline').forEach((el, i) => {
    el.innerHTML = renderAdSlot(`C${i+1}`, 'banner');
  });

  // Article sidebar ad (next to TOC)
  const articleSidebarAd = document.getElementById('article-sidebar-ad');
  if (articleSidebarAd) {
    articleSidebarAd.innerHTML = renderAdSlot('E', 'sidebar');
  }
}
