// 大衛の電子攻略站 - Shared Components

const SITE_NAME = '大衛の電子攻略站';
const BASE_URL = getBaseUrl();

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
        <img src="${BASE_URL}/images/logo.png" alt="大衛の電子攻略站" height="40">
        <span class="logo-text">
          <span class="logo-main">大衛の電子攻略站</span>
          <span class="logo-sub">// David's Slot Research</span>
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

function renderFooter() {
  return `
  <div class="ad-footer" style="max-width:1100px;margin:0 auto 24px;padding:0 20px;height:90px;">
    <div class="ad-banner" style="height:90px">/* ad: 728x90 */</div>
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
        <li><a href="${BASE_URL}/slots/"><span class="cat-pill cat-slots">老虎機</span> 研究筆記</a></li>
        <li><a href="${BASE_URL}/casinos/"><span class="cat-pill cat-casinos">娛樂城</span> 平台觀察</a></li>
        <li><a href="${BASE_URL}/guides/"><span class="cat-pill cat-guides">攻略</span> 新手指南</a></li>
        <li><a href="${BASE_URL}/rtp/"><span class="cat-pill cat-rtp">RTP</span> 數據分析</a></li>
      </ul>
    </div>
    <div class="ad-sidebar"><div class="ad-banner" style="height:250px;">/* ad: 300x250 */</div></div>
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
    <div class="ad-sidebar"><div class="ad-banner" style="height:250px;">/* ad: 300x250 */</div></div>
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

// Initialize page
function initPage(activePage) {
  const headerEl = document.getElementById('site-header');
  if (headerEl) headerEl.innerHTML = renderHeader(activePage);

  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.innerHTML = renderFooter();

  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) sidebarEl.innerHTML = renderSidebar();
}
