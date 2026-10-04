// 樂透專區（docs/ARCHITECTURE.md §2.6）：三彩種開獎工具頁、包牌／連碰計算機、專區首頁的工具卡
//   資料來源 data/lotto/*.json（scripts/lotto-fetch.mjs）；統計全部在 build 時算好，瀏覽器只切頁籤、對獎、算錢
import fs from 'node:fs';
import path from 'node:path';
import { esc, adSlot } from './index.mjs';

export const GAMES = {
  lotto649: { name: '大樂透', slug: 'lotto649-results', pick: 6, max: 49, special: '特別號', specialMax: 49, price: 50, days: [2, 5], dayText: '每週二、五 20:30', zone2: false,
    tiers: { jackpot: '頭獎', second: '貳獎', third: '參獎', fourth: '肆獎', fifth: '伍獎', sixth: '陸獎', seventh: '柒獎', normal: '普獎' },
    rules: [['6', '頭獎'], ['5+特', '貳獎'], ['5', '參獎'], ['4+特', '肆獎'], ['4', '伍獎'], ['3+特', '陸獎'], ['2+特', '柒獎'], ['3', '普獎']] },
  superlotto638: { name: '威力彩', slug: 'superlotto638-results', pick: 6, max: 38, special: '第二區', specialMax: 8, price: 100, days: [1, 4], dayText: '每週一、四 20:30', zone2: true,
    tiers: { Jackpot: '頭獎', Second: '貳獎', Third: '參獎', Fourth: '肆獎', Fifth: '伍獎', Sixth: '陸獎', Seventh: '柒獎', Eighth: '捌獎', Ninth: '玖獎', normal: '普獎' },
    rules: [['6+二', '頭獎'], ['6', '貳獎'], ['5+二', '參獎'], ['5', '肆獎'], ['4+二', '伍獎'], ['4', '陸獎'], ['3+二', '柒獎'], ['2+二', '捌獎'], ['3', '玖獎'], ['1+二', '普獎']] },
  daily539: { name: '今彩539', slug: 'daily539-results', pick: 5, max: 39, special: null, price: 50, days: [1, 2, 3, 4, 5, 6], dayText: '每週一至六 20:30', zone2: false,
    tiers: { Jackpot: '頭獎', Second: '貳獎', Third: '參獎', Fourth: '肆獎' },
    rules: [['5', '頭獎 800 萬'], ['4', '貳獎 2 萬'], ['3', '參獎 300'], ['2', '肆獎 50']] },
};
const tierName = (g, t) => { for (const [k, v] of Object.entries(g.tiers)) if (t === k || t.endsWith(k) || t.toLowerCase().endsWith(k.toLowerCase())) return v; return t; };
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('zh-TW');
export const ball = (n, sp = false) => `<span class="ball${sp ? ' sp' : ''}">${String(n).padStart(2, '0')}</span>`;

