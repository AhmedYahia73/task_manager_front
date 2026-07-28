import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // افترضت أنكِ تستخدمين هذا الاستيراد
import path from 'path'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // أضيفي هذا الجزء هنا:
  server: {
    proxy: {
      '/api': {
        target: 'https://sales.systego.net',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})