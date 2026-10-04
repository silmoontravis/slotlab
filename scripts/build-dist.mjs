// 把要上線的檔案複製到 dist/（只放網站本體，不放 docs／scripts／QA 截圖／python 腳本），再用 wrangler pages deploy dist
//   node scripts/build-dist.mjs
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'dist');
const dirs = ['blog', 'casinos', 'guides', 'images', 'js', 'rtp', 'slots', 'functions'];
const files = ['index.html', 'about.html', 'style.css', 'robots.txt', 'sitemap.xml'];
const skipImg = /^(logo_combo_\d|logo_final_\d|new-template|old-template|qa_).*\.png$/;   // 設計稿與 QA 截圖不上線
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
let n = 0;
function copy(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copy(s, d); }
    else if (!skipImg.test(e.name)) { fs.copyFileSync(s, d); n++; }
  }
}
for (const d of dirs) { fs.mkdirSync(path.join(OUT, d), { recursive: true }); copy(path.join(ROOT, d), path.join(OUT, d)); }
for (const f of files) { fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f)); n++; }
const html = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? html(path.join(d, e.name)) : e.name.endsWith('.html') ? 1 : 0), 0);
console.log(`dist：${n} 檔，HTML ${html(OUT)} 頁`);
