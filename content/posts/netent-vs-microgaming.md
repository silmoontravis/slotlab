---
id: netent-vs-microgaming
permalink: /blog/posts/netent-vs-microgaming
title: NetEnt vs Microgaming：兩大老牌遊戲商的 RTP 與設計哲學比較
category: guides
crumb: blog
tags: []
date: '2026-04-17'
updated: '2026-10-04'
description: NetEnt 與 Microgaming 比較：NetEnt 官網七款經典老虎機的 RTP 從 95.97% 到 99.00%，Microgaming 則以 Mega Moolah 的金氏世界紀錄彩金聞名。我用查得到的官方資料講兩家的設計哲學差在哪，以及為什麼比較「遊戲商」其實沒什麼意義。
excerpt: 用官方數字比 NetEnt 與 Microgaming：一家把 RTP 寫在臉上，一家把夢做到金氏紀錄。
readTime: 5
image: /images/posts/netent-vs-microgaming.png
keywords: [NetEnt Microgaming 比較, 老虎機遊戲商, 老虎機 RTP]
sources:
  - https://netent.com/games/starburst
  - https://netent.com/games/gonzos-quest
  - https://netent.com/games/dead-or-alive-2
  - https://netent.com/games/blood-suckers
  - https://netent.com/games/mega-joker
  - https://netent.com/games/jackpot-6000
  - https://en.wikipedia.org/wiki/Evolution_AB
  - https://www.guinnessworldrecords.com/world-records/largest-jackpot-payout-in-an-online-slot-machine-game
  - https://www.gamblingcommission.gov.uk/manual/remote-gambling-and-software-technical-standards/rts-9-progressive-jackpot-systems
related:
  - /rtp/rtp-by-provider
  - /blog/posts/jackpot-types-explained
  - /blog/posts/pragmatic-play-review
faq:
  - q: NetEnt 跟 Microgaming 哪家 RTP 比較高？
    a: 這題沒有意義，因為 RTP 是一款一款定的。NetEnt 官網同一家公司就有 95.97%（Gonzo's Quest）到 99.00%（Mega Joker）的跨度。Microgaming 的遊戲我找不到官方公開的 RTP 頁面，所以不列數字。
  - q: NetEnt 現在還存在嗎？
    a: 品牌還在，公司已被併購。維基百科的 Evolution AB 條目記載 Evolution 於 2020 年收購 NetEnt 與 Red Tiger，netent.com 仍持續列出遊戲資訊。
  - q: Mega Moolah 的紀錄是多少？
    a: 金氏世界紀錄官網記載：線上老虎機最大單筆彩金為 €17,879,645，由英國玩家 Jon Heywood 於 2015 年 10 月 6 日在 Microgaming 的 Mega Moolah 贏得。之後有更大的派彩新聞，但我只引金氏官網查得到的這筆。
  - q: 選遊戲要看遊戲商嗎？
    a: 看，但只看兩件事：它有沒有公開每款遊戲的 RTP、它有沒有在會查驗 RTP 的市場拿牌。其他像「風格」「創新」都是主觀的，不影響你的期望值。
status: published
---

「NetEnt 跟 Microgaming 哪家比較好？」這是我被問過最多次的遊戲商問題之一，大概因為兩家都是 1990 年代就存在的老牌，而且各自有一款全世界都認得的代表作：NetEnt 的 Starburst，Microgaming 的 Mega Moolah。

我原本想做一張兩家「平均 RTP」的對照表，結果做到一半發現這個比法根本不成立。這篇就講我查到了什麼、為什麼比不了、以及你真正該比的是什麼。

:::tip
**TL;DR**
- NetEnt 官網公開每款遊戲的 RTP、命中率、最大倍數；我抄了六款，RTP 從 95.97% 到 99.00%，同一家公司跨度超過 3 個百分點——「遊戲商平均 RTP」沒有意義。
- Microgaming 的強項是累積彩金：金氏世界紀錄官網記載 Mega Moolah 在 2015 年派出 €17,879,645 的線上老虎機最大單筆彩金。但累積彩金類遊戲的基礎 RTP 通常被彩金抽走一部分。
- 兩家公司都已換主：Evolution 在 2020 年收購 NetEnt；Microgaming 的遊戲現在歸 Games Global 平台發行。
:::

