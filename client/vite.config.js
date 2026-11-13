import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api calls go to the Express backend, so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
