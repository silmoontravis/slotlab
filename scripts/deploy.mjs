// 部署：build → migrate-diff（有差異就停）→ wrangler pages deploy dist（正式分支 main）→ 重交 sitemap 給 GSC
//   node scripts/deploy.mjs            需要 ~/.claude/credentials/rtp96-pages.env（CF_ACCOUNT_ID／CF_PAGES_TOKEN）與 PATH 裡的 wrangler（或環境變數 WRANGLER 指到執行檔）
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(os.homedir(), '.claude/credentials/rtp96-pages.env'), 'utf8').split(/\r?\n/).filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const run = (cmd, args, extra = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: env.CF_ACCOUNT_ID, CLOUDFLARE_API_TOKEN: env.CF_PAGES_TOKEN, ...extra } });
run('node', ['build.mjs']);
if (fs.existsSync(path.join(ROOT, 'docs/url-inventory.json'))) run('node', ['scripts/migrate-diff.mjs']);
run(process.env.WRANGLER || 'wrangler', ['pages', 'deploy', 'dist', '--project-name=' + (env.CF_PAGES_PROJECT || 'rtp96'), '--branch=main', '--commit-dirty=true']);
run('node', ['scripts/gsc-sitemap-submit.mjs']);
