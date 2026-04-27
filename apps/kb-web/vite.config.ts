import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  server: {
    port: 4020,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4010',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../../dist/kb-web',
    emptyOutDir: true,
  },
})
