// SEO 月報：GSC（28 天曝光／點擊／前 20 查詢／前 20 頁、sitemap 狀態）＋ GA4（28 天事件、ad_click 分產品與版位、回訪）→ docs/SEO-REPORT-YYYYMM.md
//   node scripts/seo-report.mjs            （寫檔＋印摘要）
//   資料來源：dulcet SA（GSC siteOwner；GA4 資源 properties/533922574 檢視者，2026-10-04 Travis 開通）
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const KEY = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude/credentials/gcp-dns/dulcet-elevator-296603-b5bff2b97eb7.json'), 'utf8'));
const SITE = 'sc-domain:rtp96.com', PROP = 'properties/533922574';
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token(scope) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: KEY.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.sign('RSA-SHA256', Buffer.from(unsigned), KEY.private_key).toString('base64url');
  const j = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` })).json();
  if (!j.access_token) throw new Error('拿不到 token ' + JSON.stringify(j)); return j.access_token;
}
const T = await token('https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly');
const H = { Authorization: 'Bearer ' + T, 'content-type': 'application/json' };
const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const gsc = async (body) => (await (await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, { method: 'POST', headers: H, body: JSON.stringify({ startDate: d(28), endDate: d(1), ...body }) })).json()).rows || [];
const ga = async (body) => (await (await fetch(`https://analyticsdata.googleapis.com/v1beta/${PROP}:runReport`, { method: 'POST', headers: H, body: JSON.stringify({ dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }], ...body }) })).json());

const total = (await gsc({ dimensions: [] }))[0] || { impressions: 0, clicks: 0, position: 0 };
const prev = (await (await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, { method: 'POST', headers: H, body: JSON.stringify({ startDate: d(56), endDate: d(29) }) })).json()).rows?.[0] || { impressions: 0, clicks: 0 };
const queries = await gsc({ dimensions: ['query'], rowLimit: 20 });
const pages = await gsc({ dimensions: ['page'], rowLimit: 20 });
const sm = await (await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps`, { headers: H })).json();
const ev = await ga({ dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], limit: 30 });
const ad = await ga({ dimensions: [{ name: 'customEvent:product' }, { name: 'customEvent:slot' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'ad_click' } } }, limit: 50 });
const users = await ga({ dimensions: [{ name: 'newVsReturning' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'engagedSessions' }] });
const row = (r, k) => r.rows?.map(x => `| ${x.dimensionValues.map(v => v.value).join(' | ')} | ${x.metricValues.map(v => v.value).join(' | ')} |`).join('\n') || `| （${k}） |`;
const ym = new Date().toISOString().slice(0, 7).replace('-', '');
const md = `# rtp96 SEO 月報 ${ym}（產出 ${new Date().toISOString().slice(0, 10)}）

## GSC（${d(28)}～${d(1)}，對照前 28 天）
| 指標 | 本期 | 前期 |
|---|---|---|
| 曝光 | ${total.impressions} | ${prev.impressions} |
| 點擊 | ${total.clicks} | ${prev.clicks} |
| 平均排名 | ${(total.position || 0).toFixed(1)} | — |

sitemap：${(sm.sitemap || []).map(s => `${s.path} 提交 ${s.lastSubmitted?.slice(0, 10)} 下載 ${s.lastDownloaded?.slice(0, 10)} 錯誤 ${s.errors} 筆數 ${s.contents?.map(c => c.submitted + '/' + c.indexed).join(',')}`).join('；') || '無'}

### 前 20 查詢
| 查詢 | 點擊 | 曝光 | 排名 |
|---|---|---|---|
${queries.map(q => `| ${q.keys[0]} | ${q.clicks} | ${q.impressions} | ${q.position.toFixed(1)} |`).join('\n') || '| （無） |'}

### 前 20 頁
| 頁 | 點擊 | 曝光 | 排名 |
|---|---|---|---|
${pages.map(q => `| ${q.keys[0].replace('https://www.rtp96.com', '')} | ${q.clicks} | ${q.impressions} | ${q.position.toFixed(1)} |`).join('\n') || '| （無） |'}

## GA4（最近 28 天，${PROP}）
| 新／回訪 | 活躍使用者 | 工作階段 | 互動工作階段 |
|---|---|---|---|
${row(users, '無')}

### 事件
| 事件 | 次數 |
|---|---|
${row(ev, '無')}

### 廣告點擊 ad_click（產品 × 版位）
| 產品 | 版位 | 次數 |
|---|---|---|
${row(ad, '本期 0 次；10-04 才上線')}

> 落地頁對話數（cs.wii789.com 站 ads）要從客服中心資料庫看，下一版接進來。
`;
fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', `SEO-REPORT-${ym}.md`), md);
console.log(md.split('\n').slice(0, 12).join('\n')); console.log(`… 已寫 docs/SEO-REPORT-${ym}.md`);
