import react from '@vitejs/plugin-react-oxc';
import unocss from 'unocss/vite';
import { defineConfig } from 'vite';
import terminal from 'vite-plugin-terminal';

// https://vite.dev/config/
export default defineConfig((config) => ({
  build: {
    sourcemap: true,
  },
  plugins: [config.mode === 'development' ? terminal() : [], react(), unocss()],
}));
