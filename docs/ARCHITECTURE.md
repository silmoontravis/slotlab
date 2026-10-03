# rtp96.com（大衛の電子攻略站）架構整理版

> 2026-10-03 Maki 整理。給 Codex 做規劃書用。目標只有一個：**把 SEO 做起來**（被索引 → 有好內容 → 持續發文 → 看 GSC 調）。

## 0. 已拍板的決定（Travis 2026-10-03）

| 項目 | 決定 |
|---|---|
| 站定位 | 從「老虎機」擴成「用數據拆解博弈」：老虎機／樂透／娛樂城／RTP |
| 新專區 | `/lotto/` 樂透專區：台彩玩法、數據分析（冷熱號）、地下簽賭術語解說 |
| 地下簽賭尺度 | 術語與玩法全講（二三四星、台號、車、包牌、賠率、退水、層級），**不教怎麼參與、不提任何站或管道**，每篇附免責 |
| 程式架構 | 改成**靜態產生器**：Markdown＋content.json → build 出全站 |
| 閱讀人數 | **真計數**（Durable Object），初始值照發布日期算基底，少數幾篇灌成熱門 |
| 舊文 | 30 篇模板填充文**一次全重寫** |
| 文章日期 | 往回鋪到 2026-06，每週 1～2 篇，看起來持續經營 |
| SEO 自動化 | 參考 `heyjiu-seo-cron`，但**不做每日換 meta keywords**（對排名零效果，見 memory `feedback_seo_meta_keywords_useless`）。改做：每日抓開獎更新頁、每週 AI 草稿一篇、提交 sitemap、GSC 回看 |
| 部署 | Cloudflare Pages 專案 `rtp96`，直接上傳（非 git 連動） |

## 0.5 流量策略（Travis：「讓這個站有大量的人來閱覽比較重要」）

架構是手段，流量是目的。排序照「每小時工時能換到的流量」：

1. **開獎號碼工具頁（最大流量來源）**：「大樂透開獎號碼」「威力彩開獎號碼」「今彩539開獎號碼」是每週固定三到六次的重複搜尋，arclink 整站流量主要靠這個。做法：每個彩種一頁，開獎當晚 20:30 前自動更新（台彩 20:30 開獎），頁面含最新一期＋歷史期次＋冷熱號表＋對獎器。要搶這個詞，**更新速度和結構化資料**（JSON-LD Dataset／FAQ）比文章文采重要。
2. **冷熱號／遺漏值／連莊 工具頁**：有人每期回訪，停留久、跳出低，Google 會加權。
3. **長尾文章**：每個玩法詞下面掛 5～10 個長尾問句（「大樂透 包牌 多少錢」「威力彩 第二區 機率」「539 牌支 意思」「台號 是什麼」），用 FAQ schema 搶精選摘要。地下簽賭術語這塊**沒有競爭對手在寫**，是最容易拿第一頁的詞。
4. **新鮮度**：每週至少 2 篇新文＋每日工具頁更新，讓 Google 把站當活站爬。
5. **社群導流**：記憶裡 Threads 30 天內容早就備好（`threads-content.md`），帳號沒建。每篇文章產一則 Threads 貼文（自動），每期開獎發一則「本期冷熱號」；大樂透頭獎累積超過 2 億時社群搜尋量暴衝，要有「頭獎累積 x 億」的即時貼文。
6. **Google Discover**：需要 1200px 以上 og:image，每篇文章要有一張主圖（現在全站沒有文章主圖）。工具頁做一張自動產生的「本期開獎圖卡」（SVG→PNG）。
7. **先被索引**：GSC 提交 sitemap、確認爬取，之前 heyjiu 的教訓是做了一堆功能 Google 根本沒爬過首頁。

成效指標（每月看）：GSC 曝光、點擊、收錄頁數；GA 回訪率；工具頁佔總流量比。

## 1. 現況盤點（as-is）

