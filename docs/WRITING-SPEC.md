# rtp96 寫作規格 v1（2026-10-04）— 給寫手 agent，照做不討論

## 0. 最重要的一條：這是「大衛」的部落格
- 站主是**匿名軟體工程師「大衛」（David）**。所有文章是他**第一人稱**在講：「我」抓了資料、「我」跑了程式、「我」算給你看。沒有「我們」「本站」「編輯部」。
- 他的個性：好奇、數據控、愛自嘲、講白話、不業配、不叫人去賭、承認不確定性。口頭禪式的寫法：「老實說…」「我一開始也以為…」「跑完數字才發現…」「這題我卡了兩天」。
- 每篇**至少兩個** `:::david` 段（大衛碎念框）：放他的親身過程、意外發現、或潑冷水的提醒。例：
  > :::david
  > 我用 Python 跑了一台 RTP 96% 的機台模擬 100 萬次旋轉，最終得到 95.97%。但如果只看前 1,000 次，數字從 82% 到 115% 都有可能。短期真的什麼都可能發生。
  > :::
- 他講的「我跑了資料」必須是真的：樂透題目用 `data/lotto/*.json`（見 §5）實算；算不出來的就寫成推論，不要編數字、不要編「我中過」「我朋友贏了」。
- 他不是莊家也不是玩家代言：**不推薦任何站、不給任何管道、不寫「必中／明牌／報牌」**。

## 1. 檔案與 front-matter（新文一律 Markdown）
檔案：`content/posts/<id>.md`。只能動自己被分配的檔案。
```yaml
---
id: lotto649-how-to-play                 # ＝檔名，英文小寫連字號
permalink: /lotto/lotto649-how-to-play   # 新文照這格式；重寫的舊文 permalink 不准改
title: 大樂透玩法完整解析：選號、獎項、中獎機率與期望值   # ≤ 60 字，含主關鍵字，不要「| 大衛の電子攻略站」
category: lotto                          # lotto | slots | casinos | guides | rtp（重寫的舊文沿用原 category）
crumb: category                          # 新文 category；舊文沿用原值
tags: [taiwan-lottery]                   # lotto 下：taiwan-lottery | analysis | underground
date: '2026-10-04'                       # 新文＝今天；重寫的舊文**沿用原 date**
updated: '2026-10-04'
description: 60～150 字，含主關鍵字，一句講清楚讀完能得到什麼
excerpt: 列表卡片用的一句話（≤ 60 字）
readTime: 9                              # 中文字數 ÷ 350，四捨五入
image: /images/posts/lotto649-how-to-play.png   # 固定這個格式，圖由 build 自動產，不用你做
keywords: [大樂透玩法, 大樂透中獎機率, 大樂透獎金]   # 主詞放第一個；只用 docs/SEO-KEYWORDS.md 裡的詞或其自然變體
sources:                                 # ≥ 2 條真的打得開的網址（官方優先）；每個數字都要能回溯到其中一條
  - https://www.taiwanlottery.com/...
related:                                 # 2～3 個站內 permalink（見 §6）
  - /lotto/lotto649-results
faq:                                     # 3～5 題，答案 40～120 字，會輸出 FAQPage schema
  - q: 大樂透一注多少錢？
    a: 50 元…
status: published
---
```
**重寫舊文**：把原檔的 `legacy: true`、`filler: true`、`tocLegacy`、`ldDescription`、`ogDescription` 這幾個欄位**刪掉**，其餘沿用（permalink、category、crumb、date 不改）；正文整個換成 Markdown。

