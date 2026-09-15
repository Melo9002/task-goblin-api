import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  server: { proxy: { '/tasks': 'http://127.0.0.1:8080' } },
  build: { target: 'es2022' },
});