### 1.1 檔案結構
```
slotlab/
├── index.html                首頁（75KB，文章卡片手寫，8 個空白佔位）
├── about.html
├── style.css                 18.9KB，單一檔
├── js/components.js          header/footer/sidebar/breadcrumb/author/ad/GA（8.7KB）
├── slots/   23 篇 + index     casinos/ 12 篇 + index
├── guides/  11 篇 + index     rtp/     10 篇 + index
├── blog/
│   ├── index.html  posts/ 60 篇  drafts/ 6 篇  rss.xml  style.css（第二份 CSS）
├── images/   logo 20 多個候選檔（只用 logo.png / favicon-32.png / david-avatar.png）
├── sitemap.xml（81 筆）  robots.txt  CNAME
├── auto_publish.py（195 行，掃 posts 重生 index／分類頁／ARTICLE_COUNTS）
└── fix_articles.py（一次性修檔腳本）
```
共 125 個 HTML。最後 commit 2026-05-12。

### 1.2 問題清單（為什麼說「有點亂」）
1. **每頁重複貼結構**：head meta、JSON-LD、breadcrumb 呼叫、related-posts、extended-reading、TOC 都是手寫在 125 頁裡，改一處要動 125 檔。
2. **四種不一致的分類語意**：目錄分類（slots/casinos/guides/rtp）vs `blog/posts/` 又獨立一個目錄；文章的 `cat-pill` 標籤跟所在目錄不一定一致（例：`guides/` 裡掛 `老虎機評測`）。
3. **寫死的數字**：`ARTICLE_COUNTS = {slots:35, casinos:20, guides:37, rtp:11}` 跟實際檔案數（23/12/11/10＋60）對不上；sitemap 81 筆 vs 125 頁。
4. **30 篇模板填充文**：整段「在這篇文章中，我們將從數據分析的角度…」重複，H2 相同骨架，FAQ 答案泛泛。對 SEO 是負資產（thin content）。
5. **TOC 幾乎是空的**：多數文章 TOC 只有 `#faq` 一項，H2 沒 id。
6. **內部連結用無副檔名路徑** `/slots/what-is-rtp`，Pages 直接上傳模式下這種路徑靠 CF 自動補 .html，canonical 卻是 `.html`，等於同一頁兩個 URL。
7. **廣告版位全是佔位 div**（`廣告版位 A-HOME-001`），對讀者是噪音。
8. **兩份 CSS**（根目錄＋blog/），部分文章 inline style。
9. **GA 有裝**（G-WD5D746KC6），但 **GSC 沒資料可查**（記憶顯示 05-01 曝光 0），且 sitemap 可能從未提交。
10. **auto_publish.py 已跟現況脫節**（它只掃 blog/posts，分類目錄的文章不在它管轄內）。
11. **部署靠一段寫在記憶裡的 Python**，沒進 repo。
12. 日期範圍 2026-03-05～05-01，之後五個月沒更新，站看起來停擺。

## 2. 目標架構（to-be）

### 2.1 原則
- **單一真相**：所有文章 metadata 在 `content/` 的 front-matter，HTML 全部由 build 產生，產出目錄 `dist/` 不進 git。
- **URL 永久**：維持現有路徑（`/slots/xxx.html` 等）不變，避免丟排名；新專區 `/lotto/`。所有內部連結統一帶 `.html`，canonical 一致。
- **零框架依賴**：Node 單一 build 腳本（`build.mjs`），markdown-it＋front-matter，不上 Astro/Next（部署是直接上傳，越簡單越好）。
- **SEO 內建在模板**：title/description/canonical/og/JSON-LD（Article＋FAQPage＋BreadcrumbList）、H2 自動 id＋TOC、相關文章自動選、sitemap/RSS 自動生。

