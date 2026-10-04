// 用 dulcet SA（siteOwner）把 sitemap 重新提交給 GSC，並印回 sitemap 狀態（memory reference_taiwanlottery_api_and_gsc_access）
//   node scripts/gsc-sitemap-submit.mjs
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
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` });
  const j = await r.json(); if (!j.access_token) throw new Error('拿不到 token ' + JSON.stringify(j)); return j.access_token;
}
const T = await token('https://www.googleapis.com/auth/webmasters');
const H = { Authorization: 'Bearer ' + T };
const SM = 'https://www.rtp96.com/sitemap.xml';
for (const site of ['sc-domain:rtp96.com', 'https://www.rtp96.com/']) {
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(SM)}`;
  const put = await fetch(base, { method: 'PUT', headers: H });
  const get = await fetch(base, { headers: H }); const j = await get.json();
  console.log(site, 'submit', put.status, '| lastSubmitted', j.lastSubmitted, '| lastDownloaded', j.lastDownloaded, '| errors', j.errors, '| contents', JSON.stringify(j.contents));
}
