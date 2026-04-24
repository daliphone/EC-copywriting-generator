export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext' // 🟢 加入這行可以支援 import.meta
  }
})