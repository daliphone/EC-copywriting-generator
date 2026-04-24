import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default {
  plugins: [react()],
  build: {
    // 確保支援 esnext 以解決 import.meta 的編譯錯誤
    target: 'esnext'
  }
}