## 2. 正文結構（順序固定）
1. **開場 2～3 句**：大衛為什麼研究這題（第一人稱、具體、有畫面）。不要「在這篇文章中我們將…」。
2. `:::tip` 框：**TL;DR** 三條，每條一句結論＋數字。
3. **H2 × 4～6**，每個 H2 下 150～400 字，標題自然帶關鍵字（不要硬塞）。有數字就用 Markdown 表格。
4. 至少兩個 `:::david`（見 §0）。
5. **H2「常見問題」**：3～5 題，跟 front-matter 的 faq 同內容（問句當 H3 或粗體）。
6. **H2「延伸閱讀」**：3～5 條站內連結（§6），用一句話說為什麼要看。
7. 地下簽賭類（tags 含 underground）**正文最後**固定加：
   ```
   :::disclaimer
   本文只解釋術語與計算方式，供理解台灣地下簽賭文化之用。地下簽賭在台灣違法（刑法第 266、268 條），本站不提供、不介紹、不連結任何投注管道，也不鼓勵參與。
   :::
   ```
8. 長度：**正文 1,800～2,800 個中文字**（不含 front-matter）。少於 1,500 字 build 會擋。
9. 內連 ≥ 3 條（`/` 開頭的站內路徑）；外連只放 sources 裡的網址。

## 3. 可用的 Markdown 擴充
`:::david`／`:::tip`／`:::info`／`:::disclaimer` 各自獨占一行開頭與結尾 `:::`。標準 Markdown 表格、粗體、清單、程式碼區塊（大衛會貼 5～15 行 Python／公式，鼓勵但不要超過兩段）。不要用 HTML 標籤。

## 4. 禁止
- 「在這篇文章中，我們將從數據分析的角度」「作為一名長期研究電子遊戲數學模型的軟體工程師」這類填充句（build 會擋）。
- 編造實測：沒跑過的就不要說「我測了 10 家」。要寫「怎麼測」可以，寫成方法論並明說「我沒有逐家測」。
- 推薦／評比任何娛樂城、彩券行、地下站、APP 品牌名（台彩官方 APP 可提）。
- 保證、必中、穩賺、內幕、明牌、報牌。
- meta keywords、關鍵字堆疊、同一詞一段出現 3 次以上。
- 抄 Wikipedia 或新聞整段。

## 5. 樂透資料怎麼用（數據分析類必用，其他類可用）
- 檔案：`data/lotto/lotto649.json`、`superlotto638.json`、`daily539.json`，格式 `{ draws: [{ period, drawDate, numbers:[排序], special, appearOrder, prizes:[{tier,winners,perPrize,prize}], sales }], latest, updatedAt }`，2014-01 至今（台彩官方 API）。
- 要數字就自己算，例如：
  ```bash
  node -e "const d=require('./data/lotto/daily539.json').draws;const n=d.length,c={};for(const x of d)for(const k of x.numbers)c[k]=(c[k]||0)+1;console.log(n,Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5),Object.entries(c).sort((a,b)=>a[1]-b[1]).slice(0,5))"
  ```
- 文章裡寫清楚：「資料範圍 2014-01-xx ～ 2026-10-xx 共 N 期」、「取樣窗 30／50／100 期」、怎麼算的。這就是大衛跟別人不一樣的地方。
- 冷熱號結論要誠實：每期獨立、冷熱沒有預測力；可講的是「獨得機率」（少人選的號碼中了分的人少）。

## 6. 站內連結目標（內連、related 用這些）
- 工具頁（P2，build 會產）：`/lotto/`（樂透專區）、`/lotto/lotto649-results`（大樂透最新開獎＋冷熱號＋遺漏＋對獎）、`/lotto/superlotto638-results`、`/lotto/daily539-results`、`/lotto/lotto-wheel-calculator`（包牌／連碰計算機）。
- 既有文章：`/slots/what-is-rtp`、`/rtp/house-edge-explained`、`/rtp/long-term-simulation`、`/rtp/variance-explained`、`/guides/bankroll-management`、`/guides/responsible-gambling`、`/guides/when-to-stop`、`/blog/posts/gambling-psychology-traps`、`/blog/posts/rng-how-slots-work`、`/blog/posts/slot-math-models`。
- 同一批新文之間互連（用 §7 的 permalink）。

