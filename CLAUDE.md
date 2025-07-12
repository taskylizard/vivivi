# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

- `pnpm dev` - Start development server with Vite
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Code Quality

- `pnpm lint` - Run ESLint on src directory
- `pnpm typecheck` - TypeScript type checking
- `pnpm check` - Run both lint and typecheck
- `pnpm format` - Format code with dprint

### Deployment

- `pnpm deploy` - Deploy to Cloudflare Pages using Wrangler

### Data Processing

- `tsx scripts/buildWikiGraph.ts` - Generate graph data from wiki repositories

## Architecture Overview

**vivivi** is an interactive force-directed graph visualization tool built with React, Vite, and PIXI.js for exploring relationships between markdown files and external links.

### Core Technologies

- **Frontend**: React 19 with TypeScript
- **Bundler**: Vite (using rolldown-vite for performance)
- **Routing**: wouter for client-side routing
- **Styling**: UnoCSS with Radix UI colors for theming
- **Graphics**: PIXI.js for high-performance graph rendering
- **Physics**: D3-force for graph simulation
- **Deployment**: Cloudflare Pages

### Key Components

#### Graph Visualization (`src/components/graph/`)

- **`index.tsx`**: Main GraphViewer component that orchestrates D3 simulation with PIXI.js rendering
- **`types.ts`**: TypeScript definitions for graph data structures
- **`d3-force-reuse.ts`**: D3 force simulation utilities
- **`node-properties-panel.tsx`**: Side panel for displaying node details

#### Pages

- **`App.tsx`**: Root component with error boundary and routing
- **`graph-page.tsx`**: Main graph visualization page with controls and configuration
- **`home-page.tsx`**: Landing page for selecting graphs

#### Data Processing

- **`scripts/buildWikiGraph.ts`**: Processes markdown files from wiki repositories to generate graph data
- **`src/data.ts`**: Graph configuration and data imports

### Graph Data Structure

```typescript
interface Node {
  id: string
  isExternal: boolean
  text?: string
}

interface Link {
  source: string
  target: string
}
```

### Performance Considerations

- PIXI.js handles rendering for >10k nodes (migrating from React-based rendering)
- WebGL/WebGPU automatic fallback with context recovery
- D3 simulation runs virtually, PIXI.js handles actual rendering
- Tween animations for smooth interactions
- Memoized data structures to prevent unnecessary re-renders

### Data Sources

The application processes markdown files from wiki repositories in the `repos/` directory:

- **fmhy**: Free media hosting and streaming resources
- **privateersclub**: Gaming piracy resources
- **wotaku**: Anime/manga resources

Each repository is processed by `buildWikiGraph.ts` to extract:

- Internal markdown file links
- External web links
- Graph relationships between documents

### Styling System

- UnoCSS with Radix UI color system
- Custom color aliases: `neutral`, `primary` (lime), `danger` (red), etc.
- CSS-in-JS for PIXI.js components (since CSS variables aren't supported)
- Responsive design with dark/light theme support

## Color scale usage

There are 12 steps in each scale. Each step was designed for at least one specific use case.

This table is a simple overview of the most common use case for each step. However, there are many exceptions and caveats to factor in, which are covered in further detail below.

| Step | Use Case                                |
| ---- | --------------------------------------- |
| 1    | App background                          |
| 2    | Subtle background                       |
| 3    | UI element background                   |
| 4    | Hovered UI element background           |
| 5    | Active / Selected UI element background |
| 6    | Subtle borders and separators           |
| 7    | UI element border and focus rings       |
| 8    | Hovered UI element border               |
| 9    | Solid backgrounds                       |
| 10   | Hovered solid backgrounds               |
| 11   | Low-contrast text                       |
| 12   | High-contrast text                      |

### Steps 1–2: Backgrounds

Steps 1 and 2 are designed for app backgrounds and subtle component backgrounds. You can use them interchangeably, depending on the vibe you're going for.

Appropriate applications include:

- Main app background
- Striped table background
- Code block background
- Card background
- Sidebar background
- Canvas area background

You may want to use white for your app background in light mode, and Step 1 or 2 from a gray or coloured scale in dark mode. In this case, set up a mutable alias for AppBg and map it to a different color for each color mode.

### Steps 3–5: Component backgrounds

Steps 3, 4, and 5 are designed for UI component backgrounds.

- Step 3 is for normal states.
- Step 4 is for hover states.
- Step 5 is for pressed or selected states.

If your component has a transparent background in its default state, you can use Step 3 for its hover state.

Steps 11 and 12—which are designed for text—are guaranteed to Lc 60 and Lc 90 APCA contrast ratio on top of a step 2 background from the same scale.

### Steps 6–8: Borders

Steps 6, 7, and 8 are designed for borders.

- Step 6 is designed for subtle borders on components which are not interactive. For example sidebars, headers, cards, alerts, and separators.
- Step 7 is designed for subtle borders on interactive components.
- Step 8 is designed for stronger borders on interactive components and focus rings.

### Steps 9–10: Solid backgrounds

Steps 9 and 10 are designed for solid backgrounds.

Step 9 has the highest chroma of all steps in the scale. In other words, it's the purest step, the step mixed with the least amount of white or black. Because 9 is the purest step, it has a wide range of applications:

- Website/App backgrounds
- Website section backgrounds
- Header backgrounds
- Component backgrounds
- Graphics/Logos
- Overlays
- Coloured shadows
- Accent borders

Step 10 is designed for component hover states, where step 9 is the component's normal state background.

Most step 9 colors are designed for white foreground text. Sky, Mint, Lime, Yellow, and Amber are designed for dark foreground text and steps 9 and 10.

### Steps 11–12: Text

Steps 11 and 12 are designed for text.

- Step 11 is designed for low-contrast text.
- Step 12 is designed for high-contrast text.

### Development Notes

- ESLint ignores `src/components/ui`, `repos`, and build directories
- Uses experimental React Compiler and React Scan for development
- Terminal plugin available in development mode
- Source maps enabled for debugging
