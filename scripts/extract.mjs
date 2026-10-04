// P1 遷移第一步：舊的手寫 HTML（repo＝線上內容）→ content/posts/<id>.md（front-matter＋正文 HTML 原樣）、content/pages/about.md、content/site.json 的分類頁文案
//   node scripts/extract.mjs
//   正文保留原 HTML（不轉 Markdown，零失真）；只做三件事：拿掉會由模板重生的「相關文章」區塊、內連去 .html、相對路徑改絕對
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';
import matter from 'gray-matter';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const OUT = path.join(ROOT, 'content');
const SITE = 'https://www.rtp96.com';
const CATS = { slots: '老虎機', casinos: '娛樂城', guides: '攻略', rtp: 'RTP' };
const PILL_TO_CAT = { '老虎機': 'slots', '娛樂城': 'casinos', '攻略': 'guides', 'RTP': 'rtp', 'RTP分析': 'rtp', 'RTP 分析': 'rtp' };
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/url-inventory.json'), 'utf8'));
const fillerSet = new Set(inventory.filter(x => x.filler).map(x => x.file));

const noExt = (u) => u.replace(/\/index\.html$/, '/').replace(/\.html(?=$|[#?])/, '');
/** 連結／圖片路徑正規化：相對（../、./、無斜線開頭）→ 以該頁所在目錄解析成絕對；站內 .html 去掉 */
function absUrl(href, pageDir) {
  if (!href || /^(https?:|mailto:|tel:|#|data:)/.test(href)) return href;
  let u = href;
  if (!u.startsWith('/')) u = path.posix.normalize(path.posix.join(pageDir, u));
  return noExt(u);
}
function normalizeBody($, root, pageDir) {
  root.find('a[href]').each((_, a) => { const h = $(a).attr('href'); const n = absUrl(h, pageDir); if (n !== h) $(a).attr('href', n); });
  root.find('img[src]').each((_, i) => { const s = $(i).attr('src'); const n = absUrl(s, pageDir); if (n !== s) $(i).attr('src', n); });
  // 內連文字正規化：Travis 10-03 定 canonical 無副檔名，正文的站內連結一律同格式
}
const slugify = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60);

fs.mkdirSync(path.join(OUT, 'posts'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });
// 先掃列表頁，收每篇的摘要（列表卡片上的那句，跟 description 不一定一樣）
const excerpt = {};
for (const f of ['index.html', 'blog/index.html', 'slots/index.html', 'casinos/index.html', 'guides/index.html', 'rtp/index.html']) {
  const dir = path.posix.dirname('/' + f);
  const $ = cheerio.load(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  $('.post-item, .blog-card').each((_, el) => {
    const href = absUrl($(el).attr('href'), dir); const ex = $(el).find('.post-excerpt, .blog-excerpt').first().text().trim();
    if (href && ex && !excerpt[href]) excerpt[href] = ex;
  });
}

const posts = []; let n = 0;
for (const dir of ['blog/posts', 'slots', 'casinos', 'guides', 'rtp']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(x => x.endsWith('.html') && x !== 'index.html').sort()) {
    const file = `/${dir}/${f}`, pageDir = `/${dir}`; const html = fs.readFileSync(path.join(ROOT, dir, f), 'utf8');
    const $ = cheerio.load(html);
    const title = ($('title').text() || '').replace(/\s*\|\s*大衛の電子攻略站\s*$/, '').trim();
    const h1 = $('.article-header h1').first().text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const published = $('meta[property="article:published_time"]').attr('content') || '';
    const pillText = $('.article-header .cat-pill').first().text().trim();
    const pillClass = ($('.article-header .cat-pill').first().attr('class') || '').match(/cat-(slots|casinos|guides|rtp)/)?.[1];
    const category = pillClass || PILL_TO_CAT[pillText] || (dir === 'blog/posts' ? 'guides' : dir);
    const permalink = noExt(file);
    // JSON-LD
    let ld = {}; $('script[type="application/ld+json"]').each((_, s) => { try { const j = JSON.parse($(s).text()); if (j['@type'] === 'Article') ld = j; } catch { } });
    // 作者列：initPage 腳本裡的 renderAuthor('2026-04-13', '6 min read')
    const au = /renderAuthor\('([^']*)',\s*'([^']*)'\)/.exec(html);
    const date = ld.datePublished || published || au?.[1] || '';
    const updated = ld.dateModified || date;
    const readTime = parseInt((au?.[2] || '').replace(/\D/g, ''), 10) || Math.max(3, Math.round($('.article-content').text().replace(/\s+/g, '').length / 400));
    // 麵包屑第二層：部落格 or 分類
    const crumb = /label:\s*'部落格'/.test(html) ? 'blog' : 'category';
    // 相關文章（人工挑的）：記下連結，模板重生
    const related = []; $('.article-content .related-posts a[href]').each((_, a) => related.push(absUrl($(a).attr('href'), pageDir)));
    $('.article-content .related-posts').remove();
    // 目錄：舊頁手寫的 toc-list（之後由 h2 自動生；這裡只記下來給 diff 比對用）
    const toc = []; $('.toc-sidebar .toc-list a').each((_, a) => toc.push({ href: $(a).attr('href'), text: $(a).text().trim() }));
    const body = $('.article-content'); normalizeBody($, body, pageDir);
    // h2 沒 id 的補 id（目錄要用）
    const seen = new Set(); body.find('h2').each((i, h) => { let id = $(h).attr('id'); if (!id) { id = slugify($(h).text()) || `h2-${i + 1}`; } let k = id, c = 2; while (seen.has(k)) k = `${id}-${c++}`; seen.add(k); $(h).attr('id', k); });
    const bodyHtml = body.html().trim().replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/^ {8}/, '')).join('\n');
    let id = path.basename(f, '.html'); if (posts.some(p => p.id === id)) id = (dir === 'blog/posts' ? 'blog-' : dir + '-') + id;   // 同名（guides/slot-myths-debunked 與 blog/posts/slot-myths-debunked）：後者加前綴，permalink 不變
    const fm = {
      id, permalink, title, category, crumb, tags: [], date, updated, description, ...(ogDescription && ogDescription !== description ? { ogDescription } : {}),
      excerpt: excerpt[permalink] || description, readTime, image: '', sources: [], related, status: 'published', legacy: true,
      ...(fillerSet.has(file) ? { filler: true } : {}), ...(h1 && h1 !== title ? { h1 } : {}), ...(toc.length ? { tocLegacy: toc } : {}), ...(ld.description && ld.description !== description ? { ldDescription: ld.description } : {}),
    };
    fs.writeFileSync(path.join(OUT, 'posts', id + '.md'), matter.stringify('\n' + bodyHtml + '\n', fm));
    posts.push({ id, permalink, category, date, file }); n++;
  }
}
// 關於頁
{
  const $ = cheerio.load(fs.readFileSync(path.join(ROOT, 'about.html'), 'utf8'));
  const body = $('.about-page'); normalizeBody($, body, '/');
  fs.writeFileSync(path.join(OUT, 'pages', 'about.md'), matter.stringify('\n' + body.html().trim() + '\n', {
    id: 'about', permalink: '/about', title: ($('title').text() || '').replace(/\s*\|\s*大衛の電子攻略站\s*$/, '').trim(), description: $('meta[name="description"]').attr('content') || '', template: 'page', legacy: true,
  }));
}
// 分類頁與首頁文案 → site.json（只寫一次；已存在就不覆蓋，避免蓋掉人工改的）
const sitePath = path.join(OUT, 'site.json');
if (!fs.existsSync(sitePath)) {
  const cats = {};
  for (const c of Object.keys(CATS)) { const $ = cheerio.load(fs.readFileSync(path.join(ROOT, c, 'index.html'), 'utf8')); cats[c] = { label: CATS[c], title: $('.category-hero h1').text().trim(), intro: $('.category-hero p').text().trim(), pageTitle: ($('title').text() || '').replace(/\s*\|\s*大衛の電子攻略站\s*$/, '').trim(), description: $('meta[name="description"]').attr('content') || '' }; }
  const $h = cheerio.load(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  const $b = cheerio.load(fs.readFileSync(path.join(ROOT, 'blog/index.html'), 'utf8'));
  const featured = []; $h('.section').last().find('.post-item').each((_, a) => featured.push(noExt('/' + String($h(a).attr('href') || '').replace(/^(\.\/|\/)/, ''))));
  fs.writeFileSync(sitePath, JSON.stringify({
    name: '大衛の電子攻略站', url: SITE, tagline: '用數據拆解博弈', author: '大衛 (David)', ga: 'G-WD5D746KC6',
    home: { title: $h('title').text().trim(), description: $h('meta[name="description"]').attr('content') || '', h1: $h('.blog-intro h1').text().trim(), intro: $h('.blog-intro p').text().trim() },
    blog: { title: $b('title').text().trim(), description: $b('meta[name="description"]').attr('content') || '', h1: $b('.blog-intro h1').text().trim(), intro: ($b('.blog-intro p').first().text() || '').replace(/\s*·\s*共.*$/, '').trim() },
    categories: cats, featured, nav: [{ href: '/', label: '首頁', id: 'home' }, { href: '/slots/', label: '老虎機', id: 'slots' }, { href: '/casinos/', label: '娛樂城', id: 'casinos' }, { href: '/guides/', label: '攻略', id: 'guides' }, { href: '/rtp/', label: 'RTP', id: 'rtp' }, { href: '/about', label: '關於大衛', id: 'about' }],
    accent: { slots: 'amber', casinos: 'blue', guides: 'green', rtp: 'purple' },
    footer: { blurb: '一個軟體工程師的老虎機研究筆記。用 Python 跑數據、用機率論看遊戲，純粹好奇心驅動。所有內容僅供教育與娛樂用途。', picks: [{ href: '/guides/beginner-complete-guide', label: '入門指南' }, { href: '/slots/what-is-rtp', label: 'RTP 是什麼' }, { href: '/about', label: '關於大衛' }] },
    sidebarPicks: [{ href: '/guides/beginner-complete-guide', label: '新手完整入門指南' }, { href: '/slots/what-is-rtp', label: 'RTP 到底是什麼？' }, { href: '/slots/top-10-slots-2026', label: '2026 十大推薦機台' }, { href: '/rtp/rtp-myths', label: 'RTP 五大迷思破解' }, { href: '/slots/high-volatility-guide', label: '高波動 vs 低波動' }],
  }, null, 2));
}
const byCat = posts.reduce((a, p) => (a[p.category] = (a[p.category] || 0) + 1, a), {});
console.log(`抽出 ${n} 篇 → content/posts/；分類數 ${JSON.stringify(byCat)}；about、site.json 已寫`);
