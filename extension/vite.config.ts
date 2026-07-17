import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'background.ts'),
        content: resolve(__dirname, 'content.ts'),
        popup: resolve(__dirname, 'popup.ts'),
        sidebar: resolve(__dirname, 'sidebar.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  define: {
    MEMORA_API_URL: JSON.stringify(process.env.MEMORA_API_URL || 'http://localhost:4000'),
  },
});
