# rtp96.com（大衛の電子攻略站）架構整理版 v2

> 2026-10-03 Maki。v1 經 Codex PM 審查後改版；P0 基準見 `docs/P0-BASELINE.md`。目標：**把 SEO 做起來**，順序是「被索引 → 內容站得住 → 持續發文 → 看 GSC 調」。

## 0. 已拍板（Travis 2026-10-03，含採納 Codex 的兩項修正）

| 項目 | 決定 |
|---|---|
| 站定位 | 從「老虎機」擴成「用數據拆解博弈」：老虎機／樂透／娛樂城／RTP |
| 新專區 | `/lotto/`：台彩玩法、數據分析（含冷熱號）、地下簽賭術語解說 |
| 地下簽賭尺度 | 術語與玩法全講（二三四星、台號、車、包牌、賠率、退水、層級），**不教參與、不提任何站或管道**，每篇附免責 |
| 程式架構 | 靜態產生器：Markdown＋front-matter → `build.mjs` → `dist/` |
| 閱讀人數 | **真計數歸真計數**（Durable Object）；熱門用「編輯推薦」標籤人工挑，不灌數字 |
| 文章日期 | **用實際發布日期**，不回填 |
| 舊文 | 30 篇填充文一次全重寫，但先審 3 篇代表稿校準，再批量 |
| SEO 自動化 | 不做每日換 meta keywords（對排名零效果）。做：開獎資料更新、每週 AI 草稿人審、sitemap 自動生與提交、月報 |
| Build／部署 | GitHub Actions 跑 build → Cloudflare Pages Direct Upload（專案 `rtp96`，token 在 `~/.claude/credentials/rtp96-pages.env`，已驗可用）。開獎更新另訂延遲目標，CI 不當準點保證 |
| 資料來源 | 台彩官方 JSON API 優先（已驗證，見 P0 §6），失敗保留上一筆有效資料＋告警 |
| URL | **全部保留**既有公開路徑（含 `/blog/posts/`）。canonical 與內連統一**無副檔名**（Pages 已 308 把 .html 轉掉，Google canonical 也是無副檔名） |
| 文章模型 | 同題目試稿比事實正確率／人工修改時間／成本後再選，不用模型名當驗收 |

## 0.5 流量假設（標註證據等級）

| 假設 | 證據 | 等級 |
|---|---|---|
| 「開獎號碼」是最大重複搜尋詞 | 第一頁被 udn／TVBS／自由／壹蘋每期新聞＋i539、lot539、pilio、台彩官網佔滿；無搜尋量數據（沒有 Keyword Planner／Ahrefs） | **待驗證**；短期搶不到主詞，先做長尾與回訪 |
| 地下簽賭術語沒人寫 | 只有 WebSearch 抽樣，沒系統比對 | **待驗證**；P0.5 做 SERP 抽查 20 個詞記錄前 10 名 |
| 冷熱號工具頁帶回訪 | 同類站（arclink、i539）都有此類頁，但無我方數據 | 推論；P2 上線後用 GA／DO 計數看回訪 |
| FAQ 標記搶精選摘要 | Google 2026-05-07 起不再顯示 FAQ rich result；精選摘要由 Google 自行判定 | **不成立**；FAQ 內容保留當內容，不當投資理由 |
| 新鮮度：每週發文讓站回到活躍 | GSC：5 月停更後 8 月曝光從 347 崩到 4 | 有數據支持 |
| 現有 5 頁排名 20～50 可拉進第一頁 | GSC 90 天：what-is-rtp 91 曝光 pos 38、casino-bonus-types 83 pos 26、mahjong-ways pos 3.6 | 有數據支持，**第一批目標頁** |

成效指標：GSC 曝光／點擊／收錄頁數（每月）、GA4 回訪率（待開 API）、工具頁佔比。

