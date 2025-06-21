/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  amber as amberLight,
  amberA as amberALight,
  amberDark,
  amberDarkA,
  blackA,
  blue as blueLight,
  blueA as blueALight,
  blueDark,
  blueDarkA,
  bronze as bronzeLight,
  bronzeA as bronzeALight,
  bronzeDark,
  bronzeDarkA,
  brown as brownLight,
  brownA as brownALight,
  brownDark,
  brownDarkA,
  crimson as crimsonLight,
  crimsonA as crimsonALight,
  crimsonDark,
  crimsonDarkA,
  cyan as cyanLight,
  cyanA as cyanALight,
  cyanDark,
  cyanDarkA,
  // metals
  gold as goldLight,
  goldA as goldALight,
  goldDark,
  goldDarkA,
  grass as grassLight,
  grassA as grassALight,
  grassDark,
  grassDarkA,
  // grays
  gray as grayLight,
  // Alpha colors
  grayA as grayALight,
  grayDark,
  grayDarkA,
  green as greenLight,
  greenA as greenALight,
  greenDark,
  greenDarkA,
  indigo as indigoLight,
  indigoA as indigoALight,
  indigoDark,
  indigoDarkA,
  iris as irisLight,
  irisA as irisALight,
  irisDark,
  irisDarkA,
  jade as jadeLight,
  jadeA as jadeALight,
  jadeDark,
  jadeDarkA,
  lime as limeLight,
  limeA as limeALight,
  limeDark,
  limeDarkA,
  mauve as mauveLight,
  mauveA as mauveALight,
  mauveDark,
  mauveDarkA,
  mint as mintLight,
  mintA as mintALight,
  mintDark,
  mintDarkA,
  olive as oliveLight,
  oliveA as oliveALight,
  oliveDark,
  oliveDarkA,
  orange as orangeLight,
  orangeA as orangeALight,
  orangeDark,
  orangeDarkA,
  pink as pinkLight,
  pinkA as pinkALight,
  pinkDark,
  pinkDarkA,
  plum as plumLight,
  plumA as plumALight,
  plumDark,
  plumDarkA,
  purple as purpleLight,
  purpleA as purpleALight,
  purpleDark,
  purpleDarkA,
  red as redLight,
  redA as redALight,
  redDark,
  redDarkA,
  ruby as rubyLight,
  rubyA as rubyALight,
  rubyDark,
  rubyDarkA,
  sage as sageLight,
  sageA as sageALight,
  sageDark,
  sageDarkA,
  sand as sandLight,
  sandA as sandALight,
  sandDark,
  sandDarkA,
  // bright colors
  sky as skyLight,
  skyA as skyALight,
  skyDark,
  skyDarkA,
  slate as slateLight,
  slateA as slateALight,
  slateDark,
  slateDarkA,
  teal as tealLight,
  tealA as tealALight,
  tealDark,
  tealDarkA,
  // colors
  tomato as tomatoLight,
  tomatoA as tomatoALight,
  tomatoDark,
  tomatoDarkA,
  violet as violetLight,
  violetA as violetALight,
  violetDark,
  violetDarkA,
  whiteA,
  yellow as yellowLight,
  yellowA as yellowALight,
  yellowDark,
  yellowDarkA,
} from '@radix-ui/colors';
import type { Preflight } from 'unocss';
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';
import { presetAnimations } from 'unocss-preset-animations';

type Shade =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12';

type CustomShadeCSSVaraible<T extends string> = `--${T}-${Shade}`;
type CustomColorObject<T extends string> = {
  [key in CustomShadeCSSVaraible<T>]: string;
};

type RadixShadeVariable<T extends string> = `${T}${Shade}`;
type RadixColorObject<T extends string> = {
  [key in RadixShadeVariable<T>]: string;
};

type ColorValue<T extends string> = [
  {
    [key in RadixShadeVariable<T>]: string;
  },
  {
    [key in RadixShadeVariable<T>]: string;
  },
];

type Color<K extends string> = {
  [key in K]: ColorValue<key>;
};

type Alias<K extends string, T extends string> = {
  [key in K]?: T | T[];
};