export function loadGame(ROOT, id) {
  const f = path.join(ROOT, 'data/lotto', id + '.json'); if (!fs.existsSync(f)) return null;
  const db = JSON.parse(fs.readFileSync(f, 'utf8')); return { ...GAMES[id], id, draws: db.draws, updatedAt: db.updatedAt, errors: db.errors || [] };
}
/** 統計：各取樣窗出現次數、目前遺漏、歷史最大遺漏、連莊、特別號／第二區分布 */
export function stats(g) {
  const d = g.draws, n = d.length; const windows = [30, 50, 100];
  const nums = Array.from({ length: g.max }, (_, i) => i + 1);
  const row = Object.fromEntries(nums.map(k => [k, { n: k, w: {}, gap: 0, maxGap: 0, streak: 0, total: 0 }]));
  for (const w of windows) { const c = {}; for (const x of d.slice(-w)) for (const k of x.numbers) c[k] = (c[k] || 0) + 1; for (const k of nums) row[k].w[w] = c[k] || 0; }
  for (const x of d) for (const k of x.numbers) row[k].total++;
  for (const k of nums) {
    let gap = 0, maxGap = 0, cur = 0, last = -1;
    d.forEach((x, i) => { if (x.numbers.includes(k)) { if (i - last - 1 > maxGap) maxGap = i - last - 1; last = i; } });
    gap = last < 0 ? n : n - 1 - last; if (gap > maxGap) maxGap = gap;
    for (let i = n - 1; i >= 0 && d[i].numbers.includes(k); i--) cur++;
    Object.assign(row[k], { gap, maxGap, streak: cur });
  }
  let sp = null;
  if (g.special) { sp = {}; const smax = g.specialMax; for (const w of [...windows, n]) { const c = {}; for (const x of d.slice(-w)) if (x.special != null) c[x.special] = (c[x.special] || 0) + 1; sp[w] = Array.from({ length: smax }, (_, i) => ({ n: i + 1, c: c[i + 1] || 0 })); } }
  const expectedGap = (g.max / g.pick).toFixed(1);
  return { rows: nums.map(k => row[k]), windows, sp, expectedGap, n, first: d[0]?.drawDate, last: d[n - 1]?.drawDate };
}
/** 依開獎日判斷資料是不是最新：最近一個應開獎日（台灣時間）之後 2 小時還沒有那期 → 延遲 */
export function freshness(g, now = new Date()) {
  const tw = new Date(now.getTime() + 8 * 3600e3); const todayStr = tw.toISOString().slice(0, 10); const hour = tw.getUTCHours() + tw.getUTCMinutes() / 60;
  let dt = new Date(tw); if (hour < 22.5) dt.setUTCDate(dt.getUTCDate() - 1);   // 當天 22:30 前，當天那期還不算遲到
  for (let i = 0; i < 8; i++) { const dow = dt.getUTCDay() === 0 ? 7 : dt.getUTCDay(); if (g.days.includes(dow)) break; dt.setUTCDate(dt.getUTCDate() - 1); }
  const expected = dt.toISOString().slice(0, 10); const last = g.draws[g.draws.length - 1]?.drawDate || '';
  let next = new Date(tw); if (hour >= 20.5) next.setUTCDate(next.getUTCDate() + 1);
  for (let i = 0; i < 8; i++) { const dow = next.getUTCDay() === 0 ? 7 : next.getUTCDay(); if (g.days.includes(dow)) break; next.setUTCDate(next.getUTCDate() + 1); }
  return { ok: last >= expected, expected, last, next: next.toISOString().slice(0, 10), today: todayStr };
}
const tbl = (head, rows) => `<div class="lt-scroll"><table class="lt-table"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const drawRow = (g, x) => `<tr><td>${x.period}</td><td>${x.drawDate}</td><td class="balls">${x.numbers.map(n => ball(n)).join('')}${x.special != null ? ball(x.special, true) : ''}</td><td>${(() => { const j = x.prizes?.find(p => /jackpot/i.test(p.tier)); return j ? (j.winners ? `${j.winners} 注 × ${fmt(j.perPrize)}` : '摃龜') : '—'; })()}</td></tr>`;

/** 開獎工具頁正文（放進 article-layout 的位置由 build 決定） */
export function toolPage(g, site, code) {
  const st = stats(g); const fr = freshness(g); const latest = g.draws[g.draws.length - 1]; const prev = g.draws.slice(-31, -1).reverse();
  const hot = (w) => [...st.rows].sort((a, b) => b.w[w] - a.w[w] || a.n - b.n).slice(0, 10);
  const cold = (w) => [...st.rows].sort((a, b) => a.w[w] - b.w[w] || b.gap - a.gap).slice(0, 10);
  const mini = JSON.stringify(g.draws.slice(-30).reverse().map(x => [x.period, x.drawDate, x.numbers, x.special]));
  const jackpot = latest.prizes?.find(p => /jackpot/i.test(p.tier));
  return `
<section class="lt-hero">
  <div class="lt-latest">
    <div class="lt-kicker">${esc(g.name)} 最新開獎 · 第 ${latest.period} 期 · ${latest.drawDate}</div>
    <div class="balls big">${latest.numbers.map(n => ball(n)).join('')}${latest.special != null ? `<span class="plus">＋</span>${ball(latest.special, true)}` : ''}</div>
    <div class="lt-meta">開出順序：${latest.appearOrder.map(n => String(n).padStart(2, '0')).join(' → ')}${g.special ? `　|　${g.special}：${String(latest.special).padStart(2, '0')}` : ''}</div>
    <div class="lt-meta">頭獎：${jackpot ? (jackpot.winners ? `${jackpot.winners} 注中獎，每注 ${fmt(jackpot.perPrize)} 元` : `摃龜（獎金 ${fmt(jackpot.prize)} 元累積到下期）`) : '—'}　|　銷售額 ${fmt(latest.sales)} 元</div>
    <div class="lt-status ${fr.ok ? 'ok' : 'late'}">資料時間 ${esc((g.updatedAt || '').replace('T', ' ').slice(0, 16))} UTC · ${fr.ok ? '已是最新一期' : `更新狀態：延遲（應有 ${fr.expected} 那期，目前到 ${fr.last}）`} · 下次開獎 ${fr.next}（${esc(g.dayText)}）</div>
  </div>
  <div class="lt-prizes">${tbl(['獎項', '中獎注數', '每注獎金'], (latest.prizes || []).map(p => [tierName(g, p.tier), fmt(p.winners), p.perPrize ? fmt(p.perPrize) + ' 元' : (p.winners ? '—' : '無人中獎')]))}</div>