## 1. 現況（摘自 P0）
- 119 公開頁 + 6 草稿（草稿已在 07-17 的 live 版發布，repo 落後 live，已鏡像到 `D:/maki-workspace/rtp96-live-snapshot-20261003/`；**遷移以 live 快照為準**）。
- sitemap 87 筆、38 個分類頁沒進 sitemap；GSC 最近 28 天 1 曝光 0 點擊；樂透相關查詢 0。
- 30 篇填充文、35 篇 <1,500 字；canonical 寫 .html 跟 Google 認定不一致；`rtp96.com` 沒 301 到 www；og:image 是 32px。
- 程式：125 頁手寫 HTML，header/footer/related/TOC 重複貼；`ARTICLE_COUNTS` 寫死且錯；兩份 CSS；`auto_publish.py` 跟現況脫節；部署腳本不在 repo。

## 2. 目標架構

### 2.1 原則
單一真相在 `content/`；HTML 全由 build 產；URL 不變；零框架（Node 單檔 build，markdown-it＋gray-matter）；SEO 內建模板；每頁 build 時過品質閘門。

### 2.2 目錄
```
content/
  site.json                  站名、標語、作者、GA id、nav、分類定義（色票）、編輯推薦清單
  posts/<id>.md              所有文章（分類與公開路徑由 front-matter 決定，不靠目錄）
  pages/about.md
  _drafts/                   AI 草稿，人審後搬到 posts/
templates/ layout.html article.html category.html home.html tool.html
assets/  style.css  js/site.js  images/（只留 logo、avatar、og 1200×630、文章主圖）
data/lotto/{lotto649,superlotto638,daily539}.json   歷史開獎（git 版控，cron 更新）
build.mjs            content+data → dist/（含 sitemap.xml、rss.xml、_redirects）
deploy.mjs           dist → Pages Direct Upload（token 讀 env，不進 repo）
scripts/
  extract.mjs        舊 HTML（live 快照）→ content/posts/*.md
  inventory.mjs      URL 清冊（已有）
  gsc.mjs            拉 GSC 曝光／收錄，寫 docs/SEO-REPORT-YYYYMM.md
  qa.mjs             三寬度截圖、斷鏈、title/H1/canonical 檢查、填充句偵測
  lotto-fetch.mjs    打台彩 API 更新 data/、驗證、告警
workers/views-counter/   DO 計數（GET/POST /v/:id）
.github/workflows/
  build-deploy.yml   push main → build → qa → deploy
  lotto-update.yml   每日 21:30／22:30 台灣時間兩次 → lotto-fetch → 有變動才 commit＋觸發 build-deploy
docs/  ARCHITECTURE.md  P0-BASELINE.md  SEO-KEYWORDS.md  url-inventory.json  gsc-index-status.json
```

### 2.3 front-matter
```yaml
---
id: lotto649-how-to-play            # 穩定主鍵，永不改
permalink: /lotto/lotto649-how-to-play   # 公開路徑（無副檔名），舊文照舊路徑
title: 大樂透玩法完整解析：選號、獎項、中獎機率與期望值
category: lotto                     # slots|casinos|guides|rtp|lotto
tags: [taiwan-lottery]              # lotto 下再分 taiwan-lottery|analysis|underground
date: 2026-10-10                    # 實際發布日
updated: 2026-10-10
description: ≤160 字含主詞
keywords: [大樂透, 大樂透玩法, 大樂透中獎機率]   # 只用於選相關文章與內連，不輸出 meta keywords
readTime: 9
image: /images/posts/lotto649-how-to-play.png   # 1200×630，Discover 用
sources:                            # 數字來源，驗收用
  - https://www.taiwanlottery.com/...
faq: [{q, a}]                       # 輸出成內容 + FAQPage schema（schema 不期待 rich result）
related: [id, id]                   # 省略則依 keywords 交集自動選
status: published                   # draft|published
---
```
Markdown 擴充：`:::david`→david-note、`:::tip`、`:::info`、`:::disclaimer`（地下簽賭文必加）。

### 2.4 build 品質閘門（任一不過就 build 失敗）
title ≤60、description 40～160、H1 唯一、H2 ≥3 且自動 id、內文 ≥1,500 字、內連 ≥3（同分類 ≥2）、`image` 存在且 ≥1200 寬、`sources` 至少 1 條、填充句黑名單（「在這篇文章中，我們將從數據分析的角度」等）命中即擋、canonical＝permalink、permalink 唯一、舊 URL 全部有去向（對照 `url-inventory.json`）。

