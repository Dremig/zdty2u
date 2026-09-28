import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: '../web/dist',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (['http://127.0.0.1:5173', 'http://localhost:5173'].includes(req.headers.origin)) {
              proxyReq.setHeader('Origin', 'http://127.0.0.1:8765')
            }
          })
        },
      },
    },
  },
})
