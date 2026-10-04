// 真閱讀計數（docs/ARCHITECTURE.md §2.5）：D1 一列一篇，GET 回 {views}，POST +1。不預灌、不乘倍。
//   綁定：wrangler.toml [[d1_databases]] binding = "VIEWS"（資料庫 rtp96-views，表 views(id TEXT PRIMARY KEY, n INTEGER, updated_at TEXT)）
//   id 只收文章 id 格式（小寫英數連字號，≤80），其他 400；同一個瀏覽器 session 內前端只 POST 一次（site.js 用 sessionStorage）
const OK = (o, { status = 200 } = {}) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const valid = (id) => /^[a-z0-9][a-z0-9-]{0,79}$/.test(id);

export async function onRequestGet({ params, env }) {
  const id = params.id; if (!valid(id)) return OK({ error: 'bad id' }, { status: 400 });
  if (!env.VIEWS) return OK({ views: null, error: 'no binding' });
  const row = await env.VIEWS.prepare('SELECT n FROM views WHERE id = ?').bind(id).first();
  return OK({ views: row ? row.n : 0 });
}
export async function onRequestPost({ params, env, request }) {
  const id = params.id; if (!valid(id)) return OK({ error: 'bad id' }, { status: 400 });
  if (!env.VIEWS) return OK({ views: null, error: 'no binding' });
  // 只收自家站來的（防外站灌）：Origin 或 Referer 要是 rtp96.com
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  if (!/^https:\/\/(www\.)?rtp96\.com(\/|$)/.test(origin) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(origin)) return OK({ error: 'origin' }, { status: 403 });
  const r = await env.VIEWS.prepare("INSERT INTO views(id, n, updated_at) VALUES(?, 1, datetime('now')) ON CONFLICT(id) DO UPDATE SET n = n + 1, updated_at = datetime('now') RETURNING n").bind(id).first();
  return OK({ views: r ? r.n : 1 });
}
