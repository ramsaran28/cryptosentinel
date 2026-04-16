import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/mastra': {
        target: 'http://localhost:4111',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mastra/, '/api'),
      },
      '/binance-api': {
        target: 'https://api.binance.us',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/binance-api/, ''),
      },
      '/binance-ws': {
        target: 'wss://stream.binance.us:9443',
        changeOrigin: true,
        secure: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/binance-ws/, ''),
      },
      '/coingecko': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/coingecko/, ''),
      },
      '/feargreed': {
        target: 'https://api.alternative.me',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/feargreed/, ''),
      },
    },
  },
})