// 每期快報、按月總表、台彩新聞區塊（2026-10-04 Travis：把台彩最新新聞／時事當搜尋關鍵字帶進來）
//   快報標題就是搜尋詞：彩種＋日期＋號碼＋頭獎結果（連 N 摃、累積幾億、開出幾注）
import { esc } from './index.mjs';
import { ball, freshness } from './lotto.mjs';

const pad2 = (n) => String(n).padStart(2, '0');
const fmt = (n) => n == null ? '—' : Number(n).toLocaleString('zh-TW');
const md = (d) => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`;
const yuan = (n) => n >= 1e8 ? `${(n / 1e8).toFixed(n % 1e8 ? 1 : 0)} 億` : n >= 1e4 ? `${Math.round(n / 1e4).toLocaleString('zh-TW')} 萬` : fmt(n);
const jackpotOf = (x) => (x.prizes || []).find(p => /jackpot/i.test(p.tier));
const tbl = (head, rows) => `<div class="lt-scroll"><table class="lt-table"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const jackCell = (x) => { const j = jackpotOf(x); return j ? (j.winners ? `${j.winners} 注 × ${fmt(j.perPrize)}` : '摃龜') : '—'; };
const ballsOf = (x) => `<span class="balls">${x.numbers.map(n => ball(n)).join('')}${x.special != null ? ball(x.special, true) : ''}</span>`;
const tierName = (g, t) => { for (const [k, v] of Object.entries(g.tiers)) if (t === k || t.endsWith(k) || t.toLowerCase().endsWith(k.toLowerCase())) return v; return t; };

