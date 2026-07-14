# 跨產業職涯規劃器 (Cross-Industry Career Planner)

一套專為「多條事業賽道並行」打造的個人超級基礎建設。把每個產業的檢核表渲染成可勾選、可視覺化、可匯出覆核 prompt 的單頁 Web App。

> 盈利的不是系統本身，而是「被系統強化後的你」。
> 透過將所有低壓嗜好转化為可重複使用的任務資產，打造具備「無限選擇權」的個人超級生態系。

---

## 技術棧

- **前端框架**：Next.js 15 (App Router)
- **UI 函式庫**：React 19 + Tailwind CSS 3
- **動畫**：Framer Motion（用於檢核表切換、子任務展開、recurring / done 狀態過渡）
- **資料來源**：兩份 JSON（`src/data/industries.json` + `src/data/workflows.json`），無後端，無 DB
- **狀態保存**：瀏覽器 `LocalStorage`（記錄使用者勾選進度，key = `cross-industry-career-planner-progress-v3`）
- **部署**：Vercel（從 GitHub `main` 分支自動部署）

---

## 四個產業賽道

| ID | 名稱 | 主題色 | 主戰場 |
|---|---|---|---|
| `qingxi-design` | 青曦設計（Qingxi Design） | dusty（藕粉） | 室內設計接案首案成交、防禦型提案素材 |
| `arrive-studio` | 築時數位（Vibe Coder 實戰） | terracotta（陶土紅） | 模組化接案 + 微型系統訂閱 |
| `vanbase` | VanBase 老車車宿網站 | sage（草綠） | 老車車宿內容站 + 微型 SaaS |
| `omnisonic` | OmniSonic 四頻道情境音樂 | slate（石板灰） | 音樂 SaaS：Web Audio API + 商轉內容生產 |

完整檢核表內容請看 [`src/data/workflows.json`](./src/data/workflows.json)。

---

## 這個專案的架構（一句話版）

**JSON 是大腦、元件是嘴巴、路由是嘴巴露出來的入口。**

改資料（JSON）→ 自動改顯示；改顯示（元件）→ 永遠只在「怎麼漂亮地呈現」上改，**不能動到任務本身**。

---

## 三層結構圖

```
┌──────────────────────────────────────────────────────────────┐
│  src/data/  ← 所有資料的家（4 份 JSON）                       │
│                                                              │
│  industries.json    「我是誰」                                │
│                     4 個產業的中英文名、主題色、簡介、資源連結   │
│                                                              │
│  workflows.json     「我要做什麼」                            │
│                     每個產業的檢核表（三層遞迴：任務→子任務→孫） │
│                                                              │
│  skills.json        「我會什麼」                              │
│                     18 項跨產業技能 + 成熟度 + 對應任務          │
├──────────────────────────────────────────────────────────────┤
│  src/components/  ← UI 元件（只負責把資料畫出來）              │
│                                                              │
│  career-planner-app.tsx    主畫面                            │
│                             左側選產業、右側看檢核表、底部打包  │
│                                                              │
│  skills-panel.tsx          技能樹面板                        │
│                             顯示技能 × 成熟度 × 適用產業        │
├──────────────────────────────────────────────────────────────┤
│  src/app/  ← 對外入口（URL）                                  │
│                                                              │
│  /                       主頁                                 │
│                                                              │
│  /embed/[industry]       嵌入版（給其他專案用 iframe 嵌進去）   │
│                          一個產業一條，總共 4 條靜態路由         │
│                          嵌入版拿掉左側選單，畫面更乾淨          │
└──────────────────────────────────────────────────────────────┘
```

---

## 為什麼這樣切？

| 層 | 只管什麼 | 不管什麼 |
|---|---|---|
| **JSON** | 資料的內容、結構、分類 | UI 長怎樣、按鈕放哪裡 |
| **元件** | 怎麼畫、怎麼互動、怎麼過場 | 任務內容（不能硬編進來） |
| **路由** | 對外的 URL 長相 | 業務邏輯（邏輯都在元件裡） |

