import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  // The SPA entry is app.html — NOT index.html.
  // index.html (the marketing page) is in public/ and gets served statically
  // at the domain root by Firebase Hosting without Vite touching it.
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Vite compiles app.html as the React SPA entry.
        // The built output becomes dist/app.html and is served at /app.html,
        // /admin, /pos, /portal (via firebase.json rewrites).
        app: resolve(__dirname, 'app.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/firebase/') ||
              id.includes('/node_modules/@firebase/'))     return 'firebase'
          if (id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react/'))         return 'react'
          if (id.includes('/node_modules/chart.js/') ||
              id.includes('/node_modules/react-chartjs'))  return 'charts'
        }
      }
    }
  },

  optimizeDeps: { exclude: ['firebase-admin'] },

  // Dev server: Vite serves app.html at /app.html
  // To test the marketing page locally, open public/index.html directly in a browser.
  server: { port: 3000, open: '/app.html' }
})
