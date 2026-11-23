import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api calls go to the Express backend, so no CORS setup is needed.
// Backend on another machine? Set API_URL, e.g. API_URL=http://192.168.1.20:3000
const API = process.env.API_URL || 'http://localhost:3000';
export default defineConfig({
  plugins: [react()],
  server: { host: true, proxy: { '/api': API, '/uploads': API } },
});
