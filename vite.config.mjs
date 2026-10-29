import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // VITE_* values come from the project-root .env (or the hosting dashboard).
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Demo deploys show the "Try demo as Farmer / Buyer" buttons by default.
  // Set VITE_DEMO_MODE=false for a real customer launch.
  const demoMode = env.VITE_DEMO_MODE ?? 'true'
  return {
  root: 'frontend',
  envDir: '..',
  define: { 'import.meta.env.VITE_DEMO_MODE': JSON.stringify(demoMode) },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Keep big libraries in their own long-cached files.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true
      }
    }
  }
}
})
