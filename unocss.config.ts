import {
  defineConfig,
  presetIcons,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';
import presetAnimations from 'unocss-preset-animations';
import { presetShadcn } from 'unocss-preset-shadcn';

export default defineConfig({
  presets: [
    presetIcons(),
    presetWind3(),
    presetAnimations(),
    presetShadcn({
      color: false,
    }),
    presetWebFonts({
      fonts: {
        sans: 'Geist Sans',
        mono: 'Geist Mono',
      },
    }),
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        '(components|src)/**/*.{js,ts}',
      ],
    },
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
