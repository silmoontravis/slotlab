// Cloudflare Pages Function：rtp96.com（沒有 www）一律 301 到 www.rtp96.com，網址其餘部分照舊
//   為什麼不用 _redirects：Pages 的 _redirects 不支援帶主機名的來源（官方文件「Domain-level redirects ❌」），而手上的 Cloudflare token 只有 Pages／DNS 權限，加不了 zone 的轉址規則
//   其餘請求原樣交給靜態檔（next()），不做任何改寫
export async function onRequest({ request, next }) {
  const u = new URL(request.url);
  if (u.hostname === 'rtp96.com') { u.hostname = 'www.rtp96.com'; return Response.redirect(u.toString(), 301); }
  return next();
}
