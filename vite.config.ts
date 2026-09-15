import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: {
        ignored: [
          '**/system_config.json',
          '**/user_notes.json',
          '**/user_notes_cache.json',
          '**/.git/**',
          '**/node_modules/**'
        ],
      },
    },
  };
});
