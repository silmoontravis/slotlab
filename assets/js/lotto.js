// 樂透專區的瀏覽器端：頁籤、對獎器、計算機（統計表全部在 build 時算好）
(() => {
  // ---------- 頁籤 ----------
  for (const wrap of document.querySelectorAll('[data-tabs]')) {
    const btns = [...wrap.querySelectorAll('[data-tab]')]; const panes = (name) => [...document.querySelectorAll(`[data-pane="${name}"]`)];
    btns.forEach(b => b.addEventListener('click', () => { btns.forEach(x => x.classList.toggle('on', x === b)); btns.forEach(x => panes(x.dataset.tab).forEach(p => p.hidden = x !== b)); }));
  }
  // ---------- 對獎器 ----------
  const TIERS = {
    lotto649: (m, s) => m === 6 ? '頭獎' : m === 5 && s ? '貳獎' : m === 5 ? '參獎' : m === 4 && s ? '肆獎' : m === 4 ? '伍獎' : m === 3 && s ? '陸獎' : m === 2 && s ? '柒獎' : m === 3 ? '普獎' : '',
    superlotto638: (m, z) => m === 6 && z ? '頭獎' : m === 6 ? '貳獎' : m === 5 && z ? '參獎' : m === 5 ? '肆獎' : m === 4 && z ? '伍獎' : m === 4 ? '陸獎' : m === 3 && z ? '柒獎' : m === 2 && z ? '捌獎' : m === 3 ? '玖獎' : m === 1 && z ? '普獎' : '',
    daily539: (m) => m === 5 ? '頭獎' : m === 4 ? '貳獎' : m === 3 ? '參獎' : m === 2 ? '肆獎' : '',
  };
  for (const box of document.querySelectorAll('.lt-checker')) {
    const game = box.dataset.game, pick = +box.dataset.pick, max = +box.dataset.max, z2max = +box.dataset.zone2 || 0;
    const draws = JSON.parse(box.dataset.draws); const inputs = [...box.querySelectorAll('.lt-inputs input:not([data-zone2])')]; const z2 = box.querySelector('[data-zone2]'); const out = box.querySelector('.lt-result');
    const pad = (n) => String(n).padStart(2, '0');
    box.querySelector('[data-random]').onclick = () => { const s = new Set(); while (s.size < pick) s.add(1 + Math.floor(Math.random() * max)); [...s].sort((a, b) => a - b).forEach((n, i) => inputs[i].value = n); if (z2) z2.value = 1 + Math.floor(Math.random() * z2max); };
    box.querySelector('[data-check]').onclick = () => {
      const nums = inputs.map(i => +i.value).filter(Boolean);
      if (nums.length !== pick || new Set(nums).size !== pick || nums.some(n => n < 1 || n > max)) { out.innerHTML = `<p class="warn">要填 ${pick} 個不重複、1～${max} 的號碼。</p>`; return; }
      const zz = z2 ? +z2.value : 0; if (z2 && (!zz || zz < 1 || zz > z2max)) { out.innerHTML = `<p class="warn">第二區要填 1～${z2max}。</p>`; return; }
      let best = null; const rows = [];
      for (const [period, date, ns, sp] of draws) {
        const m = nums.filter(n => ns.includes(n)).length; const hitSp = game === 'superlotto638' ? zz === sp : (sp != null && nums.includes(sp));
        const tier = TIERS[game](m, hitSp); if (tier) { rows.push([period, date, m, hitSp, tier]); if (!best) best = tier; }
      }
      if (typeof gtag === 'function') gtag('event', 'lotto_check', { game, hits: rows.length });
      out.innerHTML = rows.length ? `<p>最近 ${draws.length} 期裡有 <b>${rows.length}</b> 期中獎（最高 <b>${best}</b>）：</p><div class="lt-scroll"><table class="lt-table"><thead><tr><th>期別</th><th>開獎日</th><th>對中</th><th>獎項</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]} 顆${r[3] ? (game === 'superlotto638' ? '＋第二區' : '＋特別號') : ''}</td><td><b>${r[4]}</b></td></tr>`).join('')}</tbody></table></div><p class="muted">只對最近 ${draws.length} 期；這組號碼每期中頭獎的機率跟任何一組一樣。</p>`
        : `<p>最近 ${draws.length} 期這組都沒中任何獎項（${pad(nums[0])}…）。這很正常，每一組都一樣：機率不會因為沒中而變高。</p>`;
    };
  }
  // ---------- 計算機 ----------
  const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const money = (n) => Math.round(n).toLocaleString('zh-TW');
  const bind = (el, fn) => { el.querySelectorAll('input,select').forEach(i => i.addEventListener('input', fn)); fn(); };
  for (const el of document.querySelectorAll('[data-calc="wheel"]')) {
    const G = { lotto649: [6, 50, 49], superlotto638: [6, 100, 38], daily539: [5, 50, 39] };
    bind(el, () => { const g = el.querySelector('[data-game]').value, [k, price, max] = G[g]; const n = +el.querySelector('[data-n]').value || 0; const z = el.querySelector('[data-z2]'); z.hidden = g !== 'superlotto638'; const all = g === 'superlotto638' && el.querySelector('[data-zone2all]').checked ? 8 : 1;
      if (n < k || n > max) { el.querySelector('.calc-out').innerHTML = `<p class="warn">號碼數要在 ${k}～${max}。</p>`; return; }
      const bets = C(n, k) * all; const odds = g === 'superlotto638' ? C(38, 6) * 8 : C(max, k);
      el.querySelector('.calc-out').innerHTML = `<p>C(${n},${k})${all > 1 ? '×8' : ''} ＝ <b>${money(bets)}</b> 注，金額 <b>${money(bets * price)}</b> 元。</p><p class="muted">頭獎機率從 1/${money(odds)} 變成 ${money(bets)}/${money(odds)}（＝${(bets / odds * 100).toExponential(2)}%）；成本也是 ${money(bets)} 倍，單位成本的機率一模一樣。</p>`; });
  }
  for (const el of document.querySelectorAll('[data-calc="combo"]')) bind(el, () => { const n = +el.querySelector('[data-n]').value || 0, k = +el.querySelector('[data-k]').value, p = +el.querySelector('[data-price]').value || 0; const c = C(n, k); el.querySelector('.calc-out').innerHTML = n < k ? `<p class="warn">號碼數要 ≥ ${k}。</p>` : `<p>${n} 碼${['', '', '二', '三', '四'][k]}星 ＝ C(${n},${k}) ＝ <b>${money(c)}</b> 碰，金額 <b>${money(c * p)}</b> 元（每碰 ${money(p)}）。</p>`; });
  for (const el of document.querySelectorAll('[data-calc="car"]')) bind(el, () => { const max = +el.querySelector('[data-max]').value, cars = +el.querySelector('[data-cars]').value || 0, p = +el.querySelector('[data-price]').value || 0; const groups = max - 1, hit = max === 39 ? 4 : 5; el.querySelector('.calc-out').innerHTML = `<p>一車 ＝ ${groups} 支 × ${money(p)} 元 ＝ <b>${money(groups * p)}</b> 元；${cars} 車 ＝ <b>${money(groups * cars * p)}</b> 元（共 ${(groups * cars).toLocaleString('zh-TW')} 支）。</p><p class="muted">中心號碼開出時中 ${hit} 支二星（×${cars} 車）；沒開出整車沒中。</p>`; });
  for (const el of document.querySelectorAll('[data-calc="pillar"]')) bind(el, () => {
    const cols = el.querySelector('[data-cols]').value.split(/[,，\s]+/).map(Number).filter(x => x > 0), k = +el.querySelector('[data-k]').value, p = +el.querySelector('[data-price]').value || 0;
    if (cols.length < k) { el.querySelector('.calc-out').innerHTML = `<p class="warn">${['', '', '二', '三', '四'][k]}星至少要 ${k} 柱。</p>`; return; }
    let total = 0; const pick = (start, left, prod) => { if (!left) { total += prod; return; } for (let i = start; i <= cols.length - left; i++) pick(i + 1, left - 1, prod * cols[i]); }; pick(0, k, 1);
    el.querySelector('.calc-out').innerHTML = `<p>${cols.length} 柱（${cols.join('、')} 個號碼）跨柱${['', '', '二', '三', '四'][k]}星 ＝ <b>${money(total)}</b> 碰，金額 <b>${money(total * p)}</b> 元。</p><p class="muted">對照：同樣 ${cols.reduce((a, b) => a + b, 0)} 個號碼全連碰是 C(${cols.reduce((a, b) => a + b, 0)},${k}) ＝ ${money(C(cols.reduce((a, b) => a + b, 0), k))} 碰，差的就是同柱內的組合。</p>`;
  });
})();