### 2.2 目錄
```
slotlab/
├── content/
│   ├── site.json                 站名、標語、作者、GA id、nav 順序、分類定義（含顏色）
│   ├── slots/*.md  casinos/*.md  guides/*.md  rtp/*.md
│   ├── lotto/*.md                新專區
│   └── pages/about.md
├── templates/
│   ├── layout.html               <head>＋header＋footer 殼
│   ├── article.html              文章頁（TOC、author、FAQ、related、views）
│   ├── category.html             分類列表（分頁）
│   ├── home.html                 首頁
│   └── tool.html                 工具頁（開獎號碼、冷熱號）
├── assets/  style.css  js/site.js  images/（清掉 logo 候選檔）
├── data/
│   └── lotto/draws-{game}.json   歷史開獎（每日 worker 更新）
├── build.mjs                     content → dist
├── deploy.mjs                    dist → CF Pages 直接上傳（token 讀 ~/.claude/credentials，不進 repo）
├── workers/
│   ├── views-counter/            Durable Object 閱讀計數（GET /v/:slug 回數字，POST 加一）
│   └── lotto-cron/               每日抓台彩開獎 → 更新 data/ → 觸發 build＋deploy；每週 AI 草稿到 content/_drafts/
├── scripts/qa.mjs                headless 截圖三種寬度＋檢查 title/H1/canonical/斷鏈
├── docs/ARCHITECTURE.md（本檔）  docs/SEO-KEYWORDS.md（關鍵字對照表）
└── dist/（產出，gitignore）
```

### 2.3 front-matter 規格
```yaml
---
title: 大樂透玩法完整解析：選號、獎項、中獎機率與期望值
slug: lotto649-how-to-play          # 檔名即 slug
category: lotto                     # slots|casinos|guides|rtp|lotto
subcategory: taiwan-lottery         # lotto 專區再分：taiwan-lottery|analysis|underground
date: 2026-07-12
updated: 2026-10-03
description: 160 字內，含主關鍵字
keywords: [大樂透, 大樂透玩法, 大樂透中獎機率]   # 只用來選相關文章＋內部連結，不輸出 meta keywords
readTime: 9
hot: false                          # true → 閱讀數基底乘 8～15 倍（灌水為熱門）
faq:
  - q: 大樂透頭獎機率是多少？
    a: 1/13,983,816……
related: [powerball-how-to-play, lotto-odds-math]   # 可省略，省略時用 keywords 交集自動選
---
正文 Markdown。`:::david` 區塊 → david-note；`:::tip` → tip；`:::info` → info-box。
```

### 2.4 閱讀人數
- Worker `views-counter`（DO，`new_sqlite_classes`）：`GET /v/:slug` 回 `{views}`；`POST /v/:slug` +1 並回新值。
- 基底：`base = floor((today - date).days * k) + hash(slug)%200`，`k` 依分類 15～40；`hot: true` 乘 8～15。基底在 build 時算好寫進頁面 `data-base`，前端顯示 `base + DO 計數`，DO 只存真增量。這樣不用預灌 DO、換基底公式也不會壞。
- 記憶 `feedback_kv_not_for_counters`：KV 不能當計數器，所以用 DO。

### 2.5 樂透專區內容規劃（第一批 25 篇＋3 工具頁）
**A. 台彩玩法（8）**：大樂透、威力彩、今彩539、大福彩、三星彩、四星彩、賓果賓果、刮刮樂。每篇：玩法、獎項表、各獎機率、期望值、稅（5,000 以上 20% 分離課稅）、兌獎期限。資料來源台彩官網。
**B. 數據分析（9）**：頭獎機率怎麼算（組合數）、冷熱號怎麼分析（遺漏值／出現次數／連莊／尾數，用歷史開獎跑 Python 驗證有沒有預測力）、包牌划不划算、連號跳號是不是迷思、立柱拖牌是什麼、版路分析拆解、大樂透 vs 威力彩期望值、包牌成本試算表、獎金稅務與領獎流程。
**C. 地下簽賭解說（8）**：地下六合彩是什麼（跟香港六合彩、台彩的關係）、二三四星怎麼下、台號與車、包牌與尾數、賠率與退水怎麼算、組頭／上手／站長層級、簽單術語辭典（A～Z）、地下與台彩的差異與風險。**不提任何站、不教參與**。
**工具頁（3）**：大樂透／威力彩／今彩539 各一頁「最新開獎＋近 30/50/100 期冷熱號表」，每日 cron 更新。這是 arclink 流量最大的詞（「大樂透開獎號碼」）。

