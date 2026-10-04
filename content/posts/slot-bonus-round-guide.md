---
id: slot-bonus-round-guide
permalink: /blog/posts/slot-bonus-round-guide
title: 老虎機 Bonus Round 觸發機制全解析：免費旋轉、Pick Game、Wheel 藏了多少 RTP
category: slots
crumb: blog
tags: []
date: '2026-04-10'
updated: '2026-10-04'
description: 免費旋轉、Pick Game、Wheel Bonus 是怎麼觸發的？大衛用一台觸發率 1/200 的假想機台算給你看：Bonus 可能佔了近一半 RTP，轉 200 次沒進 Bonus 的機率是 37%，轉 500 次還有 8%。看懂 Bonus 怎麼分配 RTP，你就知道「一直在輸」是正常的。
excerpt: Bonus 常常佔一台遊戲近一半的 RTP。沒進 Bonus 的時候你其實只在玩半台機，這是設計、不是運氣。
readTime: 6
image: /images/posts/slot-bonus-round-guide.png
keywords: [老虎機 Bonus Round, 免費旋轉 觸發機率, Scatter 觸發 機制, 老虎機技巧]
sources:
  - https://www.pragmaticplay.com/en/games/sweet-bonanza/
  - https://www.pragmaticplay.com/en/games/big-bass-bonanza/
  - https://www.pragmaticplay.com/en/games/gates-of-olympus/
  - https://en.wikipedia.org/wiki/Slot_machine
related:
  - /slots/free-spins-mechanics
  - /blog/posts/scatter-wild-symbols-explained
  - /blog/posts/slot-feature-buy-analysis
faq:
  - q: Bonus Round 多久會觸發一次？
    a: 每款遊戲不同，常見範圍是每 100 到 300 轉一次，但這是平均值。觸發率 1/200 的遊戲，轉 200 次都沒觸發的機率是 37%，轉 500 次都沒觸發還有 8%，這都是正常現象。
  - q: 連續很多轉沒進 Bonus，是不是快出了？
    a: 不是。每一轉的觸發機率都一樣，前面沒出不會讓下一轉比較容易出。「蓄力」「該吐了」這類說法在數學上不存在。
  - q: Bonus Round 佔 RTP 多少？
    a: 看遊戲設計，高波動遊戲常在 40% 到 60% 之間。這代表沒進 Bonus 的時候，你實際在吃的 RTP 只有標示值的一半左右。
  - q: Pick Game 選哪個格子有差嗎？
    a: 多數實作裡結果在你選之前就由 RNG 決定了，選擇只是呈現方式。有些遊戲會把結果固定在格子上，但你沒有任何資訊可以判斷哪一格比較好，期望值一樣。
status: published
---

有一陣子我每天下班都在研究同一件事：為什麼有些遊戲在沒進 Bonus 的時候，感覺像在往水溝裡丟錢，但一進免費旋轉就瞬間回血？後來我把一台假想機台的 RTP 拆開來看才懂：**Bonus 不是加分題，它常常就是遊戲的一半**。這篇講三種常見 Bonus 怎麼觸發，以及它們怎麼把 RTP 藏起來。

:::tip
**TL;DR**
- 免費旋轉、Pick Game、Wheel Bonus 的觸發全部是 RNG 決定的固定機率，沒有「蓄力」。觸發率 1/200 的遊戲，轉 200 次沒進的機率是 **37%**，轉 500 次還有 **8%**。
- 我設的假想機台裡，Bonus 貢獻了 **48%** 的 RTP。意思是沒進 Bonus 時你其實只在玩一台 RTP 約 50% 的機。
- 看懂這點之後，「一直在輸」就不再神秘：那是設計師把回報集中到 Bonus 的結果，不是你運氣差。
:::

## 三種常見 Bonus Round 與它們的觸發方式

| 類型 | 觸發方式 | 玩法 | 結果由誰決定 |
|---|---|---|---|
| 免費旋轉（Free Spins） | 畫面上出現 3 個以上 Scatter | 送 10～20 轉，常帶乘數或特殊符號 | RNG，每一轉獨立 |
| Pick Game（選格子） | 特定符號或隨機觸發 | 翻格子拿獎金、乘數或「結束」 | RNG，多數在你點之前就決定 |
| Wheel Bonus（轉輪盤） | 特定符號或累積進度條 | 轉一次輪盤決定獎金或進哪種 Bonus | RNG，輪盤格子大小是視覺不是機率 |