**好處：**

- 換任務 → 只動 JSON，不會動到 React
- 改 UI → 只動元件，不會誤改資料
- 想嵌入 → 加路由即可，現成資料直接吃
- 資料永遠只有一個版本 → 不會出現「網頁顯示的跟 JSON 寫的不一樣」這種 bug

---

## 新增功能的標準 SOP

要做新東西之前，先問自己：

1. **這是資料還是 UI？**
   - 資料 → 寫進 JSON，現成元件應該會自動渲染
   - UI → 寫元件或樣式

2. **這要不要被嵌入？**
   - 要 → 放 `src/app/embed/` 路由
   - 不要 → 放主頁（`src/app/page.tsx`）

3. **有沒有需要記住的狀態？**
   - 用 `LocalStorage`（已經有範例：勾選進度的儲存 key）
   - **不需要雲端**——這是刻意設計，避免依賴後端

---

## 這個專案未來的藍圖（接下來要怎麼走）

> 這份藍圖是整個專案**未來的結構與步驟說明書**。跟上面的「架構藍圖」互補：上面那段是「現在長怎樣」，這段是「接下來要往哪走」。

### 整體定位

這是一套**不對外賣、只給自己用**的個人工作台。賺錢的不是這個系統本身，而是「被這個系統訓練出來的你」——把所有玩著玩著就會的事情，變成可以重複使用的技能模塊，最後達到「什麼都能接、什麼都能選」的人生自由度。

### 技術架構（先講清楚再開始）

| 面向 | 規定 | 為什麼這樣 |
|---|---|---|
| 寫程式 | Cursor 本地端 | AI 助理可以直接進來改檔案 |
| 討論與覆核 | 網頁版 LLM | 把草稿拿去給外部 AI 看，給意見、改錯字 |
| 前端 | Next.js + React + Tailwind（不用 CDN） | 比早期「單一 HTML」更正式，方便維護 |
| 資料 | 全部 LocalStorage，無後端無資料庫 | 不被任何服務綁架，重整網頁東西還在 |
| 跟外部 AI 合作 | 系統產生 prompt → 手動複製 → 外部 AI 跑 → 手動貼回 | 不接 API key，零依賴、零成本 |

### 介面規劃（畫面長怎樣）

早期規劃是「三欄式」：

- **左欄**：賽道列表，點一下切換
- **中欄**：任務區，分三個分頁（專案 / 新建立項 / 召喚 CSO）
- **右欄**：技能雷達圖 + 熱力雲

實作到後來變成「兩欄 + 底部技能面板」，因為現有規模三欄會塞不下。但原始藍圖的核心精神都還在：

- **雷達圖**：技能成熟度取代經驗值，更貼近真實能力光譜
- **熱力雲**：技能標籤依成熟度變深淺
- **CSO 模組**：從「按鈕產生 prompt」進化成可持續對話的策略顧問

### 里程碑：現在到哪、接下來走哪

| 里程碑 | 狀態 | 完成了什麼 |
|---|---|---|
| **M0：藍圖定稿 + 資料結構** | ✅ 完成 | 4 個產業 metadata、完整檢核表、18 項技能，全部寫進 JSON |
| **M1：單頁 + 技能面板** | ✅ 完成 | 主頁可切產業、技能面板可看技能 × 成熟度 × 適用產業 |
| **M2：一鍵複製 prompt 工作流** | ✅ 完成 | 主面板下方 + 圓環儀表板上方都有「複製給 LLM」按鈕 |
| **M3：勾選即時連動 + CSO 模組** | ✅ 完成 | 勾任務 → 進度更新 → 可打包整體狀態給外部 CSO 分析 |
| **M4：模組化資產庫** | ⏳ 待開發 | 等專案累積到一定數量再做（封裝可重複用的素材） |
| **M5：技能 Node-Graph** | ⏳ 待開發 | 等底層技能超過 20 項再做（互動式節點圖） |

---

## 本地啟動

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（http://localhost:3000）
npm run dev

# TypeScript 型別檢查
npx tsc --noEmit

