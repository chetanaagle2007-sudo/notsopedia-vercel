import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function pwaVersionPlugin(): Plugin {
  return {
    name: 'pwa-version-plugin',
    closeBundle() {
      const swDistPath = path.resolve(__dirname, 'dist', 'sw.js');
      if (fs.existsSync(swDistPath)) {
        let swCode = fs.readFileSync(swDistPath, 'utf-8');
        const buildVersion = `v2-${Date.now().toString(36)}`;
        swCode = swCode.replace(/const CACHE_VERSION = ["'][^"']+["'];/, `const CACHE_VERSION = "${buildVersion}";`);
        fs.writeFileSync(swDistPath, swCode, 'utf-8');
        console.log(`[PWA Plugin] Injected dynamic CACHE_VERSION="${buildVersion}" into dist/sw.js`);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), pwaVersionPlugin()],
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
