// 用 dulcet SA 驗 GA4 存取：列出看得到的資源（Admin API），再拉 rtp96 資源最近 28 天的工作階段與 ad_click 事件（Data API）
//   node scripts/ga4-check.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const KEY = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude/credentials/gcp-dns/dulcet-elevator-296603-b5bff2b97eb7.json'), 'utf8'));
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
async function token(scope) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: KEY.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.sign('RSA-SHA256', Buffer.from(unsigned), KEY.private_key).toString('base64url');
  const j = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` })).json();
  if (!j.access_token) throw new Error('拿不到 token ' + JSON.stringify(j)); return j.access_token;
}
const H = { Authorization: 'Bearer ' + await token('https://www.googleapis.com/auth/analytics.readonly'), 'content-type': 'application/json' };
const sum = await (await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', { headers: H })).json();
if (sum.error) { console.log('Admin API：', sum.error.code, sum.error.message.slice(0, 200)); }
const props = (sum.accountSummaries || []).flatMap(a => (a.propertySummaries || []).map(p => ({ account: a.displayName, property: p.property, name: p.displayName })));
console.log('看得到的資源：', JSON.stringify(props));
const target = process.argv[2] || props.find(p => /rtp96/i.test(p.name))?.property;
if (!target) { console.log('沒有 rtp96 的資源（SA 還沒加進 GA，或 Admin API 沒開）'); process.exit(1); }
const body = { dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }], dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }, { name: 'sessions' }], limit: 20 };
const r = await (await fetch(`https://analyticsdata.googleapis.com/v1beta/${target}:runReport`, { method: 'POST', headers: H, body: JSON.stringify(body) })).json();
if (r.error) { console.log('Data API：', r.error.code, r.error.message.slice(0, 300)); process.exit(1); }
console.log(target, '最近 28 天事件：'); for (const row of r.rows || []) console.log('  ', row.dimensionValues[0].value, row.metricValues[0].value);