</section>

<div class="david-note">這頁的數字全部是我用程式從台彩官方 API 抓回來算的，資料從 ${st.first} 到 ${st.last} 共 ${fmt(st.n)} 期。開獎後我每天晚上抓兩次，官方公布後兩小時內會更新；上面那行狀態如果寫「延遲」，就是還沒抓到，不是我偷懶把舊的當新的。</div>

<h2 id="hot-cold">冷熱號（近 30／50／100 期）</h2>
<p>「熱號」是這段期間開出次數最多的號碼，「冷號」是最少的。先講結論：<strong>每期開獎彼此獨立，冷熱沒有預測力</strong>，我在 <a href="/lotto/hot-cold-numbers-do-they-work">這篇</a> 用全部歷史資料回測過。它能告訴你的是「大家都在追的熱號，中了要跟比較多人分」。</p>
<div class="tabs" data-tabs>${st.windows.map((w, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-tab="w${w}">近 ${w} 期</button>`).join('')}</div>
${st.windows.map((w, i) => `<div class="tab-pane" data-pane="w${w}" ${i ? 'hidden' : ''}>
  <div class="lt-two">
    <div><h3>熱號 Top 10</h3>${tbl(['號碼', `近 ${w} 期出現`, '目前遺漏'], hot(w).map(r => [ball(r.n), r.w[w], r.gap]))}</div>
    <div><h3>冷號 Top 10</h3>${tbl(['號碼', `近 ${w} 期出現`, '目前遺漏'], cold(w).map(r => [ball(r.n), r.w[w], r.gap]))}</div>
  </div></div>`).join('')}

<h2 id="missing">遺漏值與連莊（全部 ${g.max} 個號碼）</h2>
<p>「遺漏」＝這個號碼已經連續幾期沒開出；理論上平均每 <strong>${st.expectedGap}</strong> 期開出一次（${g.max}÷${g.pick}）。「歷史最大遺漏」是它曾經最久沒出現的紀錄。「連莊」＝目前連續幾期都有開出。</p>
${tbl(['號碼', '近30', '近50', '近100', '歷史總次數', '目前遺漏', '歷史最大遺漏', '連莊'], st.rows.map(r => [ball(r.n), r.w[30], r.w[50], r.w[100], r.total, r.gap >= 2 * st.expectedGap ? `<b class="warn">${r.gap}</b>` : r.gap, r.maxGap, r.streak ? `<b>${r.streak}</b>` : 0]))}

${st.sp ? `<h2 id="special">${esc(g.special)}分布</h2>
<div class="tabs" data-tabs>${[30, 50, 100, st.n].map((w, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-tab="s${w}">${w === st.n ? '全部' : '近 ' + w + ' 期'}</button>`).join('')}</div>
${[30, 50, 100, st.n].map((w, i) => `<div class="tab-pane" data-pane="s${w}" ${i ? 'hidden' : ''}>${tbl(['號碼', '出現次數', '佔比'], st.sp[w].map(x => [ball(x.n, true), x.c, (x.c / Math.min(w, st.n) * 100).toFixed(1) + '%']))}</div>`).join('')}` : ''}

<h2 id="check">對獎器（對最近 30 期）</h2>
<p>把你的號碼填進去，我幫你對最近 30 期，順便告訴你中的是哪一級。${g.zone2 ? '第二區另外填。' : ''}純前端計算，不會上傳你的號碼。</p>
<div class="lt-checker" data-game="${g.id}" data-pick="${g.pick}" data-max="${g.max}" data-zone2="${g.zone2 ? g.specialMax : ''}" data-draws='${mini.replace(/'/g, '&#39;')}'>
  <div class="lt-inputs">${Array.from({ length: g.pick }, (_, i) => `<input type="number" inputmode="numeric" min="1" max="${g.max}" placeholder="${i + 1}">`).join('')}${g.zone2 ? `<span class="plus">＋</span><input type="number" inputmode="numeric" min="1" max="${g.specialMax}" placeholder="二區" data-zone2>` : ''}</div>
  <div class="lt-actions"><button type="button" class="btn" data-check>對獎</button><button type="button" class="btn ghost" data-random>隨機填一組</button></div>
  <div class="lt-result" aria-live="polite"></div>
  <details class="lt-rules"><summary>中獎規則</summary>${tbl(['對中', '獎項'], g.rules)}</details>
</div>

<h2 id="history">近 30 期開獎紀錄</h2>
${tbl(['期別', '開獎日', '號碼', '頭獎'], [latest, ...prev].map(x => [x.period, x.drawDate, `<span class="balls">${x.numbers.map(n => ball(n)).join('')}${x.special != null ? ball(x.special, true) : ''}</span>`, (() => { const j = x.prizes?.find(p => /jackpot/i.test(p.tier)); return j ? (j.winners ? `${j.winners} 注 × ${fmt(j.perPrize)}` : '摃龜') : '—'; })()]))}
<p class="lt-more">更早的紀錄：<a href="/data/lotto/${g.id}.min.json">下載全部 ${fmt(st.n)} 期（JSON）</a>，欄位是期別、開獎日、號碼、${g.special || '—'}。來源都是 <a href="https://www.taiwanlottery.com/" rel="noopener">台灣彩券官網</a> 的公開資料。</p>

<h2 id="method">怎麼算的、以及我不會做的事</h2>
<ul>
  <li>資料：台彩官方 API 每期一筆，欄位含期別、開獎日、號碼、各獎項注數與獎金、銷售額。每筆進庫前驗期別遞增、號碼數量與範圍、不重複；驗不過不寫入。</li>
  <li>冷熱／遺漏／連莊：純計數，取樣窗分 30／50／100 期，全部在產生頁面時算好，你看到的就是算好的結果。</li>
  <li>我不做「預測」「明牌」「報號」。想知道為什麼，看 <a href="/lotto/hot-cold-numbers-do-they-work">冷熱號到底有沒有用</a> 和 <a href="/lotto/lottery-random-test">開獎隨機性檢定</a>。</li>
  <li>想算包牌或連碰要花多少錢：<a href="/lotto/lotto-wheel-calculator">包牌／連碰計算機</a>。</li>
</ul>`;
}
export function toolJsonLd(g, site) {
  const st = stats(g);
  return [{ '@context': 'https://schema.org', '@type': 'Dataset', name: `${g.name}歷史開獎號碼（${st.first}～${st.last}）`, description: `${g.name}自 ${st.first} 起共 ${st.n} 期的開獎號碼、各獎項注數與獎金、銷售額，來源台灣彩券官方公開資料，由大衛の電子攻略站整理。`, url: `${site.url}/lotto/${g.slug}`, license: 'https://www.taiwanlottery.com/', creator: { '@type': 'Person', name: site.author }, temporalCoverage: `${st.first}/${st.last}`, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${site.url}/data/lotto/${g.id}.min.json` }] }];
}
/** 專區首頁最上面的三張卡 */
export function hubCards(games) {
  return `<div class="lt-cards">${games.map(g => { const x = g.draws[g.draws.length - 1]; const fr = freshness(g); return `<a class="lt-card" href="/lotto/${g.slug}"><div class="lt-card-h"><b>${esc(g.name)}</b><span>第 ${x.period} 期 · ${x.drawDate}</span></div><div class="balls">${x.numbers.map(n => ball(n)).join('')}${x.special != null ? ball(x.special, true) : ''}</div><div class="lt-card-f">${fr.ok ? '最新' : '更新延遲'} · 下次 ${fr.next} · 冷熱號／遺漏／對獎 →</div></a>`; }).join('')}
  <a class="lt-card tool" href="/lotto/lotto-wheel-calculator"><div class="lt-card-h"><b>包牌／連碰計算機</b></div><p>大樂透、威力彩、539 包牌注數與金額；地下 539 二三四星連碰、全車、立柱的碰數算法。</p><div class="lt-card-f">打開計算機 →</div></a></div>`;
}
/** 計算機頁正文 */
export function calculatorPage() {
  return `
<p>我被問過太多次「包 8 個號碼多少錢」「6 碼下三星幾碰」，乾脆寫成計算機。上面三個是台彩的合法玩法，下面是地下 539／六合的術語算法——<strong>只算數學，不教怎麼玩、不提供任何管道</strong>。</p>
<div class="tabs" data-tabs><button type="button" class="on" data-tab="c1">台彩包牌</button><button type="button" data-tab="c2">連碰（二三四星）</button><button type="button" data-tab="c3">全車</button><button type="button" data-tab="c4">立柱</button></div>
<div class="tab-pane" data-pane="c1">
  <div class="calc" data-calc="wheel">
    <label>彩種 <select data-game><option value="lotto649">大樂透（49 選 6，每注 50 元）</option><option value="superlotto638">威力彩（38 選 6＋第二區 8 選 1，每注 100 元）</option><option value="daily539">今彩539（39 選 5，每注 50 元）</option></select></label>
    <label>選幾個號碼 <input type="number" data-n value="8" min="5" max="20"></label>
    <label data-z2 hidden><input type="checkbox" data-zone2all checked> 第二區 8 個全包（×8）</label>
    <div class="calc-out" aria-live="polite"></div>
  </div>
  <p>包牌＝把你選的 n 個號碼所有 k 碼組合全買，注數就是組合數 C(n,k)。注意：注數變多，<em>每一注</em>的中獎機率完全沒變，只是你買的注數多了；成本跟機率是同倍數上升，不會「比較划算」。詳見 <a href="/lotto/lotto649-wheeling-worth-it">大樂透包牌划算嗎</a>。</p>
</div>
<div class="tab-pane" data-pane="c2" hidden>
  <div class="calc" data-calc="combo">
    <label>選幾個號碼 <input type="number" data-n value="6" min="2" max="20"></label>
    <label>幾星 <select data-k><option value="2">二星</option><option value="3">三星</option><option value="4">四星</option></select></label>
    <label>每碰單價（元，自己填） <input type="number" data-price value="100" min="1"></label>
    <div class="calc-out" aria-live="polite"></div>
  </div>
  <p>連碰＝把 n 個號碼裡所有 k 碼的組合都下一碰，碰數＝C(n,k)：6 碼二星 15 碰、6 碼三星 20 碰、6 碼四星 15 碰。金額＝碰數×單價。術語解釋在 <a href="/lotto/underground-539-stars">二星三星四星是什麼</a> 與 <a href="/lotto/underground-539-combos-and-cars">連碰與車</a>。</p>
</div>
<div class="tab-pane" data-pane="c3" hidden>
  <div class="calc" data-calc="car">
    <label>彩種 <select data-max><option value="39">539（1 碰 38）</option><option value="49">六合（1 碰 48）</option></select></label>
    <label>幾車 <input type="number" data-cars value="1" min="0.1" step="0.1"></label>
    <label>每支價格（元） <input type="number" data-price value="75" min="1"></label>
    <div class="calc-out" aria-live="polite"></div>
  </div>
  <p><strong>一車怎麼算：</strong>選定 1 個號碼，跟其餘每個號碼各碰一支二星。539 有 39 個號碼，扣掉自己 ＝ <strong>38 支</strong>；六合彩 49 個 ＝ <strong>48 支</strong>。一車的錢 ＝ 支數 × 每支價格。每支價格看盤口，坊間常見 70～80 元上下，有的系統固定 100 元一支。</p>
  <div class="lt-scroll"><table class="lt-table"><thead><tr><th>每支價格</th><th>539 一車（38 支）</th><th>六合 一車（48 支）</th></tr></thead><tbody>
    <tr><td>70 元</td><td>2,660 元</td><td>3,360 元</td></tr><tr><td>75 元</td><td>2,850 元</td><td>3,600 元</td></tr><tr><td>80 元</td><td>3,040 元</td><td>3,840 元</td></tr><tr><td>100 元</td><td>3,800 元</td><td>4,800 元</td></tr></tbody></table></div>
  <p>中獎怎麼看：中心號碼沒開，整車沒中；中心號碼開了，它跟其他開出號碼的那幾支二星都中——539 開 5 顆所以中 4 支、六合開 6 顆正碼所以中 5 支。半車＝每支下 0.5，錢跟中獎都是一半。</p>
</div>
<div class="tab-pane" data-pane="c4" hidden>
  <div class="calc" data-calc="pillar">
    <label>每柱號碼數（逗號分隔，例如 3,3,2） <input type="text" data-cols value="3,3,2"></label>
    <label>幾星 <select data-k><option value="2">二星</option><option value="3">三星</option><option value="4">四星</option></select></label>
    <label>每碰單價（元，自己填） <input type="number" data-price value="100" min="1"></label>
    <div class="calc-out" aria-live="polite"></div>
  </div>
  <p>立柱＝把號碼分成幾柱，只算「跨柱」的組合，同一柱裡的號碼不互碰。二星碰數＝每兩柱號碼數相乘再加總；三星＝每三柱相乘加總，以此類推。解釋見 <a href="/lotto/underground-pillars">立柱與柱碰</a>。</p>
</div>
<div class="disclaimer-box">本頁只提供數學計算。地下簽賭在台灣違法（刑法第 266、268 條），本站不提供、不介紹、不連結任何投注管道，也不鼓勵參與。</div>`;
}