### 2.5 閱讀人數
- 實作改成 **Pages Function＋D1**（不用另開 Worker）：`GET /api/views/:id`→`{views}`；`POST /api/views/:id`→+1（只收 Origin／Referer 是 rtp96.com 的）。前端同 session 只 POST 一次（sessionStorage）。D1 的 UPDATE 是原子的，計數不會掉；KV 仍不能當計數器。
- 不預灌、不乘倍。首頁／分類頁「編輯推薦」區塊讀 `site.json.featured`。
- KV 不能當計數器（memory `feedback_kv_not_for_counters`）。

### 2.6 開獎工具規格（核心產品）
**資料**
- 來源：`https://api.taiwanlottery.com/TLCAPIWeB/Lottery/{Lotto649|SuperLotto638|Daily539}Result?month=YYYY-MM&endMonth=YYYY-MM&pageSize=200`。
- 每筆存：game、period、drawDate、numbers（排序）、special、appearOrder、prizes[]（等級、注數、每注金額）、sales、fetchedAt、source URL。
- 驗證：period 嚴格遞增且比庫內最新大；號碼數量（649＝6+1、638＝6+1、539＝5）、範圍（1–49／1–38＋1–8／1–39）、無重複；drawDate 合法且不晚於今天；任一不過 → 不寫入、記 error、告警（Telegram）。
- 更正：若官方同 period 內容改變 → 覆寫並記 `revisedAt`，頁面顯示「本期資料於 x 更正」。
- 失敗：API 非 200／rtCode≠0／超時 → 重試 3 次（間隔 5 分）→ 仍失敗保留上一筆，頁面顯示「資料時間 x，更新狀態：延遲」。
- 排程：開獎 20:30；GitHub Actions 21:30 與 22:30（台灣）各跑一次，加手動觸發。**延遲目標：官方公布後 2 小時內更新**，不承諾準點。
- 回填：按月迴圈 2014-01 至今一次性抓齊，存 `data/lotto/*.json`（git 版控，CI 讀同一版本）。

**頁面（每彩種一頁，`/lotto/{game}-results`）**
- 頂部：最新一期號碼（大球）、期號、開獎日、頭獎金額／注數、資料時間與更新狀態標示。
- 冷熱號：近 30／50／100 期每號出現次數、遺漏期數、連莊，可切換；用 build 時預算的 JSON，前端只渲染。
- 歷史列表：分頁，每期一列。
- 對獎器：輸入號碼比對最新一期（純前端）。
- JSON-LD：Dataset＋BreadcrumbList。
- 手機優先（三寬度截圖過 qa）。

### 2.7 樂透專區內容（第一批縮減版，P3 再擴）
- P2 先上 3 工具頁＋ 2 篇：「大樂透冷熱號怎麼分析（用歷史開獎驗證有沒有預測力）」「大樂透玩法與中獎機率」。
- P3 擴到 25 篇：台彩玩法 8、數據分析 9、地下簽賭術語 8（清單見 v1，略）。每篇 `sources` 必填、數字逐篇對官網。

## 3. 交付階段（照 Codex）

| 階段 | 範圍 | 過關條件 | 狀態 |
|---|---|---|---|
| **P0 基準** | GSC／URL 清冊／關鍵字對照／live 快照 | 清楚現況與第一批目標頁 | 完成（GA4 待開 API） |
| **P0.5 速修** | 38 頁補 sitemap、canonical 改無副檔名、apex→www 301、og:image、提交 sitemap | 兩週後 GSC 收錄數上升 | ✅ 10-04 上線（apex 301 用 functions/_middleware.js；sitemap 125 筆已交 GSC） |
| **P1 遷移** | extract→content、模板、build、qa、deploy、GitHub Actions | 所有舊 URL 有去向；正文／圖片／表格／內連逐頁 diff 無遺失；可回滾（保留快照） | ✅ 10-04 上線：118 篇進 content/、migrate-diff 125/125 零差異；GitHub Actions 未做（用 scripts/deploy.mjs 手動） |
| **P2 工具** | 3 彩種開獎＋冷熱號、lotto-fetch、cron、告警 | 資料正確；失敗不誤報；手機可用；DO 計數上線量使用 | ✅ 10-04 上線：`/lotto/{lotto649,superlotto638,daily539}-results`＋`/lotto/lotto-wheel-calculator`＋`/lotto/`；data/lotto 2014 起全量；GitHub Actions `lotto-update.yml` 每天 21:30／22:30 抓→commit→build→deploy；qa-lotto 33 項。**DO 閱讀計數還沒做**（P4） |
| **P3 內容** | 3 篇代表稿校準 → 30 篇重寫 + 25 篇新文 | 來源、數字、搜尋意圖、重複性逐篇驗收 | |
| **P4 營運** | Threads 自動貼、開獎圖卡、月報 | 看實際流量再決定投入 | 10-04：真閱讀計數（Pages Function＋D1 `rtp96-views`，`functions/api/views/[id].js`，`wrangler.toml` 綁 VIEWS）＋編輯推薦標籤（site.json.featured）✅；月報 `scripts/seo-report.mjs` ✅；Threads 要先有帳號，未做 |