## NetEnt：把 RTP 寫在官網上的公司

NetEnt 最讓我這種數據控欣賞的一點，是它的官網遊戲頁直接列出 RTP、命中率（hit frequency）、最大倍數、盤面、投注範圍。不用登入、不用問客服。下面六款是我這次抄下來的：

| 遊戲 | 官網 RTP | 命中率 | 最大倍數 | 盤面 | 一句話特色 |
|---|---|---|---|---|---|
| Mega Joker | 99.00% | 17% | 200x | 3×3 | 復古水果機，RTP 最高 |
| Jackpot 6000 | 98.90% | 10% | 600x | 3×3 | 同樣復古，命中率極低 |
| Blood Suckers | 98.00% | 45% | 900x | 5×3 | 高命中、低波動的代表 |
| Dead or Alive 2 | 96.80% | 30% | 1,600x | 5×3 | 黏性 Wild，高波動 |
| Starburst | 96.08% | 23% | 800x | 5×3 | 全球最多人玩過的老虎機之一 |
| Gonzo's Quest | 95.97% | 41% | 2,200x | 5×3 | 消除＋倍率，主遊戲最高 5x、免費遊戲 15x |

你看出來了：**同一家公司，RTP 從 95.97% 到 99.00%**。如果我把這六款平均一下得到 97.5%，然後說「NetEnt 的 RTP 是 97.5%」，那對你選 Gonzo's Quest 的人來說是誤導，對選 Mega Joker 的人也是。RTP 是遊戲層級的屬性，不是公司層級的。

另一個觀察：Gonzo's Quest 是 NetEnt 在 2010 年代初推出的消除＋倍率機制遊戲，官網寫主遊戲倍率逐次加 1 最高到 5x、免費遊戲最高 15x。這套「消除加倍率」後來被 [Pragmatic Play](/blog/posts/pragmatic-play-review) 放大成 500x、1,000x 的版本。NetEnt 是先行者，但它的版本保守得多。

:::david
我原本以為 Starburst 的 RTP 是 96.09%，因為全網都這樣寫，我自己舊文也這樣寫。打開 NetEnt 官網一看：96.08%。我盯著那個 8 看了十秒，確認不是我眼花。這個差距對你的錢包沒影響，但它讓我重新體會到一件事：**第三方數字是會過期的，官網才是活的。** 所以這篇只引官網。
:::

## Microgaming：把夢做到金氏紀錄的公司

Microgaming 的故事跟 NetEnt 完全不同。它最出名的不是哪款遊戲 RTP 多高，而是 **Mega Moolah 這台累積彩金機**。金氏世界紀錄官網記載：「線上老虎機最大單筆彩金為 €17,879,645，由 Jon Heywood（英國）於 2015 年 10 月 6 日在 Microgaming 的 Mega Moolah 贏得。」

這就是 Microgaming 的設計哲學——**不跟你比 RTP，跟你比夢的大小**。而這個哲學有個數學代價：累積彩金的錢不是天上掉下來的，是從每一注抽一小部分進彩金池。英國 UKGC 的 RTS 9 規範就要求業者在遊戲規則裡說明彩金「如何注資、起始種子金額、是否有上限」，並且 RTP 可以用「基礎遊戲＋彩金」合併或分開顯示。換句話說，一台標 RTP 94% 的彩金機，可能是「基礎遊戲 88% ＋ 彩金 6%」——而那 6% 你幾乎一輩子拿不到。我在[累積獎池 vs 固定獎池](/blog/posts/jackpot-types-explained)那篇有算這件事。

這裡我必須坦白一件事：**我找不到 Microgaming／Games Global 官方公開的單款 RTP 頁面**。Games Global 的官網是產品與新聞導向，沒有像 NetEnt 那樣逐款列數字。網路上流傳的「Mega Moolah RTP 88.12%」「Thunderstruck II 96.65%」我沒辦法對到官方頁，所以這篇一個 Microgaming 遊戲的 RTP 都不寫。這不是 Microgaming 遊戲不好，是它的公開透明度不如 NetEnt——而這本身就是一個比較結果。

## 兩家公司現在都不是原來的公司

比較「NetEnt vs Microgaming」還有個尷尬之處：兩家都換過主人。