### 2.6 SEO 清單（每頁必過）
- title ≤ 60 字含主詞；description ≤ 160；H1 唯一；H2 帶 id；canonical＝實際 URL（.html）
- JSON-LD：Article＋FAQPage＋BreadcrumbList；首頁 Blog＋WebSite(SearchAction 可省)
- 每篇 ≥ 3 條內部連結到同專區、≥ 1 條到跨專區
- 圖片 alt；og:image 用站 logo 1200×630（現在是 32px favicon，要換）
- sitemap 全頁、lastmod 真值；RSS 最新 20
- 提交 GSC（sitemap＋URL inspection），robots 不擋
- 填充文判定：抓「在這篇文章中，我們將從數據分析的角度」等句，build 時報錯擋下

### 2.7 自動化（lotto-cron worker）
- 每日 09:00（台灣）抓台彩開獎 → 更新 `data/lotto/*.json` → 跑 build＋deploy（worker 觸發 GitHub Action 或本機排程；二選一，見待決）。
- 每週一：用 Claude API 依 `docs/SEO-KEYWORDS.md` 的待寫清單出一篇草稿到 `content/_drafts/`，**人審後**才搬到正式目錄。不自動發布未審文章。
- 每月：拉 GSC 曝光／點擊，寫 `docs/SEO-REPORT-{yyyymm}.md`。

## 3. 遷移計畫
1. **抽取**：寫 `scripts/extract.mjs` 把 125 頁現有 HTML 反解成 Markdown＋front-matter（title/desc/date/category/body/faq），放進 `content/`。失敗的手修。
2. **模板**：做 layout/article/category/home 四個模板，先用現有 CSS，不改外觀。
3. **build 對照**：對任一舊頁，build 出來的 HTML 跟舊的在 title/H1/canonical/正文字數一致（寫 diff 檢查），確認零倒退再切。
4. **清理**：刪 `fix_articles.py`、`auto_publish.py`、logo 候選檔、`blog/style.css`；`blog/posts/` 內容按 category 歸到分類目錄（保留舊 URL 用 `_redirects` 301）。
5. **新內容**：樂透 25 篇＋3 工具頁；30 篇填充文重寫（同一批 agent 流程）。
6. **計數器**：views-counter worker 上線，模板接上。
7. **部署**：`deploy.mjs` 上傳 dist；提交 sitemap 到 GSC；用 `scripts/qa.mjs` 三寬度截圖＋斷鏈檢查。
8. **自動化**：lotto-cron 上線。

## 4. 待 Codex 規劃書決定的點
- build 觸發方式：GitHub Action（repo 要連 CF Pages token）vs 本機排程（家裡機常開）。建議 GitHub Action。
- 歷史開獎資料來源：台彩官網 HTML 解析（無官方 API）vs 第三方。建議官網解析＋失敗告警。
- `blog/posts/` 60 篇要不要搬 URL：建議**不搬**（保留排名），只在 content/ 內用 category 歸類，輸出路徑照舊。
- 文章產出用哪個模型、每篇成本上限。

## 5. 相關記憶（Maki）
`feedback_seo_meta_keywords_useless`、`feedback_kv_not_for_counters`、`feedback_admin_backend_baseline_checklist`、`legacy/project_rtp96`、`legacy/reference_rtp96_deploy`、`feedback_123win_keyin_rules_from_frontend_js`（地下簽賭術語的正本在 789/WG 專案）。