免費旋轉是最主流的一種。以 Pragmatic Play 的官方資料為例：Sweet Bonanza 是「4 到 6 個 Scatter 觸發 10 次免費旋轉」；Big Bass Bonanza 是「3、4、5 個 Scatter 分別給 10、15、20 轉」；Gates of Olympus 是「4 個以上 Scatter 觸發 15 次免費旋轉」。三款的 Scatter 數量門檻不同，就代表觸發率是各自設計的。

Scatter 符號本身的運作我在[Scatter 與 Wild 符號解析](/blog/posts/scatter-wild-symbols-explained)寫過，這裡只講一件事：Scatter 在每個轉輪上的格數決定了觸發率，那是[轉輪表](/blog/posts/slot-math-models)的一部分，寫在程式裡，不會變。

## 觸發率是怎麼來的：Scatter 的格數乘法

假設一台 5 轉輪的遊戲，每個轉輪有 1 格 Scatter、每輪 3 列可見、每輪 40 格。單一轉輪畫面上出現 Scatter 的機率大約是 3/40 = 7.5%。要「至少 3 個轉輪出現 Scatter」，就是一個二項分布的題目：

```python
from math import comb
p = 3/40                      # 單輪出現 Scatter 的機率
trigger = sum(comb(5,k) * p**k * (1-p)**(5-k) for k in range(3,6))
print(trigger, 1/trigger)     # 約 0.0038，約每 266 轉一次
```

算出來大約每 266 轉一次。設計師要讓觸發率變高，就多放一格 Scatter 或多開一列；要變低就反過來。這跟你怎麼按、押多少、什麼時段玩，一點關係都沒有。

:::david
我一開始也以為「連續 300 轉沒進 Bonus」是機台有問題。後來算了一下：觸發率 1/200 的話，300 轉全沒的機率是 (199/200)^300 ≈ 22%。五個玩家裡就有一個會遇到。這不是機台壞了，是我對「平均 200 轉」的想像壞了，平均值從來不保證任何一段 200 轉裡會出一次。
:::

## Bonus 藏了多少 RTP：拆開一台假想機台

我設了一台假想機台：總 RTP 96.5%、免費旋轉觸發率 1/200、每次免費旋轉平均賠 96.5 倍注（這套數字跟我在[Feature Buy 分析](/blog/posts/slot-feature-buy-analysis)用的是同一台）。

| 來源 | 每轉貢獻 | 佔總 RTP |
|---|---|---|
| 免費旋轉（1/200 × 96.5 倍） | 0.4825 倍注 | **48.3%** |
| 一般旋轉連線 | 0.4825 倍注 | 51.7%（剩下的） |
| 合計 | 0.965 倍注 | 96.5% |

這代表什麼？**當你還沒進免費旋轉的時候，你實際在玩的那台機，RTP 只有約 50%。** 每押 100 元平均只回 50 元，剩下 46.5 元被存進「免費旋轉基金」，要等觸發才一次給你。

| 轉數 | 都沒觸發的機率（1/200） |
|---|---|
| 100 轉 | 60.6% |
| 200 轉 | 36.7% |
| 300 轉 | 22.2% |
| 500 轉 | 8.2% |
| 1,000 轉 | 0.7% |

所以一個晚上轉 500 次卻一次 Bonus 都沒進的人，在這台機上每 12 個就有一個。他們那晚體驗到的 RTP 大概是 50%。

## Pick Game 與 Wheel：選擇是真的還是表演？

Pick Game 讓你翻格子，Wheel 讓你看輪盤轉。這兩種 Bonus 給人「我在做決定」的感覺，但要分清楚兩件事：

- **多數線上實作**：結果在你點之前就由 RNG 決定了，你選哪格只是決定動畫怎麼演。
- **少數實作**：結果真的綁在格子上，但你沒有任何資訊知道哪格好，所以期望值完全相同。

Wheel Bonus 的輪盤格子大小更是純視覺。一格看起來佔四分之一圓，不代表機率是 25%；真正的機率是另一張權重表。Wikipedia 老虎機條目提到的「虛擬轉輪」概念在這裡一樣適用：看到的跟算的是兩張表。

