# 馬尼雙軌營運引擎 — 開發紀錄

**專案名稱：** 馬尼雙軌營運引擎 / Money Engine 電商工具箱  
**線上網址：** https://ec-copywriting-generator.vercel.app  
**GitHub：** https://github.com/daliphone/EC-copywriting-generator  
**最後更新：** 2026-05-09

---

## 專案目標

馬尼通訊多平台電商文案自動化，減少人工撰寫標題與商品文案的時間成本。  
支援蝦皮、momo、PChome、Yahoo 四大平台同步輸出，結合規則引擎與 AI 生成雙軌並行。

---

## 技術架構

```
使用者瀏覽器
    ↓ VITE_INTERNAL_TOKEN
Vercel Serverless  /api/ai.js
    ↓ INTERNAL_TOKEN 驗證 + GEMINI_API_KEY
Google Gemini 2.5 Flash
```

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite 5 + Tailwind CSS 3 |
| 後端 | Vercel Serverless Function（`/api/ai.js`）|
| AI | Google Gemini 2.5 Flash |
| 部署 | Vercel（自動 CI/CD，push 即部署）|
| 架構 | BFF（Backend For Frontend）— API Key 不暴露前端 |

---

## 工具模組

### 雙軌標題引擎（Title Engine）

| 軌道 | 說明 |
|------|------|
| 規則軌 | 依平台格式規則組合，保底合規，不需 AI |
| AI 軌 | Gemini 依平台規範生成創意標題 + 策略說明 |

**平台規範（依官方文件確認）：**

| 平台 | 字數上限 | 促銷字 | 格式重點 |
|------|---------|--------|----------|
| 蝦皮 | 120 字 | ✅ 允許 | 品牌＋型號＋規格＋賣點，前 30 字放最重要關鍵字 |
| momo | 60 字 | ❌ 禁止 | 品牌＋品名＋特色關鍵字，嚴禁活動/贈送/熱銷/代言等 |
| Yahoo | 60 字 | ✅ 允許 | 促銷標籤可放前段，品牌＋型號＋規格 |

**momo 違規詞庫（14 個）：**  
活動、贈送、代言、熱銷、限時、下殺、折扣、特價、爆款、免運、免費、優惠、搶購、瘋搶

### AI 文案產生器（Copywriter）

| 模式 | 說明 |
|------|------|
| 模組文案 | 套用預設模板快速產出，模板可自訂（localStorage 保存）|
| AI 智能生成 | Gemini 依平台特性生成文案＋標題＋SEO 標籤 |

**支援平台：** 蝦皮 / momo / PChome / Yahoo  
**文案風格：** 專業 / 親切 / 活潑 / 促銷急迫

---

## 核心功能清單

| 功能 | 說明 | 狀態 |
|------|------|------|
| Smart Paste AI 解析器 | 貼上原始商品資訊自動拆解填入欄位 | ✅ |
| 通用違規詞黑名單 | 偵測誇大不實、醫療聲稱、導外詞彙 | ✅ |
| momo 專屬違規詞庫 | 14 個促銷相關禁用詞即時攔截 | ✅ |
| AI 賦能參數欄位 | 賣點 / 目標族群 / SEO 關鍵字可摺疊輸入 | ✅ |
| AI 生成獨立 loading | AI 軌與規則軌分離，各有獨立狀態 | ✅ |
| 字元三色徽章 | 綠（安全）/ 黃（≥85%）/ 紅（超限）| ✅ |
| 平台規範即時提示 | 切換平台顯示該平台撰寫規則 | ✅ |
| 複製 clipboard API | navigator.clipboard + execCommand fallback | ✅ |
| 佈局切換 | 傳統雙欄 / 全域頂部 兩種模式 | ✅ |
| 模組設定 | 文案模板可自訂並 localStorage 保存 | ✅ |
| BFF 安全層 | INTERNAL_TOKEN 驗證，API Key 不外洩 | ✅ |
| 限流防護 | 2,000 req/day（Serverless 實例層級）| ✅ |
| Schema 正規化 | normalizeSchema() 處理 Gemini type 大小寫 | ✅ |
| API 重試機制 | fetchWithRetry() 自動處理 503/429，指數退避 | ✅ |

---

## 環境變數

### Vercel Dashboard（需手動設定）

```
GEMINI_API_KEY=<Google AI Studio Key>
INTERNAL_TOKEN=<自訂暗號，任意字串>
VITE_INTERNAL_TOKEN=<與 INTERNAL_TOKEN 相同>
```

> `INTERNAL_TOKEN`：後端驗證用途，防止 `/api/ai` 被外部直接呼叫，非網頁登入密碼。  
> `VITE_` 前綴：Vite 必須有此前綴才會將環境變數打包進前端 bundle。

### 本機開發

建立 `.env.local`（已加入 `.gitignore`，不會上傳 GitHub）：

```
VITE_INTERNAL_TOKEN=<同上>
```

---

## 版本歷程

### V1.7（舊版）
- 純 HTML 單檔版，位於 `Downloads/Money-software-tool/馬尼通訊 雙軌標題引擎/`
- AI 軌為模擬假資料，無真實 API 串接

### money-engine（過渡版）
- React 版，使用 Gemini 1.5 Flash
- 問題：無 schema 正規化、無重試機制、`.env.local` 格式錯誤

### EC-copywriting-generator（現行正式版）—— 2026-05-09

修正的 6 項問題：

1. **蝦皮字數上限錯誤**：原為 100 字，依官方文件更正為 120 字
2. **Yahoo 格式錯誤**：原壓縮至 24 字，更正為標準 60 字格式
3. **momo 違規詞庫缺漏**：新增 `MOMO_TITLE_BLACKLIST` 14 個禁用詞
4. **AI 載入狀態混用**：新增獨立 `isAiGenerating` state，AI 軌與規則軌分離
5. **AI 賦能參數無 UI**：補上賣點 / 目標族群 / SEO 關鍵字可摺疊輸入區塊
6. **複製功能相容性**：改用 `navigator.clipboard.writeText` + `execCommand` fallback

---

## 已知限制

| 項目 | 說明 |
|------|------|
| 限流非持久 | `global.usageCount` 在 Serverless 冷啟動後歸零，無法跨實例計數 |
| 無歷史紀錄 | 產出的標題與文案關閉後即消失 |

---

## 待開發功能

| 優先 | 功能 | 說明 |
|------|------|------|
| 高 | LocalStorage 歷史紀錄 | 保存已產出的標題與文案，方便對照回溯 |
| 中 | 匯出 CSV | 批量標題可直接匯出貼到試算表 |
| 中 | 多模型備援 | Gemini 失效時自動切換備用模型 |
| 低 | 真實限流（Redis/KV）| 需接 KV Store 做跨實例持久化計數 |
| 低 | 使用量儀表板 | 在 Vercel 之外獨立顯示 API 用量統計 |
