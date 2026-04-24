import react from '@vitejs/plugin-react'

// 🚀 強制更新 Vercel 緩存 (2026-04-24)
// 徹底移除 defineConfig 以繞過 Vercel 編譯器解析錯誤
export default {
  plugins: [react()],
  build: {
    // 確保支援 esnext 以解決 import.meta 的編譯錯誤
    target: 'esnext'
  }
}