:::david
我有一次很認真地記錄某款 Pick Game 我選左上角跟右下角的結果，記了五十幾次。結論是：沒有結論，兩邊平均差不到抽樣誤差。我花了兩個晚上證明一件原本就寫在規則裡的事，但至少以後有人跟我說「選角落比較會中」我可以直接回「我試過」。
:::

## Bonus 的設計怎麼決定波動率

同樣是免費旋轉，裡面放什麼東西會讓整台遊戲的波動差很多。幾個常見的設計元件：

| 元件 | 做法 | 對波動的影響 |
|---|---|---|
| 固定轉數 | 送 10 轉，每轉照一般賠付 | 低：結果分布集中 |
| 乘數累加 | 免費旋轉中出現的乘數符號加總，套用到每次贏分 | 高：少數場次乘數疊到幾百倍 |
| 重觸發 | 免費旋轉中再出 Scatter 就加轉數 | 中高：拉長尾巴 |
| 特殊符號收集 | 收集符號升級、擴展、變 Wild | 中：平均提高但不極端 |

以 Pragmatic Play 官方頁的描述來看，Gates of Olympus 的免費旋轉是「乘數符號加入總乘數，套用到該次贏分」，乘數最高 500 倍；Sweet Bonanza 的乘數符號最高 100 倍。這類「乘數加總」的設計就是高波動 Bonus 的典型：大多數場次乘數不多、賠付普通，少數場次疊出驚人的數字。所以看到 Bonus 裡有大乘數的遊戲，就可以預期它的 Bonus 期望值被少數大場次撐著，中位數會比平均值低很多。這跟我在[Feature Buy 分析](/blog/posts/slot-feature-buy-analysis)算出「83% 的購買拿不回本」是同一件事的兩面。

## 這些知識對玩家有什麼用

你改變不了觸發率，但可以改變預期：

1. **把 Bonus 當作 RTP 的一部分，不是獎勵。** 沒進 Bonus 的時候，你是在繳「進 Bonus 的入場費」。
2. **資金要撐過好幾個觸發週期。** 觸發率 1/200 的遊戲，資金至少要能承受連續 500 轉沒 Bonus（8% 會發生），否則多數時候你是在 Bonus 出來前就離場。
3. **不要追 Bonus。** 「轉了 400 次還沒出，再 100 次一定出」是最貴的錯誤，每一轉的機率都是 1/200。
4. **要跳過等待就得付費。** 那就是 Feature Buy，它有它自己的數學，我另外寫了一篇。

免費旋轉裡面的乘數、重觸發等細節，看[免費旋轉機制](/slots/free-spins-mechanics)。

## 常見問題

**Bonus Round 多久會觸發一次？**
每款遊戲不同，常見範圍是每 100 到 300 轉一次，但這是平均值。觸發率 1/200 的遊戲，轉 200 次都沒觸發的機率是 37%，轉 500 次都沒觸發還有 8%，這都是正常現象。

**連續很多轉沒進 Bonus，是不是快出了？**
不是。每一轉的觸發機率都一樣，前面沒出不會讓下一轉比較容易出。「蓄力」「該吐了」這類說法在數學上不存在。

**Bonus Round 佔 RTP 多少？**
看遊戲設計，高波動遊戲常在 40% 到 60% 之間。這代表沒進 Bonus 的時候，你實際在吃的 RTP 只有標示值的一半左右。

**Pick Game 選哪個格子有差嗎？**
多數實作裡結果在你選之前就由 RNG 決定了，選擇只是呈現方式。有些遊戲會把結果固定在格子上，但你沒有任何資訊可以判斷哪一格比較好，期望值一樣。

## 延伸閱讀

- [免費旋轉機制](/slots/free-spins-mechanics)：進了 Bonus 之後乘數、重觸發怎麼運作。
- [Scatter 與 Wild 符號解析](/blog/posts/scatter-wild-symbols-explained)：觸發 Bonus 的符號本身是怎麼設計的。
- [Feature Buy 分析](/blog/posts/slot-feature-buy-analysis)：不想等觸發就付錢，這篇算給你看划不划算。
- [老虎機數學模型](/blog/posts/slot-math-models)：觸發率是轉輪表的一部分，想看怎麼算就看這篇。
- [什麼是 RTP](/slots/what-is-rtp)：先搞懂 RTP 是長期平均，再回來看 Bonus 怎麼切它。
