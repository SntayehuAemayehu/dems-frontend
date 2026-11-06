import { defineConfig, transformWithOxc } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const transformJsxInJs = () => ({
  name: 'transform-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.match(/src\/.*\.js$/)) return null;
    return await transformWithOxc(code, id, { lang: 'jsx' });
  },
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    transformJsxInJs(),
  ],
  server: {
    port: 3000,
  },
 
  // Add this block to stop the dependency scanner from crashing
  optimizeDeps: {
    entries: [], 
  },
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:8000/api'),
  },
});