type ColorsResult<N extends string> = Record<N, Record<Shade, string>>;
type ColorsOverlayResult = Record<
  'black' | 'white',
  Record<'DEFAULT' | Shade, string>
>;

// colors

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#tomato
 */
const tomato: ColorValue<'tomato'> = [tomatoLight, tomatoDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#red
 */
const red: ColorValue<'red'> = [redLight, redDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#ruby
 */
const ruby: ColorValue<'ruby'> = [rubyLight, rubyDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#crimson
 */
export const crimson: ColorValue<'crimson'> = [crimsonLight, crimsonDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#pink
 */
const pink: ColorValue<'pink'> = [pinkLight, pinkDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#plum
 */
const plum: ColorValue<'plum'> = [plumLight, plumDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#purple
 */
const purple: ColorValue<'purple'> = [purpleLight, purpleDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#violet
 */
const violet: ColorValue<'violet'> = [violetLight, violetDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#iris
 */
const iris: ColorValue<'iris'> = [irisLight, irisDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#indigo
 */
const indigo: ColorValue<'indigo'> = [indigoLight, indigoDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#blue
 */
const blue: ColorValue<'blue'> = [blueLight, blueDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#cyan
 */
const cyan: ColorValue<'cyan'> = [cyanLight, cyanDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#teal
 */
const teal: ColorValue<'teal'> = [tealLight, tealDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#jade
 */
const jade: ColorValue<'jade'> = [jadeLight, jadeDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#green
 */
const green: ColorValue<'green'> = [greenLight, greenDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#grass
 */
const grass: ColorValue<'grass'> = [grassLight, grassDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#orange
 */
const orange: ColorValue<'orange'> = [orangeLight, orangeDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#brown
 */
const brown: ColorValue<'brown'> = [brownLight, brownDark];

// bright colors

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#sky
 */
const sky: ColorValue<'sky'> = [skyLight, skyDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#mint
 */
const mint: ColorValue<'mint'> = [mintLight, mintDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#lime
 */
const lime: ColorValue<'lime'> = [limeLight, limeDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#yellow
 */
const yellow: ColorValue<'yellow'> = [yellowLight, yellowDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#amber
 */
const amber: ColorValue<'amber'> = [amberLight, amberDark];

// grays

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#gray
 */
const gray: ColorValue<'gray'> = [grayLight, grayDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#mauve
 */
const mauve: ColorValue<'mauve'> = [mauveLight, mauveDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#slate
 */
const slate: ColorValue<'slate'> = [slateLight, slateDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#sage
 */
const sage: ColorValue<'sage'> = [sageLight, sageDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#olive
 */
const olive: ColorValue<'olive'> = [oliveLight, oliveDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#sand
 */
const sand: ColorValue<'sand'> = [sandLight, sandDark];

// metals

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#gold
 */
const gold: ColorValue<'gold'> = [goldLight, goldDark];

/**
 * @see https://www.radix-ui.com/colors/docs/palette-composition/scales#bronze
 */
const bronze: ColorValue<'bronze'> = [bronzeLight, bronzeDark];

/** Alpha colors */
const grayA: ColorValue<'grayA'> = [grayALight, grayDarkA];
const mauveA: ColorValue<'mauveA'> = [mauveALight, mauveDarkA];
const slateA: ColorValue<'slateA'> = [slateALight, slateDarkA];
const sageA: ColorValue<'sageA'> = [sageALight, sageDarkA];
const oliveA: ColorValue<'oliveA'> = [oliveALight, oliveDarkA];
const sandA: ColorValue<'sandA'> = [sandALight, sandDarkA];
const tomatoA: ColorValue<'tomatoA'> = [tomatoALight, tomatoDarkA];
const redA: ColorValue<'redA'> = [redALight, redDarkA];
const rubyA: ColorValue<'rubyA'> = [rubyALight, rubyDarkA];
const crimsonA: ColorValue<'crimsonA'> = [crimsonALight, crimsonDarkA];
const pinkA: ColorValue<'pinkA'> = [pinkALight, pinkDarkA];
const plumA: ColorValue<'plumA'> = [plumALight, plumDarkA];
const purpleA: ColorValue<'purpleA'> = [purpleALight, purpleDarkA];
const violetA: ColorValue<'violetA'> = [violetALight, violetDarkA];
const irisA: ColorValue<'irisA'> = [irisALight, irisDarkA];
const indigoA: ColorValue<'indigoA'> = [indigoALight, indigoDarkA];
const blueA: ColorValue<'blueA'> = [blueALight, blueDarkA];
const cyanA: ColorValue<'cyanA'> = [cyanALight, cyanDarkA];
const tealA: ColorValue<'tealA'> = [tealALight, tealDarkA];
const jadeA: ColorValue<'jadeA'> = [jadeALight, jadeDarkA];
const greenA: ColorValue<'greenA'> = [greenALight, greenDarkA];
const grassA: ColorValue<'grassA'> = [grassALight, grassDarkA];
const orangeA: ColorValue<'orangeA'> = [orangeALight, orangeDarkA];
const brownA: ColorValue<'brownA'> = [brownALight, brownDarkA];
const skyA: ColorValue<'skyA'> = [skyALight, skyDarkA];
const mintA: ColorValue<'mintA'> = [mintALight, mintDarkA];
const limeA: ColorValue<'limeA'> = [limeALight, limeDarkA];
const yellowA: ColorValue<'yellowA'> = [yellowALight, yellowDarkA];
const amberA: ColorValue<'amberA'> = [amberALight, amberDarkA];
const goldA: ColorValue<'goldA'> = [goldALight, goldDarkA];
const bronzeA: ColorValue<'bronzeA'> = [bronzeALight, bronzeDarkA];

/**
 * rename color variable
 *
 * ```css
 * :root {
 *    --gray-1: 252 252 252;
 *    --gray-2: 249 249 249;
 *    --gray-3: 240 240 240;
 *    --etc: etc;
 * }
 *
 * :root {
 *    --custom-gray-1: 252 252 252;
 *    --custom-gray-2: 249 249 249;
 *    --custom-gray-3: 240 240 240;
 *    --etc: etc;
 * }
 * ```
 */
export function rename<K extends string>(color: Color<K>) {
  return {
    to: <V extends string>(next: Readonly<{ [key in K]: V }>) => {
      return Object.entries(color).reduce((obj, [key, value]) => {
        obj[next[key as K]] = (value as ColorValue<string>).map((mode) => {
          return Object.entries(mode).reduce((_mode, [, value], index) => {
            _mode[`${next[key as K]}${index + 1}`] = value;
            return _mode;
          }, {} as Record<string, string>);
        }) as any;
        return obj;
      }, {} as Color<V>);
    },
  };
}

interface BuildOptions<O extends boolean> {
  overlay?: O;
  selector?: 'attribute' | 'class';
}

interface BuildResult<A extends string, O extends boolean> {
  colors:
    & ColorsResult<A>
    & (O extends true | undefined ? ColorsOverlayResult : unknown);
  preflight: Preflight;
}

/**
 * @param color colors
 * @returns alias function
 */
function colorx<N extends string>(color: Color<N>) {
  return {
    /**
     * @param alias aliases
     * @returns build function
     */
    alias: <A extends string>(alias: Alias<A, N>) => {
      return {
        /**
         * @param options build options
         * @returns colors and preflight
         */
        build: <O extends boolean = true>(
          options: BuildOptions<O> = {},
        ): BuildResult<A, O> => {
          const { overlay = true, selector = 'attribute' } = options;

          const aliasentries = Object.entries(alias) as [
            string,
            string | string[],
          ][];

          const colorobject = (
            callback: {
              key: (i: number) => string;
              value: (i: number) => string;
            },
          ) => {
            const value: Record<string, string> = {};
            for (let i = 1; i <= 12; i++) {
              value[callback.key(i)] = callback.value(i);
            }
            return value;
          };

          return {
            colors: {
              ...aliasentries.reduce((object, [name]) => {
                object[name as A] = colorobject({
                  key: i => `${i}`,
                  value: i => `rgb(var(--${name}-${i}))`,
                });
                return object;
              }, {} as ColorsResult<A>),
              ...((overlay
                ? ({
                  black: {
                    DEFAULT: '#000000',
                    1: 'var(--black-1)',
                    2: 'var(--black-2)',
                    3: 'var(--black-3)',
                    4: 'var(--black-4)',
                    5: 'var(--black-5)',
                    6: 'var(--black-6)',
                    7: 'var(--black-7)',
                    8: 'var(--black-8)',
                    9: 'var(--black-9)',
                    10: 'var(--black-10)',
                    11: 'var(--black-11)',
                    12: 'var(--black-12)',
                  },
                  white: {
                    DEFAULT: '#ffffff',
                    1: 'var(--white-1)',
                    2: 'var(--white-2)',
                    3: 'var(--white-3)',
                    4: 'var(--white-4)',
                    5: 'var(--white-5)',
                    6: 'var(--white-6)',
                    7: 'var(--white-7)',
                    8: 'var(--white-8)',
                    9: 'var(--white-9)',
                    10: 'var(--white-10)',
                    11: 'var(--white-11)',
                    12: 'var(--white-12)',
                  },
                } as ColorsOverlayResult)
                : {}) as any),
            } as any,
            preflight: (() => {
              let css = '';

              const addBase = (
                record: Record<string, Record<string, string>>,
              ) => {
                let _css = '';
                for (const key in record) {
                  const value = record[key];
                  _css += `${key} {`;
                  for (const _key in value) _css += ` ${_key}: ${value[_key]};`;
                  _css += '}';
                }
                css += `${_css}`;
              };

              const format = (hex: string) => {
                hex = hex.replace(/#/g, '');
                return `${Number.parseInt(hex.substring(0, 2), 16)} ${
                  Number.parseInt(hex.substring(2, 4), 16)
                } ${Number.parseInt(hex.substring(4, 6), 16)}`;
              };

              const convert = <T extends string>(
                name: T,
                radix: RadixColorObject<T>,
              ): CustomColorObject<T> => {
                return (Object.entries(radix) as [string, string][]).reduce(
                  (object, [key, value]) => {
                    object[`--${name}-${key.replace(/\D/g, '') as Shade}`] =
                      format(value);
                    return object;
                  },
                  {} as CustomColorObject<T>,
                );
              };

              const LIGHT: CustomColorObject<string> = {};
              const DARK: CustomColorObject<string> = {};

              (Object.entries(color) as [string, ColorValue<string>][]).forEach(
                ([name, [light, dark]]) => {
                  Object.assign(LIGHT, convert(name, light));
                  Object.assign(DARK, convert(name, dark));
                },
              );

              const SELECTOR = {
                theme: (value: string) => {
                  if (selector === 'attribute') {
                    return `[data-theme="${value}"]`;
                  }
                  if (selector === 'class') {
                    return `.${value}`;
                  }
                  console.log('ERROR : invalid theme selector');
                },
                alias: (name: string, value: string) => {
                  if (selector === 'attribute') {
                    return `[data-alias-${name}="${value}"]`;
                  }
                  if (selector === 'class') {
                    return `.alias-${name}-${value}`;
                  }
                  console.log('ERROR : invalid alias selector');
                },
              };

              addBase({
                [`:root, ${SELECTOR.theme('light')}`]: LIGHT,
                [`${SELECTOR.theme('dark')}`]: DARK,
              });

              aliasentries.forEach(([name, color]) => {
                if (!name.match(/^[a-z0-9]*$/i)) {
                  console.log(`ERROR : invalid ${name} alias`);
                  return;
                }

                if (Array.isArray(color)) {
                  color.forEach((value, index) => {
                    addBase({
                      [
                        [
                          index === 0 && ':root',
                          `${SELECTOR.alias(name, value)}`,
                        ].filter(Boolean).join(', ')
                      ]: colorobject({
                        key: i => `--${name}-${i}`,
                        value: i => `var(--${value}-${i})`,
                      }),
                    });
                  });
                } else {
                  addBase({
                    ':root': colorobject({
                      key: i => `--${name}-${i}`,
                      value: i => `var(--${color}-${i})`,
                    }),
                  });
                }
              });

              if (overlay) {
                addBase({
                  ':root': {
                    '--black-1': blackA.blackA1,
                    '--black-2': blackA.blackA2,
                    '--black-3': blackA.blackA3,
                    '--black-4': blackA.blackA4,
                    '--black-5': blackA.blackA5,
                    '--black-6': blackA.blackA6,
                    '--black-7': blackA.blackA7,
                    '--black-8': blackA.blackA8,
                    '--black-9': blackA.blackA9,
                    '--black-10': blackA.blackA10,
                    '--black-11': blackA.blackA11,
                    '--black-12': blackA.blackA12,
                    '--white-1': whiteA.whiteA1,
                    '--white-2': whiteA.whiteA2,
                    '--white-3': whiteA.whiteA3,
                    '--white-4': whiteA.whiteA4,
                    '--white-5': whiteA.whiteA5,
                    '--white-6': whiteA.whiteA6,
                    '--white-7': whiteA.whiteA7,
                    '--white-8': whiteA.whiteA8,
                    '--white-9': whiteA.whiteA9,
                    '--white-10': whiteA.whiteA10,
                    '--white-11': whiteA.whiteA11,
                    '--white-12': whiteA.whiteA12,
                  },
                });
              }

              return {
                getCSS: () => css,
              };
            })(),
          };
        },
      };
    },
  };
}

export const radix = colorx({
  gray,
  blue,
  yellow,
  red,
  sky,
  green,
  lime,
})
  .alias({
    neutral: 'gray',
    primary: 'lime',
    info: 'blue',
    tip: 'green',
    warning: 'yellow',
    danger: 'red',
    details: 'gray',
  })
  .build({ selector: 'class' });

const proseStyles = {
  'h1, h2, h3, h4, h5, h6': {
    color: radix.colors.neutral[12],
  },
  'lead': {
    color: radix.colors.neutral[11],
  },
  'a': {
    color: radix.colors.primary[11],
    'text-decoration': 'underline',
    'text-decoration-style': 'dashed',
  },
  'a:hover': {
    'text-decoration-style': 'solid',
  },
  'bold': {
    color: radix.colors.neutral[12],
  },
  'counters': {
    color: radix.colors.neutral[11],
  },
  'bullets': {
    color: radix.colors.neutral[12],
  },
  'hr': {
    'border-color': radix.colors.neutral[6],
  },
  'quotes': {
    color: radix.colors.neutral[12],
  },
  'quote-borders': {
    'border-left-color': radix.colors.neutral[6],
  },
  'captions': {
    color: radix.colors.neutral[11],
  },
  'code': {
    color: radix.colors.neutral[12],
  },
  'pre': {
    'background-color': radix.colors.neutral[3],
  },
  'pre code': {
    color: radix.colors.neutral[12],
  },
  'th': {
    'border-bottom-color': radix.colors.neutral[7],
  },
  'td': {
    'border-bottom-color': radix.colors.neutral[6],
  },
};

export default defineConfig({
  content: { pipeline: { include: ['./src/**/*.{ts,tsx}'] } },
  safelist: (() => {
    const responsive = (...classNames: string[]) => {
      const result: string[] = [];
      for (const className of classNames) {
        result.push(className);
        for (const screen of ['sm', 'md', 'lg', 'xl', '2xl']) {
          result.push(`${screen}:${className}`);
        }
      }
      return result;
    };

    const spacing = (
      $: string,
    ) => [`${$}-1`, `${$}-2`, `${$}-3`, `${$}-5`, `${$}-8`];

    return [
      ...responsive(
        ...spacing('m'),
        ...spacing('mx'),
        ...spacing('my'),
        ...spacing('mt'),
        ...spacing('mr'),
        ...spacing('mb'),
        ...spacing('ml'),
        ...spacing('p'),
        ...spacing('px'),
        ...spacing('py'),
        ...spacing('pt'),
        ...spacing('pr'),
        ...spacing('pb'),
        ...spacing('pl'),
      ),
    ];
  })(),
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ...radix.colors,
    },
  },
  preflights: [radix.preflight],
  presets: [
    presetWind3({ dark: 'class' }),
    presetTypography({
      cssExtend: proseStyles,
    }),
    presetAnimations(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      autoInstall: true,
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter Variable',
        mono: 'Geist Mono',
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
