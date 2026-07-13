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

## 資料架構（Single Source of Truth）

本專案的核心鐵律：**任何新增任務都必須先寫進 JSON，再由 React 渲染**。絕不允許把任務硬編進元件。

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
