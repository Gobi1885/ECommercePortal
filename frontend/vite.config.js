import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During `npm run dev`, requests to /api and the /socket.io websocket
// are proxied straight to the Express backend on :4000. This means the
// frontend code can always talk to a relative URL and never has to think
// about CORS or hardcoded hosts in development. In production, set
// VITE_API_URL to your deployed backend URL instead (see frontend/.env.example).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
});
