import react from '@vitejs/plugin-react-swc';
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';
import { ViteMcp } from 'vite-plugin-mcp';
import terminal from 'vite-plugin-terminal';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [terminal({ console: 'terminal' }), react(), unocss(), ViteMcp()],
});
