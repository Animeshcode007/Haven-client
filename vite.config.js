import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // You can change the client port if needed
    proxy: {
      // Proxying API requests to the backend server
      '/api': {
        target: 'http://localhost:5001', // Your backend server address
        changeOrigin: true,
        // secure: false, //  if your backend is not https
        // rewrite: (path) => path.replace(/^\/api/, '') // if your backend doesn't expect /api prefix
      }
    }
  }
})