## 3.6 P2 實作備註（2026-10-04）
- 工具頁模板 `templates/lotto.mjs`（stats／freshness／toolPage／calculatorPage／hubCards），瀏覽器端 `assets/js/lotto.js`（頁籤、對獎器、四個計算機）。統計全部 build 時算；對獎器內嵌最近 30 期，全量歷史在 `/data/lotto/<game>.min.json`。
- 更新狀態：`freshness()` 依各彩種開獎日算「應有的最近一期」，22:30 後還沒有就標「延遲」；下次開獎日也算出來顯示。
- 排程：GitHub Actions（repo silmoontravis/slotlab，secrets CF_API_TOKEN／CF_ACCOUNT_ID 四月已設）。push main 也會部署；`docs/**` 與 `*.md` 改動不觸發。抓取失敗不擋部署（保留上一筆）。沒新資料不改 data 檔（避免空 commit）；最後檢查時間在 `data/lotto/status.json`（gitignore）。
- 本機部署仍可 `node scripts/deploy.mjs`；兩邊都 push／deploy 時，CI 可能在你 push 後又 commit 資料，push 前先 `git pull`。
- 舊的 GitHub workflow（auto-publish、daily-blog-publish）已刪；repo 是公開的，不要放任何金鑰。

## 3.5 P1 實作備註（2026-10-04）
- 舊文正文**保留 HTML 原樣**放在 .md 的正文區（不轉 Markdown，零失真）；新文寫 Markdown（支援 :::david／:::tip／:::info／:::disclaimer）。build 以正文開頭是不是 HTML 標籤判斷。
- 模板是 `templates/index.mjs`（JS 函式，不是 .html 檔）；header／麵包屑／作者／目錄／相關文章／側欄／頁尾／廣告全部伺服端產出，瀏覽器只跑 `assets/js/site.js`（GA、輪播、分頁、篩選）。
- 閘門：legacy 舊文只做硬檢查（permalink 唯一、title／description 有、舊 URL 全有去向），其餘（1500 字、H2≥3、內連≥3、填充句）只進 `docs/BUILD-WARNINGS.md`；新文（沒有 legacy: true）全套嚴格＋sources／image 必填。
- 一鍵部署：`node scripts/deploy.mjs`（build → migrate-diff → wrangler pages deploy → GSC 重交 sitemap）。wrangler 若 npx 快取被鎖，用 `WRANGLER=<路徑>` 指到可用的執行檔。
- 轉址：`content/site.json.redirects` → `dist/_redirects`；主機名層級（rtp96.com→www）在 `functions/_middleware.js`。
- 同名檔（guides/slot-myths-debunked 與 blog/posts/slot-myths-debunked）id 加前綴 `guides-`，permalink 不變。

## 4. 遷移驗收（P1）
對每個舊 URL：title、H1、description、canonical、正文純文字（去空白）、圖片數、表格數、內連數、外連數 新舊一致；差異清單人工看過。工具：`scripts/migrate-diff.mjs`，輸入 live 快照目錄與 dist。

## 5. 相關記憶
`reference_taiwanlottery_api_and_gsc_access`、`feedback_seo_meta_keywords_useless`、`feedback_kv_not_for_counters`、`feedback_check_base_not_stale_before_deploy`、`legacy/project_rtp96`、`feedback_123win_keyin_rules_from_frontend_js`（術語正本在 789/WG）。
