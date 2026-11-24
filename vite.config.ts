import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { cet6LocalServerPlugin } from './vite-cet6-server.ts';
import { pythonRunnerPlugin } from './vite-python-runner.ts';

export default defineConfig({
  plugins: [react(), tailwindcss(), pythonRunnerPlugin(), cet6LocalServerPlugin()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});