## 7. 新文清單（25 篇）與主關鍵字
### 7A 台彩玩法（tags: [taiwan-lottery]）
| id | 主關鍵字 | 要點 |
|---|---|---|
| lotto649-how-to-play | 大樂透 玩法 中獎機率 | 49 選 6＋特別號、各獎項機率用 C(49,6) 推導、獎金結構、開獎日、連碰與包牌入口 |
| superlotto638-how-to-play | 威力彩 玩法 第二區 | 38 選 6＋8 選 1、2,209 萬分之一怎麼來、800／5,600 包牌真實機率、頭獎累積機制 |
| daily539-how-to-play | 今彩539 玩法 獎金 | 39 選 5、中 2～5 的獎金與機率、週一到六、為什麼它是「天天開」的入門款 |
| lottery-expected-value | 大樂透 威力彩 539 期望值 比較 | 用 data 裡的真實獎金池與注數算三種的實際回收率（含稅 20%、含分獎），表格比較 |
| lotto649-wheeling-worth-it | 大樂透 包牌 划算嗎 | 包 7～12 碼的注數、成本、機率提升倍數 vs 成本倍數，結論用數字 |
| superlotto638-second-zone-strategy | 威力彩 第二區 包牌 | 第二區 8 個全包的機率算式、第二區號碼歷史分布（data）、迷思拆解 |
| taiwan-lottery-prize-tax-and-claim | 樂透 中獎 稅 領獎 | 2,000 元以上 20% 稅＋印花稅、領獎地點與期限、大獎領取流程（引官方） |
| lottery-odds-math-explained | 樂透 機率 怎麼算 | 組合數 C(n,k) 白話推導、用 Python 三行算出每個獎項、常見算錯的地方 |
### 7B 數據分析（tags: [analysis]）——每篇都要有從 data 算出的表
| id | 主關鍵字 | 要點 |
|---|---|---|
| hot-cold-numbers-do-they-work | 樂透 冷號 熱號 預測 有用嗎 | **旗艦文**：用大樂透全部期數回測「買前 30 期熱號／冷號」的命中率 vs 隨機，數字說話；連到三個工具頁 |
| daily539-missing-value-explained | 539 遺漏值 | 遺漏值定義、理論期望 7.8 期、歷史最大遺漏、遺漏越大越該買嗎（回測） |
| lotto649-number-frequency | 大樂透 號碼 出現次數 統計 | 2014 至今每號出現次數表、最熱最冷、卡方檢定看是否均勻 |
| superlotto638-zone2-frequency | 威力彩 第二區 統計 | 1～8 的分布、連續開同號的次數、理論 vs 實際 |
| consecutive-numbers-how-often | 樂透 連號 機率 | 一期內出現連號（如 12、13）的理論機率 vs 歷史實際比例，三彩種各算 |
| lottery-sum-distribution | 樂透 和值 分布 | 六個號碼總和的分布圖（表格分段）、常見「和值選號法」的檢驗 |
| odd-even-big-small-patterns | 樂透 奇偶 大小 比例 | 3:3、4:2… 各組合的理論與實際，為什麼「平衡選號」不會提高機率 |
| lottery-random-test | 樂透 開獎 隨機 檢定 | 卡方／遊程檢定說明＋三彩種結果；大衛的結論：看不出不隨機 |
| quick-pick-vs-self-pick | 電腦選號 自選 哪個好 | 機率相同、差在分獎人數；用 data 的頭獎注數看熱門號碼期的平均分獎人數 |
### 7C 地下簽賭術語（tags: [underground]，每篇文末固定免責）
| id | 主關鍵字 | 要點 |
|---|---|---|
| underground-539-stars | 539 二星 三星 四星 意思 | 定義、碰數＝C(n,k)、常見賠率區間（寫成「坊間常見」不寫特定站）、跟台彩 539 獎金的對比 |
| underground-539-combos-and-cars | 539 連碰 車 意思 | 連碰＝把 n 個號碼所有 k 碼組合都下；全車／半車＝1 號碰其餘 38；成本算式與範例 |
| underground-taiwan-number | 台號 意思 怎麼算 | 六合彩 49 個開獎號碼排序→兩兩一組取個位→台號 00～99；特尾三；用一期實際號碼算一次 |
| underground-pillars | 立柱 柱碰 意思 | 分柱、柱與柱之間碰、同柱不算；碰數算法與連碰的差別 |
| underground-rebate-and-share | 退水 水錢 佔成 意思（簽賭） | 退水＝回扣比例、佔成＝上下層分擔輸贏比例；用算例講一層一層怎麼分；標題要含「簽賭」避免跟水費／狼人殺混 |
| underground-bookie-tiers | 組頭 層級 結構 | 會員→小組頭→大組頭→上手／盤口 的結構說明（只講結構不講操作）、為什麼要「降倍」「限注」 |
| underground-mark-six-glossary | 地下六合彩 術語 大全 | 總覽頁：全車、連碰、立柱、台號、特尾、尾數、生肖、大小單雙… 每條 2～3 句＋連到上面各篇 |
| underground-vs-official-odds | 地下 賠率 vs 台彩 期望值 | 把地下常見賠率換算成 RTP 跟台彩比；為什麼「看起來賠率高」但風險在信用與違法；不勸參與 |

