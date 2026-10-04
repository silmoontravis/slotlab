// 站的瀏覽器端程式（HTML 全部由 build.mjs 產好，這裡只做互動）：GA4、廣告輪播＋點擊事件、列表分頁、部落格分類篩選
(() => {
  // ---------- GA4 ----------
  const GA = document.documentElement.dataset.ga;
  if (GA && !document.querySelector('script[src*="gtag"]')) {
    const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', GA);
  }
  // ---------- 自家產品廣告：每個版位 8 秒換一張，看得到的版位錯開起始；滑鼠停著不換；減少動態就不自動換；點擊記 GA ----------
  const slots = [...document.querySelectorAll('.ad-rotator')].filter(el => el.offsetParent !== null);
  slots.forEach((el, i) => {
    const items = [...el.querySelectorAll('.ad-item')]; if (items.length < 2) return;
    let cur = i % items.length; items.forEach((a, k) => a.classList.toggle('on', k === cur));
    const step = () => { if (el.matches(':hover')) return; cur = (cur + 1) % items.length; items.forEach((a, k) => a.classList.toggle('on', k === cur)); };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(step, 8000);
  });
  document.addEventListener('click', (e) => { const a = e.target.closest('.ad-item'); if (a && typeof gtag === 'function') gtag('event', 'ad_click', { product: a.dataset.ad, slot: a.dataset.slot, page: location.pathname }); });
  // ---------- 列表分頁（data-page-size）＋ 部落格篩選（data-filter）----------
  for (const list of document.querySelectorAll('.post-list[data-page-size]')) {
    const size = +list.dataset.pageSize || 10; let items = [...list.querySelectorAll('.post-item')]; if (items.length <= size) continue;
    let page = 0; const nav = document.createElement('div'); nav.className = 'pager'; list.after(nav);
    const render = () => {
      const vis = items; const pages = Math.ceil(vis.length / size); if (page >= pages) page = Math.max(0, pages - 1);
      [...list.querySelectorAll('.post-item')].forEach(it => { const i = vis.indexOf(it); it.style.display = i >= page * size && i < (page + 1) * size ? '' : 'none'; });
      nav.innerHTML = ''; if (pages <= 1) return;
      for (let i = 0; i < pages; i++) { const b = document.createElement('button'); b.type = 'button'; b.textContent = i + 1; b.className = i === page ? 'on' : ''; b.onclick = () => { page = i; render(); list.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; nav.appendChild(b); }
    };
    list._refilter = (cat) => { items = [...list.querySelectorAll('.post-item')].filter(it => !cat || it.dataset.cat === cat); page = 0; render(); };
    render();
  }
  for (const btn of document.querySelectorAll('[data-filter]')) btn.addEventListener('click', () => {
    const wrap = btn.closest('[data-filters]'); wrap.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b === btn));
    const list = document.querySelector(wrap.dataset.filters); if (!list) return;
    if (list._refilter) list._refilter(btn.dataset.filter); else list.querySelectorAll('.post-item').forEach(it => { it.style.display = !btn.dataset.filter || it.dataset.cat === btn.dataset.filter ? '' : 'none'; });
  });
})();
