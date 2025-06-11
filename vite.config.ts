import reactScan from '@react-scan/vite-plugin-react-scan';
import react from '@vitejs/plugin-react-swc';
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';
import { ViteMcp } from 'vite-plugin-mcp';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    reactScan({
      enable: true,
      autoDisplayNames: true,
    }),
    unocss(),
    ViteMcp(),
  ],
});