# 構建生產版本
npm run build

# ESLint
npm run lint
```

> Node 版本需求：v18.18+

---

## 資料模型細節（給要改 JSON 的人）

> 不知道為什麼這樣切？回頭看上面的「這個專案的架構（一句話版）」。

### `src/data/industries.json`

每個產業必須包含：

```ts
{
  id: string,          // kebab-case，例：omnisonic
  name: string,        // 完整標題
  shortLabel: string,  // ≤6 字
  theme: 'sage' | 'dusty' | 'terracotta' | 'slate',
  overview: string,    // 一段話概述
  details: string[],   // 補充細節
  legend: string[],    // 圖例
  resourceLinks: { label: string, url: string }[]
}
```

### `src/data/workflows.json`

結構：`{ [industryId]: { sections, faq } }`。

`section.items` 為三層遞迴結構（最多到 children 再 children），每個任務的 `status` 只能是：

- `pending`：單次待辦
- `recurring`：週期性重複作業（UI 顯示「本輪已執行 / 待執行」按鈕）
- `done`：已完成（僅用於 JSON 預設值，UI 端統一透過 `LocalStorage` 覆寫）

### 主題色鎖定

每個產業綁定唯一主題色。**新增產業時必須同步修改**：

1. `tailwind.config.js` — 擴充色票
2. `src/components/career-planner-app.tsx` — `ThemeName` 型別 + `themeStyles` 物件
3. `tsconfig.json` — `paths` 別名 `@/data/*`

---

## AI 協作規範（Cursor + 網頁版 LLM 雙軌）

詳見根目錄的 [`.cursorrules`](./.cursorrules) 系統憲法。

重點摘要：

- 我是 Cursor AI，同時兼任策略長 (CSO) 三職：資料萃取 / 跨界槓桿 / 程式碼覆核
- 商業層面的「資料萃取」「JSON 逆向工程」「跨產業槓桿分析」都由我直接做，**不需另開網頁版 LLM**
- 「內容生成」任務（文案、貼文、報價單）則在系統內按「一鍵複製」按鈕 → 把 prompt 帶去任何外部 LLM → 拿回答案貼回

### 兩種 Copy 模式

| 模式 | 用途 | 觸發點 |
|---|---|---|
| 單一產業覆核 | 高階 LLM 對**當前產業**做內容審核與微調建議 | 主面板下方「一鍵複製給高階 LLM 覆核」 |
| **全站 CSO 打包** | 高階 LLM 對**四產業組合**做宏觀戰略決策、提示槓桿點與組合風險 | 圓環儀表板上方「一鍵打包給 CSO」 |

---

## 進度保存

- 自動透過 `LocalStorage` 保存（每次勾選即時寫入）
- 換瀏覽器、清除快取、或更換裝置需重新勾選——目前無雲端同步（這是刻意設計，避免依賴後端）
- 如要重置：瀏覽器 DevTools → Application → Local Storage → 刪除 `cross-industry-career-planner-progress-v3`

---

## Vibe Coding 專案準則（內在精神）

- **不跳關**：先做完前一階段，再進下一階段
- **零固定成本**：能免費額度（Vercel + Supabase + Suno）就跑，獲利前不投入月費工具
- **自用滿意優先**：第一個使用者就是作者自己，要先「Dogfooding」才上市
- **策展大於修補**：瑕疵品直接丟棄重新生成，不靠 DAW 硬拉 BPM，也不靠程式碼堆砌掩蓋設計缺陷

---

## Push 前驗證 SOP

```bash
# 1. JSON 結構完整（產業 vs 工作流 key 一致）
node -e "const i=require('./src/data/industries.json'); const w=require('./src/data/workflows.json'); i.forEach(x => console.log(x.id, w[x.id] ? 'OK' : 'MISSING'))"

# 2. TypeScript 編譯零錯誤
npx tsc --noEmit

# 3. ESLint 零警告
npm run lint
```

---

## 授權

本專案為作者自用工具，不對外授權、不對外販售。
