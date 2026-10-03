// P0 基準：全站 URL 清冊（sitemap 覆蓋、canonical 一致、填充文、日期），輸出 docs/url-inventory.json
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(ROOT).filter(f => f.endsWith('.html') && !f.includes('node_modules') && !f.includes(`${path.sep}docs${path.sep}`) && !f.includes(`${path.sep}dist${path.sep}`));
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const norm = u => u.replace('https://www.rtp96.com', '').replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '/');
const inSm = new Set([...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => norm(m[1])));
const rows = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = '/' + path.relative(ROOT, f).split(path.sep).join('/');
  const u = norm(rel);
  const canon = (s.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
  const title = (s.match(/<title>(.*?)<\/title>/s) || [])[1] || '';
  const desc = (s.match(/name="description" content="([^"]*)"/) || [])[1] || '';
  rows.push({
    file: rel, url: u,
    inSitemap: inSm.has(u),
    canonical: canon, canonMismatch: !!canon && norm(canon) !== u, noCanonical: !canon,
    filler: /在這篇文章中，我們將從數據分析的角度/.test(s),
    draft: rel.includes('/drafts/'),
    date: (s.match(/renderAuthor\('([0-9-]+)'/) || [])[1] || '',
    titleLen: title.length, descLen: desc.length, title,
    h1: (s.match(/<h1[^>]*>(.*?)<\/h1>/s) || [])[1]?.replace(/<[^>]+>/g, '').trim() || '',
    words: s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, '').length,
    extLinks: (s.match(/href="https?:\/\/(?!www\.rtp96\.com)/g) || []).length,
    noExtLinks: (s.match(/href="\/[a-z]+\/[a-z0-9-]+"/g) || []).length,
  });
}
const c = k => rows.filter(r => r[k]).length;
const pub = rows.filter(r => !r.draft);
console.log(`HTML 總數 ${rows.length}（草稿 ${c('draft')}，公開 ${pub.length}）`);
console.log(`sitemap 收錄 ${pub.filter(r => r.inSitemap).length}/${pub.length}；草稿被收進 sitemap ${rows.filter(r => r.draft && r.inSitemap).length}`);
console.log(`canonical 缺 ${pub.filter(r => r.noCanonical).length}；canonical 跟實際 URL 不一致 ${pub.filter(r => r.canonMismatch).length}（大多是 .html vs 無副檔名）`);
console.log(`填充文 ${c('filler')}；title>60 ${pub.filter(r => r.titleLen > 60).length}；description 缺 ${pub.filter(r => !r.descLen).length}；H1 缺 ${pub.filter(r => !r.h1).length}`);
console.log(`內文 <1500 字 ${pub.filter(r => r.words < 1500).length}；日期範圍 ${pub.map(r => r.date).filter(Boolean).sort()[0]} ~ ${pub.map(r => r.date).filter(Boolean).sort().at(-1)}`);
console.log('不在 sitemap 的公開頁：', pub.filter(r => !r.inSitemap).map(r => r.url).join(', '));
fs.writeFileSync(path.join(ROOT, 'docs/url-inventory.json'), JSON.stringify(rows, null, 1));
