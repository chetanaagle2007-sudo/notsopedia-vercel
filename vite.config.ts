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
    build: {
      // Raise the warning threshold slightly — pptxgenjs is already code-split,
      // so the remaining chunks are justified in size.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            // React runtime — changes rarely, benefits most from long-term caching
            'vendor-react': ['react', 'react-dom'],
            // Supabase client — large but stable dependency
            'vendor-supabase': ['@supabase/supabase-js'],
            // Lucide icon library — tree-shaken but still sizeable
            'vendor-lucide': ['lucide-react'],
          },
        },
      },
    },
  };
});