## 8. 重寫舊文清單（30 篇，permalink／category／date 不改）
> 這 30 篇現在是同一個模板灌出來的填充文。重寫＝整篇用大衛口吻重新寫一遍，有真內容、有數字、有方法；「實測／排名／評測」類不能編造，改成「怎麼自己判斷」的方法論，不點名品牌。
/blog/posts/asia-slot-market-2026、/blog/posts/autoplay-pros-cons、/blog/posts/cascade-slots-explained、/blog/posts/casino-bonus-types、/blog/posts/casino-customer-service、/blog/posts/casino-security-check、/blog/posts/casino-withdrawal-speed、/blog/posts/crypto-casino-guide、/blog/posts/ewallets-casino-guide、/blog/posts/gambling-psychology-traps、/blog/posts/high-rtp-slots-2026、/blog/posts/jackpot-types-explained、/blog/posts/live-casino-beginners、/blog/posts/multiplier-slots-guide、/blog/posts/netent-vs-microgaming、/blog/posts/online-vs-land-casino、/blog/posts/pragmatic-play-review、/blog/posts/seasonal-casino-promotions、/blog/posts/slot-bankroll-calculator、/blog/posts/slot-betting-strategies、/blog/posts/slot-bonus-round-guide、/blog/posts/slot-feature-buy-analysis、/blog/posts/slot-game-design-secrets、/blog/posts/slot-math-models、/blog/posts/slot-payline-explained、/blog/posts/slot-rtp-tracking-tools、/blog/posts/slot-streaming-culture、/blog/posts/slot-tournament-strategy、/blog/posts/slot-volatility-chart、/blog/posts/taiwan-online-gambling-law
- 老虎機／RTP 類：大衛可以「寫一段 Python 模擬」（真的可以用 node 跑個簡單蒙地卡羅算出數字再寫），例如 Feature Buy 期望值、波動率對破產機率的影響。
- 法規類（taiwan-online-gambling-law）：只引法條條號與公開新聞，寫「現況與風險」，不給規避方法。
- 平台類（出金、客服、安全、電子錢包、加密貨幣）：寫檢查清單與方法，不寫品牌排名。

## 9. 交付前自檢（寫手自己做）
- [ ] front-matter 齊全、`image` 路徑格式對、`sources` ≥ 2 且打得開
- [ ] 1,800～2,800 字；H2 ≥ 4；`:::david` ≥ 2；FAQ 3～5；內連 ≥ 3
- [ ] 沒有禁用句、沒有品牌推薦、沒有管道
- [ ] 每個數字都查得到來源（官方頁或 data 檔）
- [ ] 讀一遍：像不像一個工程師在跟朋友講話？不像就重寫開場與 david 框
