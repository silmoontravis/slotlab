# P0 基準：rtp96.com 現況（2026-10-03）

> 資料來源：GSC API（SA siteOwner 直讀）、`scripts/inventory.mjs`、現站 curl、台彩官網／API 實測。GA4 **拿不到**（專案沒開 Analytics API，見下）。

## 1. 被索引了嗎？

| 項目 | 數字 | 說明 |
|---|---|---|
| sitemap 提交 | 87 筆，0 錯誤 | 最後下載 2026-10-03 01:30，Google 有在抓 |
| sitemap 顯示已索引 | **0** | GSC 的 sitemap 報表「indexed: 0」。但單頁 inspection 顯示首頁、what-is-rtp、rtp-myths、baccarat 等是 `Submitted and indexed`，所以不是全站沒收錄，是收錄率低 |
| 公開 HTML | 119（另 6 篇草稿） | `docs/url-inventory.json` |
| 不在 sitemap 的公開頁 | **38** | 整個 casinos/guides/rtp/slots 分類目錄下大半沒進 sitemap，只靠內連被發現 |
| 全站 119 頁收錄狀態 | **已索引 62／Discovered 未索引 19／Google 不知道這個 URL 33／Crawled 未索引 4／錯誤 1** | `docs/gsc-index-status.json`。33 頁 Google 連看都沒看過＝幾乎全是沒進 sitemap 的分類頁（slots/guides/rtp/casinos 分類首頁本身也在內）；19 頁看過不收＝薄內容 |
| 抽樣 6 頁 | 4 indexed、1「Discovered - not indexed」、1「Crawled - not indexed」 | 後兩種就是「Google 看過但覺得不值得收」＝薄內容訊號 |

## 2. 現有流量（GSC，2026-03-01～10-02）

| 月份 | 曝光 | 點擊 |
|---|---|---|
| 04 | 6 | 0 |
| 05 | 94 | 4 |
| 06 | 315 | 7 |
| 07 | 347 | 2 |
| 08 | 4 | 0 |
| 09 | 1 | 0 |
| 最近 28 天 | **1 曝光、0 點擊** | 站在 Google 眼中等於不存在 |

- 全期 33 個查詢、485 次曝光、**0 點擊**（by query）；by device 合計 11 次點擊全來自桌機。
- 有曝光的詞：`rtp博弈`(102)、`rtp是什麼`(100)、`捕魚機武器玩法`(96)、`娛樂城遊戲攻略 籃球 獎金高`(79)；平均排名 26～93，沒有一個在第一頁。
- **跟樂透相關的查詢：0 個。** 現在的樂透流量假設完全沒有既有數據支撐，是從零開始。
- 08 月起曝光崩到個位數：5 月之後沒再發文，Google 把站降成不活躍。

## 3. URL 與轉址（現站實測）

| 請求 | 結果 |
|---|---|
| `/slots/what-is-rtp.html` | **308 →** `/slots/what-is-rtp` |
| `/slots/what-is-rtp` | 200 |
| `/slots/index.html`、`/slots` | 308 → `/slots/` |
| `/blog/posts/baccarat-strategy-deep` | 200 |
| `rtp96.com/` | 200（**沒轉到 www**，兩個 host 都 200，要加 301） |

結論：Cloudflare Pages 已把 `.html` 轉成無副檔名，而且 Google 認定的 canonical 就是無副檔名（inspection 的 `googleCanonical` 全是無副檔名）。**canonical 與內連統一用無副檔名**，ARCHITECTURE.md v1 寫的「全帶 .html」作廢。現有頁的 `<link canonical>` 寫的是 `.html`，跟 Google 認定不一致，要改。

## 4. 內容品質（inventory）

- 填充文 30 篇（同一段模板句）。
- 內文 < 1,500 字 35 篇。
- title 全部 ≤ 60、description／H1 全部有，基本 meta 沒問題，問題在內容本身。
- 內連大量用無副檔名路徑，剛好跟 Pages 行為一致，不用改。
- og:image 是 32px favicon，不符 Discover。

## 5. 工具存取狀態

- **GSC**：SA `claude-dns-automation@dulcet-elevator-296603` 是 `sc-domain:rtp96.com` 和 `https://www.rtp96.com/` 的 siteOwner，searchAnalytics／sitemaps／urlInspection 都通。
- **GA4**：`G-WD5D746KC6` 有裝，但 GCP 專案 1081933354675 沒開 Analytics Admin／Data API，SA 也沒加進 GA property → 需要 Travis 在 GCP console 開 API ＋ GA 後台把 SA email 加 Viewer。沒有這個就只能看 GSC。
- **Cloudflare Pages 部署 token**：舊記憶裡那組還沒驗（auto mode 擋了含 token 的指令），部署前要在 credentials 檔裡放好再測。

## 6. 台彩資料來源（驗證過）

- 官方 JSON API `https://api.taiwanlottery.com/TLCAPIWeB/Lottery/{Lotto649|SuperLotto638|Daily539|49M6|39M5|3D|4D}Result?period=&month=YYYY-MM&endMonth=YYYY-MM&pageNum=1&pageSize=200`，免金鑰，歷史回溯到 2014-01，欄位含期號、開獎日、排序號碼、開出順序、各獎項注數與金額、銷售額。
- 10-02 大樂透期 115000093 實抓成功，跟新聞一致。
- 風險：非公開文件的 API，官方改版會斷；要有「上一筆有效資料＋告警」。
- 開獎 20:30，API 更新時間待觀測（P2 要記錄實際延遲幾分鐘）。

## 7. 「開獎號碼」這個詞的競爭現況（WebSearch 2026-10-03）

搜 `大樂透開獎號碼` 第一頁：聯合新聞網、壹蘋、TVBS、自由、NOWnews（每期發新聞）＋ `lot539.com`（Cloudflare 擋爬）、`i539.tw`（台灣彩券通）、`pilio.idv.tw`（幸運發財網）、台彩官網。
- 新聞站靠權重每期搶即時詞，工具站靠歷史累積。我們兩者都沒有。
- 「arclink 主流量來自開獎號碼」是推論，沒有第三方數據可證；要查搜尋量得接 Google Ads Keyword Planner 或買 Ahrefs，目前都沒有。
- 務實結論：**開獎號碼主詞短期搶不到第一頁**；可行的是長尾（「大樂透 冷熱號」「539 遺漏值」「包牌 多少錢」「台號 意思」）＋把工具頁做成回訪型。

## 8. P0 結論與第一批目標頁

1. 站目前接近零流量、收錄率低、五個月沒更新，任何改版的「成效」都要從這個零基準量。
2. 先修會立即影響收錄的：38 頁補進 sitemap、canonical 改無副檔名、`rtp96.com` → `www` 301、og:image 換 1200×630。
3. 第一批目標頁（有既有曝光、排名 20～50、改好就能進第一頁）：`slots/what-is-rtp`（rtp是什麼／rtp博弈，91 曝光）、`blog/posts/casino-bonus-types`（83）、`slots/mahjong-ways-deep-dive`（pos 3.6）、`guides/bonus-hunting-guide`（pos 18.7）、`slots/fishing-game-complete`（捕魚機 96 曝光但 pos 93）。
4. 樂透專區從零起步，第一批先做 3 個工具頁＋冷熱號分析文，用兩個月的 GSC 看有沒有長尾進來，再決定投入 25 篇還是縮減。
5. 待 Travis：GA4 開 API＋加 SA；確認 CF Pages token 可用。
