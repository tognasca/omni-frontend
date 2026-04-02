import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'https://chatboxapi.ademartognasca.com.br', changeOrigin: true },
      '/hubs': { target: 'https://chatboxapi.ademartognasca.com.br', ws: true, changeOrigin: true },
      '/swagger': { target: 'https://chatboxapi.ademartognasca.com.br', changeOrigin: true }
    }
  }
})