/** 連摃：到第 i 期為止（含）頭獎連續沒人中的期數 */
export function streak(g, i) { let n = 0; for (let k = i; k >= 0; k--) { const j = jackpotOf(g.draws[k]); if (j && j.winners === 0) n++; else break; } return n; }
export const drawPath = (g, x) => `/lotto/draws/${g.id}/${x.drawDate}`;
export const monthPath = (g, ym) => `/lotto/draws/${g.id}/${ym}`;
export function drawTitle(g, i) {
  const x = g.draws[i], j = jackpotOf(x); const nums = x.numbers.map(pad2).join('、') + (x.special != null ? `，${g.special} ${pad2(x.special)}` : '');
  const tail = j ? (j.winners ? `頭獎開出 ${j.winners} 注，每注 ${yuan(j.perPrize)}` : `頭獎${j.prize ? `本期 ${yuan(j.prize)} 無人中、` : ''}連 ${streak(g, i)} 摃${j.prize ? '，併入下期累積' : `，下期頭獎 ${yuan(j.perPrize || 0)}`}`) : '';
  return `${g.name} ${md(x.drawDate)} 開獎號碼：${nums}｜${tail}`;
}
export function drawPage(g, i, site, news) {
  const x = g.draws[i], prev = g.draws[i - 1], j = jackpotOf(x); const s = streak(g, i);
  const same = prev ? x.numbers.filter(n => prev.numbers.includes(n)) : [];
  const sorted = [...x.numbers].sort((a, b) => a - b); const runs = []; for (let k = 1; k < sorted.length; k++) if (sorted[k] === sorted[k - 1] + 1) runs.push(`${pad2(sorted[k - 1])}-${pad2(sorted[k])}`);
  const odd = x.numbers.filter(n => n % 2).length, big = x.numbers.filter(n => n > g.max / 2).length, sum = x.numbers.reduce((a, b) => a + b, 0), mean = Math.round(g.pick * (g.max + 1) / 2);
  const last30 = g.draws.slice(Math.max(0, i - 30), i); const cnt = {}; for (const d of last30) for (const n of d.numbers) cnt[n] = (cnt[n] || 0) + 1;
  const hotNote = x.numbers.map(n => `${pad2(n)}（近 30 期開 ${cnt[n] || 0} 次）`).join('、');
  const fr = freshness(g); const nextDate = i === g.draws.length - 1 ? fr.next : g.draws[i + 1].drawDate;
  const recent = g.draws.slice(Math.max(0, i - 5), i).reverse();
  const consecProb = g.id === 'lotto649' ? '49.5' : g.id === 'superlotto638' ? '59.9' : '43.6';
  return `
<p class="lt-kicker">${esc(g.name)} 第 ${x.period} 期 · ${x.drawDate}（週${['日', '一', '二', '三', '四', '五', '六'][new Date(x.drawDate + 'T12:00:00+08:00').getDay()]}） · ${esc(g.dayText)}</p>
<div class="balls big">${x.numbers.map(n => ball(n)).join('')}${x.special != null ? `<span class="plus">＋</span>${ball(x.special, true)}` : ''}</div>
<p class="lt-meta">開出順序：${x.appearOrder.map(pad2).join(' → ')}${g.special ? `　|　${g.special}：${pad2(x.special)}` : ''}　|　銷售額 ${fmt(x.sales)} 元</p>
<h2 id="prizes">各獎項中獎注數與獎金</h2>
${tbl(['獎項', '中獎注數', '每注獎金'], (x.prizes || []).map(p => [tierName(g, p.tier), fmt(p.winners), p.perPrize ? fmt(p.perPrize) + ' 元' : (p.winners ? '—' : '無人中獎')]))}
<p>${j ? (j.winners ? `這期頭獎開出 <strong>${j.winners} 注</strong>，每注 <strong>${fmt(j.perPrize)} 元</strong>${j.winners > 1 ? '（多人分，所以每注比獎池少）' : ''}。` : `這期頭獎<strong>沒人中</strong>${j.prize ? `，本期分配到頭獎的 <strong>${fmt(j.prize)} 元</strong>併入下期累積（累積總額與保證金額以台彩公告為準）` : `（${g.name}頭獎固定 ${fmt(j.perPrize)} 元，不累積）`}；算上這期已經<strong>連 ${s} 摃</strong>。`) : ''}下期開獎 <strong>${nextDate}</strong>，想對自己的號碼用 <a href="/lotto/${g.slug}#check">對獎器</a>。</p>
<h2 id="pattern">這期號碼長什麼樣</h2>
<ul>
  <li>跟上一期（${prev ? prev.drawDate : '—'}）重複的號碼：${same.length ? same.map(pad2).join('、') : '沒有'}。</li>
  <li>連號：${runs.length ? runs.join('、') : '沒有'}（${g.name}一期內出現連號的理論機率約 ${consecProb}%，見 <a href="/lotto/consecutive-numbers-how-often">連號多常出現</a>）。</li>
  <li>奇偶 ${odd}:${g.pick - odd}、大小 ${big}:${g.pick - big}（以 ${Math.ceil(g.max / 2)} 為界）、和值 ${sum}（理論平均 ${mean}）。這些只是描述，不是預測，理由在 <a href="/lotto/odd-even-big-small-patterns">奇偶大小那篇</a>。</li>
  <li>近 30 期出現次數：${hotNote}。冷熱沒有預測力，我用全部歷史回測過：<a href="/lotto/hot-cold-numbers-do-they-work">冷熱號有沒有用</a>。</li>
</ul>
<div class="david-note">每期快報是我的程式從台彩官方 API 抓資料後自動排版的，數字跟官網一致、沒有人手改。我不報明牌，這頁只告訴你開了什麼、獎金去哪了、下期什麼時候。</div>
<h2 id="recent">前五期</h2>
${tbl(['期別', '開獎日', '號碼', '頭獎'], recent.map(r => [`<a href="${drawPath(g, r)}">${r.period}</a>`, r.drawDate, ballsOf(r), jackCell(r)]))}
<p class="lt-more">本月全部：<a href="${monthPath(g, x.drawDate.slice(0, 7))}">${g.name} ${+x.drawDate.slice(0, 4)} 年 ${+x.drawDate.slice(5, 7)} 月開獎總表</a>　|　<a href="/lotto/${g.slug}">${g.name}冷熱號、遺漏值與對獎器</a>　|　<a href="/lotto/${g.id}-how-to-play">${g.name}玩法與中獎機率</a></p>
${news ? newsBlock(news, g.name) : ''}`;
}
export function monthPage(g, ym, list, months) {
  const idx = months.indexOf(ym); const prevYm = months[idx + 1], nextYm = months[idx - 1];
  const cnt = {}; for (const d of list) for (const n of d.numbers) cnt[n] = (cnt[n] || 0) + 1;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 5);
  const hits = list.filter(d => jackpotOf(d)?.winners > 0);
  return `
<p>${g.name} ${+ym.slice(0, 4)} 年 ${+ym.slice(5, 7)} 月共開 ${list.length} 期，頭獎開出 ${hits.length} 期${hits.length ? `（${hits.map(d => `${md(d.drawDate)} ${jackpotOf(d).winners} 注`).join('、')}）` : ''}。這個月出現最多的號碼：${top.map(([n, c]) => `${pad2(+n)}（${c} 次）`).join('、')}。資料來源台彩官方 API，由程式自動整理。</p>
${tbl(['期別', '開獎日', '號碼', '頭獎', '銷售額'], list.slice().reverse().map(x => [x.period, `<a href="${drawPath(g, x)}">${x.drawDate}</a>`, ballsOf(x), jackCell(x), fmt(x.sales)]))}
<p class="lt-more">${prevYm ? `<a href="${monthPath(g, prevYm)}">← ${+prevYm.slice(0, 4)} 年 ${+prevYm.slice(5, 7)} 月</a>` : ''}　${nextYm ? `<a href="${monthPath(g, nextYm)}">${+nextYm.slice(0, 4)} 年 ${+nextYm.slice(5, 7)} 月 →</a>` : ''}　|　<a href="/lotto/draws/${g.id}/">全部月份</a>　|　<a href="/lotto/${g.slug}">${g.name}冷熱號與對獎器</a></p>`;
}
export function archiveIndex(g, months) {
  const byYear = {}; for (const m of months) (byYear[m.slice(0, 4)] ||= []).push(m);
  return `<p>${g.name}從 ${g.draws[0].drawDate} 到 ${g.draws[g.draws.length - 1].drawDate} 共 ${fmt(g.draws.length)} 期，按月整理。每一期的號碼、各獎項注數與獎金、銷售額都在，點月份進去看。</p>
${Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0])).map(([y, ms]) => `<h2 id="y${y}">${y} 年</h2><p class="lt-months">${ms.map(m => `<a href="${monthPath(g, m)}">${+m.slice(5, 7)} 月</a>`).join('　')}</p>`).join('')}`;
}
/** 最近幾期快報的連結清單（放工具頁與專區首頁） */
export function recentDrawLinks(g, n = 8) {
  const list = g.draws.slice(-n).reverse();
  return `<ul class="lt-draws">${list.map(x => `<li><a href="${drawPath(g, x)}">${drawTitle(g, g.draws.indexOf(x))}</a></li>`).join('')}</ul><p class="lt-more"><a href="/lotto/draws/${g.id}/">${g.name}歷史開獎總表（按月）→</a></p>`;
}
/** 台彩動態：新聞標題（外連、nofollow）。標題本身就是時事關鍵字（加碼、連摃、幾億） */
export function newsBlock(news, filter) {
  const items = (news?.items || []).filter(n => !filter || n.title.includes(filter) || /台彩|彩券/.test(n.title)).slice(0, 8);
  if (!items.length) return '';
  return `<section class="lt-news"><h2 id="news">台彩動態（各家媒體最近報導）</h2><ul>${items.map(n => `<li><a href="${esc(n.link)}" rel="nofollow noopener" target="_blank">${esc(n.title)}</a><span>${esc(n.source)} · ${n.date.slice(5, 10)}</span></li>`).join('')}</ul><p class="muted">標題來自各媒體（Google 新聞），點了會離開本站；我只負責把開獎數字算對。</p></section>`;
}