- **NetEnt**：維基百科 Evolution AB 條目記載，Evolution 在 2020 年收購了 NetEnt 與 Red Tiger（Red Tiger 在 2019 年先被 NetEnt 以 £220m 收購），2021 年再收購 Big Time Gaming。Evolution 本業是真人娛樂場，NetEnt 現在是它老虎機事業的一部分。
- **Microgaming**：它的遊戲內容現在透過 Games Global 平台發行，Games Global 官網上列的是多家工作室的作品，Mega Moolah 系列也在其中。

所以今天你看到的「NetEnt 新遊戲」，背後是 Evolution 集團的策略；「Microgaming 遊戲」則是 Games Global 底下多個工作室的產出。品牌還在，但「風格」已經不是 2010 年那回事了。

## 真正該比的三件事（不是品牌）

我整理完這些，對「選遊戲商」的看法變成這樣：

| 該比的事 | NetEnt（我查到的） | Microgaming／Games Global（我查到的） |
|---|---|---|
| 是否公開每款 RTP | 是，官網逐款列 RTP、命中率、最大倍數 | 官網沒有逐款 RTP 頁，我沒查到 |
| 是否在會驗 RTP 的市場拿牌 | 母公司 Evolution 在歐美多地設有持牌工作室 | Games Global 官網未列明，我沒查到可引用的頁面 |
| 設計哲學 | 從 99% 復古機到 2,200x 消除機都有，光譜很寬 | 以累積彩金系列聞名，賣「大夢」 |

第一列是最重要的。一家願意把 RTP 貼在官網的公司，等於接受全世界檢查；一家只讓你在遊戲內看的，不代表數字有問題，但你查證的成本高很多。

至於「哪家風格比較創新」「哪家畫面比較好看」——這些是喜好，不是數學。我會玩 Blood Suckers 不是因為 NetEnt 比較厲害，是因為它 98% RTP、45% 命中率的組合讓我可以用一杯咖啡的錢玩一個晚上。

:::david
寫到這裡我有點感慨。這篇舊版本的標題是「兩大遊戲巨頭完整比較」，內文幫兩家各打了「創新程度 ★★★★」之類的分數。我現在看那些星星，完全不知道它們是從哪裡來的——因為根本沒有來源，就是模板。重寫之後星星全拿掉了，換成一張「我查得到／我查不到」的表。沒那麼好看，但誠實。
:::

## 常見問題

**NetEnt 跟 Microgaming 哪家 RTP 比較高？**
這題沒有意義，因為 RTP 是一款一款定的。NetEnt 官網同一家公司就有 95.97%（Gonzo's Quest）到 99.00%（Mega Joker）的跨度。Microgaming 的遊戲我找不到官方公開的 RTP 頁面，所以不列數字。

**NetEnt 現在還存在嗎？**
品牌還在，公司已被併購。維基百科的 Evolution AB 條目記載 Evolution 於 2020 年收購 NetEnt 與 Red Tiger，netent.com 仍持續列出遊戲資訊。

**Mega Moolah 的紀錄是多少？**
金氏世界紀錄官網記載：線上老虎機最大單筆彩金為 €17,879,645，由英國玩家 Jon Heywood 於 2015 年 10 月 6 日在 Microgaming 的 Mega Moolah 贏得。之後有更大的派彩新聞，但我只引金氏官網查得到的這筆。

**選遊戲要看遊戲商嗎？**
看，但只看兩件事：它有沒有公開每款遊戲的 RTP、它有沒有在會查驗 RTP 的市場拿牌。其他像「風格」「創新」都是主觀的，不影響你的期望值。

## 延伸閱讀

- [各大遊戲商 RTP 排行榜](/rtp/rtp-by-provider) — 想看更多家的話去那篇，但記得這篇的提醒：平均 RTP 是假議題。
- [累積獎池 vs 固定獎池](/blog/posts/jackpot-types-explained) — Mega Moolah 那種機台的錢從哪來、你的 RTP 被抽走多少。
- [Pragmatic Play 遊戲商解析](/blog/posts/pragmatic-play-review) — 把 NetEnt 的消除倍率放大十倍的後輩，看它怎麼做。
- [高 RTP 老虎機清單](/blog/posts/high-rtp-slots-2026) — 表格裡那幾款 98%、99% 的 NetEnt 機台，在那篇有更完整的比較。
