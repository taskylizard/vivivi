import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Unfonts from "unplugin-fonts/vite"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vanillaExtractPlugin(),
    Unfonts({
      custom: {
        families: [
          {
            name: "Geist Sans",
            local: "Geist Sans",
            src: "./node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
            // Assuming variable font, so specific weight transform might not be immediately necessary
            // transform(font) {
            //   if (font.basename === 'GeistSans-Regular') font.weight = 400;
            //   return font;
            // }
          },
          {
            name: "Geist Mono",
            local: "Geist Mono",
            src: "./node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
          },
        ],
        display: "swap",
        preload: true,
        injectTo: "head-prepend",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
