// SlotLab 虎機研究所 - Shared Components

const SITE_NAME = 'SlotLab 虎機研究所';
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
    { href: `${BASE_URL}/slots/`, label: '老虎機評測', id: 'slots' },
    { href: `${BASE_URL}/casinos/`, label: '娛樂城評比', id: 'casinos' },
    { href: `${BASE_URL}/guides/`, label: '遊戲攻略', id: 'guides' },
    { href: `${BASE_URL}/rtp/`, label: 'RTP 分析', id: 'rtp' },
    { href: `${BASE_URL}/about.html`, label: '關於我們', id: 'about' },
  ];

  const menuItems = nav.map(item =>
    `<li><a href="${item.href}" class="${activePage === item.id ? 'active' : ''}">${item.label}</a></li>`
  ).join('');

  return `
  <header class="site-header">
    <div class="header-inner">
      <a href="${BASE_URL}/" class="site-logo">
        <div class="logo-icon">🎰</div>
        <span>SlotLab</span>
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
  <div class="ad-footer"><div class="ad-banner" style="height:90px">728 x 90 廣告版位</div></div>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="site-logo" style="font-size:1.2rem;">
          <div class="logo-icon" style="width:36px;height:36px;font-size:1rem;">🎰</div>
          <span style="background:linear-gradient(90deg,var(--neon-green),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">SlotLab 虎機研究所</span>
        </div>
        <p>台灣首個以數據科學角度深度解析老虎機與線上娛樂城的獨立評測媒體。我們用 RTP 數學模型、波動率分析、實機測試，帶你看懂每一台老虎機的真實面貌。</p>
      </div>
      <div class="footer-col">
        <h4>評測分類</h4>
        <ul>
          <li><a href="${BASE_URL}/slots/">老虎機評測</a></li>
          <li><a href="${BASE_URL}/casinos/">娛樂城評比</a></li>
          <li><a href="${BASE_URL}/guides/">遊戲攻略</a></li>
          <li><a href="${BASE_URL}/rtp/">RTP 分析</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>新手必讀</h4>
        <ul>
          <li><a href="${BASE_URL}/guides/beginner-complete-guide.html">完整入門指南</a></li>
          <li><a href="${BASE_URL}/slots/what-is-rtp.html">什麼是 RTP</a></li>
          <li><a href="${BASE_URL}/casinos/how-to-choose.html">如何選娛樂城</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>關於</h4>
        <ul>
          <li><a href="${BASE_URL}/about.html">關於我們</a></li>
          <li><a href="${BASE_URL}/about.html#disclaimer">免責聲明</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 SlotLab 虎機研究所. 本站為獨立評測媒體，不隸屬於任何博弈平台。所有內容僅供教育參考用途。</p>
    </div>
  </footer>`;
}

function renderBreadcrumb(items) {
  const crumbs = items.map((item, i) => {
    if (i === items.length - 1) {
      return `<span style="color:var(--text-primary)">${item.label}</span>`;
    }
    return `<a href="${item.href}">${item.label}</a><span>/</span>`;
  }).join('');
  return `<div class="breadcrumb">${crumbs}</div>`;
}

function renderSidebar() {
  return `
  <aside class="sidebar">
    <div class="ad-sidebar"><div class="ad-banner" style="width:300px;height:250px;">300 x 250 廣告版位</div></div>
    <div class="widget">
      <h3 class="widget-title">熱門文章</h3>
      <ul class="widget-list">
        <li><a href="${BASE_URL}/slots/what-is-rtp.html">📊 什麼是 RTP？完整解析</a></li>
        <li><a href="${BASE_URL}/slots/high-volatility-guide.html">🎯 高波動 vs 低波動指南</a></li>
        <li><a href="${BASE_URL}/slots/top-10-slots-2026.html">🏆 2026 十大熱門老虎機</a></li>
        <li><a href="${BASE_URL}/rtp/rtp-myths.html">💡 RTP 五大迷思破解</a></li>
        <li><a href="${BASE_URL}/guides/beginner-complete-guide.html">📖 新手完整入門指南</a></li>
      </ul>
    </div>
    <div class="widget">
      <h3 class="widget-title">文章分類</h3>
      <ul class="widget-list">
        <li><a href="${BASE_URL}/slots/"><span class="tag cat-slots">老虎機評測</span></a></li>
        <li><a href="${BASE_URL}/casinos/"><span class="tag cat-casinos">娛樂城評比</span></a></li>
        <li><a href="${BASE_URL}/guides/"><span class="tag cat-guides">遊戲攻略</span></a></li>
        <li><a href="${BASE_URL}/rtp/"><span class="tag cat-rtp">RTP 分析</span></a></li>
      </ul>
    </div>
    <div class="ad-sidebar"><div class="ad-banner" style="width:300px;height:250px;">300 x 250 廣告版位</div></div>
  </aside>`;
}

// Initialize page
function initPage(activePage) {
  // Header
  const headerEl = document.getElementById('site-header');
  if (headerEl) headerEl.innerHTML = renderHeader(activePage);

  // Footer
  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.innerHTML = renderFooter();

  // Sidebar
  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) sidebarEl.innerHTML = renderSidebar();
}
