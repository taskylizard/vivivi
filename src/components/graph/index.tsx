import { Group as TweenGroup, Tween as Tweened } from '@tweenjs/tween.js';
import {
  drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  select,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
  zoom,
  zoomIdentity,
} from 'd3';
import { Application, Circle, Container, Graphics, Text } from 'pixi.js';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Graph as GraphViewer } from './types';

export interface D3Config {
  drag: boolean;
  zoom: boolean;
  depth: number;
  scale: number;
  repelForce: number;
  centerForce: number;
  linkDistance: number;
  fontSize: number;
  opacityScale: number;
  removeTags: string[];
  showTags: boolean;
  focusOnHover?: boolean;
  enableRadial?: boolean;
  // PIXI.js options
  pixiPreference?: 'webgl' | 'webgpu';
  powerPreference?: 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat?: boolean;
}

type GraphicsInfo = {
  color: string;
  gfx: Graphics;
  alpha: number;
  active: boolean;
};

type NodeData = {
  id: string;
  text: string;
  tags: string[];
  isExternal?: boolean;
} & SimulationNodeDatum;

type SimpleLinkData = {
  source: string;
  target: string;
};

type LinkData = {
  source: NodeData;
  target: NodeData;
} & SimulationLinkDatum<NodeData>;

type LinkRenderData = GraphicsInfo & {
  simulationData: LinkData;
};

type NodeRenderData = GraphicsInfo & {
  simulationData: NodeData;
  label: Text;
};

type TweenNode = {
  update: (time: number) => void;
  stop: () => void;
};

// workaround for pixijs webgpu issue: https://github.com/pixijs/pixijs/issues/11389
async function determineGraphicsAPI(): Promise<'webgpu' | 'webgl'> {
  const adapter = await navigator.gpu?.requestAdapter().catch(() => null);
  const device = adapter && (await adapter.requestDevice().catch(() => null));
  if (!device) {
    return 'webgl';
  }

  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ??
    (canvas.getContext('webgl') as WebGLRenderingContext | null);

  // we have to return webgl so pixijs automatically falls back to canvas
  if (!gl) {
    return 'webgl';
  }

  const webglMaxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  const webgpuMaxTextures = device.limits.maxSampledTexturesPerShaderStage;

  return webglMaxTextures === webgpuMaxTextures ? 'webgpu' : 'webgl';
}

interface QuartzGraphProps extends GraphViewer {
  config?: Partial<D3Config>;
  onNodeClick?: (nodeId: string) => void;
}

const defaultConfig: D3Config = {
  drag: true,
  zoom: true,
  depth: -1,
  scale: 0.9,
  repelForce: 0.5,
  centerForce: 0.2,
  linkDistance: 30,
  fontSize: 0.6,
  opacityScale: 1,
  showTags: true,
  removeTags: [],
  focusOnHover: true,
  enableRadial: true,
};

const GraphViewer = forwardRef<{ recenter: () => void }, QuartzGraphProps>(
  ({ nodes, links, config = {}, onNodeClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const onNodeClickRef = useRef(onNodeClick);

    // Update the ref when onNodeClick changes
    useEffect(() => {
      onNodeClickRef.current = onNodeClick;
    }, [onNodeClick]);

    useImperativeHandle(ref, () => ({
      recenter: () => {
        // Implementation for recentering would go here
      },
    }));

    const finalConfig = useMemo(
      () => ({ ...defaultConfig, ...config }),
      [config],
    );

    useEffect(() => {
      let cleanup: (() => void) | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      const renderGraph = async () => {
        if (!containerRef.current || nodes.length === 0) return;

        try {
          const graph = containerRef.current;
          // Clear any existing content
          while (graph.firstChild) {
            graph.removeChild(graph.firstChild);
          }

          const width = graph.offsetWidth;
          const height = Math.max(graph.offsetHeight, 250);

          const {
            drag: enableDrag,
            zoom: enableZoom,
            scale,
            repelForce,
            centerForce,
            linkDistance,
            fontSize,
            opacityScale,
            showTags,
            focusOnHover,
            enableRadial,
          } = finalConfig;

          // Convert your data format to the expected format
          const data: Map<
            string,
            { title: string; links?: string[]; tags: string[] }
          > = new Map();
          const validLinks = new Set<string>();

          // Build data map from your nodes
          for (const node of nodes) {
            data.set(node.id, {
              title: node.id,
              links: [],
              tags: [],
            });
            validLinks.add(node.id);
          }

          // Build links from your links data
          const linksList: SimpleLinkData[] = [];
          for (const link of links) {
            const sourceId = typeof link.source === 'string'
              ? link.source
              : link.source.id;
            const targetId = typeof link.target === 'string'
              ? link.target
              : link.target.id;

            if (validLinks.has(sourceId) && validLinks.has(targetId)) {
              linksList.push({ source: sourceId, target: targetId });
            }
          }

          const tags: string[] = [];

          const neighbourhood = new Set<string>();
          validLinks.forEach((id) => neighbourhood.add(id));
          if (showTags) tags.forEach((tag) => neighbourhood.add(tag));

          const graphNodes = [...neighbourhood].map((url) => {
            const text = url.startsWith('tags/')
              ? '#' + url.substring(5)
              : (data.get(url)?.title ?? url);
            const nodeFromOriginal = nodes.find((n) => n.id === url);
            return {
              id: url,
              text: nodeFromOriginal?.text || text, // Use the text from the original node if available
              tags: data.get(url)?.tags ?? [],
              isExternal: nodeFromOriginal?.isExternal,
            };
          });

          const graphData: { nodes: NodeData[]; links: LinkData[] } = {
            nodes: graphNodes,
            links: linksList
              .filter(
                (l) =>
                  neighbourhood.has(l.source) && neighbourhood.has(l.target),
              )
              .map((l) => ({
                source: graphNodes.find((n) => n.id === l.source)!,
                target: graphNodes.find((n) => n.id === l.target)!,
              })),
          };

          // we virtualize the simulation and use pixi to actually render it
          const simulation: Simulation<NodeData, LinkData> = forceSimulation<
            NodeData
          >(graphData.nodes)
            .force('charge', forceManyBody().strength(-100 * repelForce))
            .force('center', forceCenter().strength(centerForce))
            .force('link', forceLink(graphData.links).distance(linkDistance))
            .force(
              'collide',
              forceCollide<NodeData>((n) => nodeRadius(n)).iterations(3),
            );

          const radius = (Math.min(width, height) / 2) * 0.8;
          if (enableRadial) {
            simulation.force('radial', forceRadial(radius).strength(0.2));
          }

          // precompute style prop strings as pixi doesn't support css variables
          const cssVars = [
            '--primary-9',
            '--primary-11',
            '--danger-9',
            '--danger-11',
            '--neutral-12',
            '--neutral-6',
            '--neutral-8',
            '--font-sans',
          ] as const;
          const computedStyleMap = cssVars.reduce(
            (acc, key) => {
              const value = getComputedStyle(
                document.documentElement,
              ).getPropertyValue(key);
              // Convert RGB values to hex
              if (value.includes(' ')) {
                const rgb = value.split(' ').map((v) => parseInt(v.trim()));
                acc[key] = '#' +
                  rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
              } else {
                acc[key] = value.startsWith('#') ? value : `#${value}`;
              }
              return acc;
            },
            {} as Record<(typeof cssVars)[number], string>,
          );

          // calculate color
          const color = (d: NodeData) => {
            if (d.isExternal) {
              return computedStyleMap['--neutral-6'];
            } else {
              return computedStyleMap['--primary-9'];
            }
          };

          function nodeRadius(d: NodeData) {
            const numLinks = graphData.links.filter(
              (l) => l.source.id === d.id || l.target.id === d.id,
            ).length;
            return 2 + Math.sqrt(numLinks);
          }

          let hoveredNodeId: string | null = null;
          let hoveredNeighbours: Set<string> = new Set();
          const linkRenderData: LinkRenderData[] = [];
          const nodeRenderData: NodeRenderData[] = [];
          const tweens = new Map<string, TweenNode>();

          function updateHoverInfo(newHoveredId: string | null) {
            hoveredNodeId = newHoveredId;

            if (newHoveredId === null) {
              hoveredNeighbours = new Set();
              for (const n of nodeRenderData) {
                n.active = false;
              }

              for (const l of linkRenderData) {
                l.active = false;
              }
            } else {
              hoveredNeighbours = new Set();
              for (const l of linkRenderData) {
                const linkData = l.simulationData;
                if (
                  linkData.source.id === newHoveredId ||
                  linkData.target.id === newHoveredId
                ) {
                  hoveredNeighbours.add(linkData.source.id);
                  hoveredNeighbours.add(linkData.target.id);
                }

                l.active = linkData.source.id === newHoveredId ||
                  linkData.target.id === newHoveredId;
              }

              for (const n of nodeRenderData) {
                n.active = hoveredNeighbours.has(n.simulationData.id);
              }
            }
          }

          let dragStartTime = 0;
          let dragging = false;

          function renderLinks() {
            tweens.get('link')?.stop();
            const tweenGroup = new TweenGroup();

            for (const l of linkRenderData) {
              let alpha = 1;

              // if we are hovering over a node, we want to highlight the immediate neighbours
              // with full alpha and the rest with default alpha
              if (hoveredNodeId) {
                alpha = l.active ? 1 : 0.2;
              }

              l.color = l.active
                ? computedStyleMap['--neutral-12']
                : computedStyleMap['--neutral-6'];
              tweenGroup.add(new Tweened<LinkRenderData>(l).to({ alpha }, 200));
            }

            tweenGroup.getAll().forEach((tw) => tw.start());
            tweens.set('link', {
              update: tweenGroup.update.bind(tweenGroup),
              stop() {
                tweenGroup.getAll().forEach((tw) => tw.stop());
              },
            });
          }

          function renderLabels() {
            tweens.get('label')?.stop();
            const tweenGroup = new TweenGroup();

            const defaultScale = 1 / scale;
            const activeScale = defaultScale * 1.1;
            for (const n of nodeRenderData) {
              const nodeId = n.simulationData.id;

              if (hoveredNodeId === nodeId) {
                tweenGroup.add(
                  new Tweened<Text>(n.label).to(
                    {
                      alpha: 1,
                      scale: { x: activeScale, y: activeScale },
                    },
                    100,
                  ),
                );
              } else {
                tweenGroup.add(
                  new Tweened<Text>(n.label).to(
                    {
                      alpha: n.label.alpha,
                      scale: { x: defaultScale, y: defaultScale },
                    },
                    100,
                  ),
                );
              }
            }

            tweenGroup.getAll().forEach((tw) => tw.start());
            tweens.set('label', {
              update: tweenGroup.update.bind(tweenGroup),
              stop() {
                tweenGroup.getAll().forEach((tw) => tw.stop());
              },
            });
          }

          function renderNodes() {
            tweens.get('hover')?.stop();

            const tweenGroup = new TweenGroup();
            for (const n of nodeRenderData) {
              let alpha = 1;

              // if we are hovering over a node, we want to highlight the immediate neighbours
              if (hoveredNodeId !== null && focusOnHover) {
                alpha = n.active ? 1 : 0.2;
              }

              tweenGroup.add(
                new Tweened<Graphics>(n.gfx, tweenGroup).to({ alpha }, 200),
              );
            }

            tweenGroup.getAll().forEach((tw) => tw.start());
            tweens.set('hover', {
              update: tweenGroup.update.bind(tweenGroup),
              stop() {
                tweenGroup.getAll().forEach((tw) => tw.stop());
              },
            });
          }

          function renderPixiFromD3() {
            renderNodes();
            renderLinks();
            renderLabels();
          }

          tweens.forEach((tween) => tween.stop());
          tweens.clear();

          // Use config preference or fallback to auto-detection
          const pixiPreference = finalConfig.pixiPreference ||
            (await determineGraphicsAPI());
          const app = new Application();
          await app.init({
            width,
            height,
            antialias: true,
            autoStart: false,
            autoDensity: true,
            backgroundAlpha: 0,
            preference: pixiPreference,
            resolution: window.devicePixelRatio,
            eventMode: 'static',
            // Use config options for WebGL context recovery
            powerPreference: finalConfig.powerPreference || 'high-performance',
            failIfMajorPerformanceCaveat:
              finalConfig.failIfMajorPerformanceCaveat || false,
          });

          // Handle WebGL context loss and restoration
          const canvas = app.canvas;
          const handleContextLost = (event: Event) => {
            console.warn('WebGL context lost, preventing default behavior');
            event.preventDefault();
          };

          const handleContextRestored = () => {
            console.log('WebGL context restored, reinitializing...');
            // The app should automatically handle context restoration
            app.renderer.render(app.stage);
          };

          canvas.addEventListener('webglcontextlost', handleContextLost);
          canvas.addEventListener(
            'webglcontextrestored',
            handleContextRestored,
          );

          graph.appendChild(canvas);

          const stage = app.stage;
          stage.interactive = false;

          const labelsContainer = new Container<Text>({
            zIndex: 3,
            isRenderGroup: true,
          });
          const nodesContainer = new Container<Graphics>({
            zIndex: 2,
            isRenderGroup: true,
          });
          const linkContainer = new Container<Graphics>({
            zIndex: 1,
            isRenderGroup: true,
          });
          stage.addChild(nodesContainer, labelsContainer, linkContainer);

          for (const n of graphData.nodes) {
            const nodeId = n.id;

            const label = new Text({
              interactive: false,
              eventMode: 'none',
              text: n.text,
              alpha: 0,
              anchor: { x: 0.5, y: 1.2 },
              style: {
                fontSize: fontSize * 12,
                fill: computedStyleMap['--neutral-12'],
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              },
              resolution: window.devicePixelRatio * 4,
            });
            label.scale.set(1 / scale);

            let oldLabelOpacity = 0;
            const isTagNode = nodeId.startsWith('tags/');
            const gfx = new Graphics({
              interactive: true,
              label: nodeId,
              eventMode: 'static',
              hitArea: new Circle(0, 0, nodeRadius(n)),
              cursor: 'pointer',
            })
              .circle(0, 0, nodeRadius(n))
              .fill(isTagNode ? computedStyleMap['--neutral-6'] : color(n))
              .on('pointerover', (e) => {
                const target = e.target as Graphics & { label?: string };
                updateHoverInfo(target.label || nodeId);
                oldLabelOpacity = label.alpha;
                if (!dragging) {
                  renderPixiFromD3();
                }
              })
              .on('pointerleave', () => {
                updateHoverInfo(null);
                label.alpha = oldLabelOpacity;
                if (!dragging) {
                  renderPixiFromD3();
                }
              });

            if (isTagNode) {
              gfx.stroke({ width: 2, color: computedStyleMap['--primary-11'] });
            } else if (n.isExternal) {
              gfx.stroke({ width: 2, color: computedStyleMap['--neutral-8'] });
            }
            // Remove stroke for internal nodes (no else clause)

            nodesContainer.addChild(gfx);
            labelsContainer.addChild(label);

            const nodeRenderDatum: NodeRenderData = {
              simulationData: n,
              gfx,
              label,
              color: color(n),
              alpha: 1,
              active: false,
            };

            nodeRenderData.push(nodeRenderDatum);
          }

          for (const l of graphData.links) {
            const gfx = new Graphics({ interactive: false, eventMode: 'none' });
            linkContainer.addChild(gfx);

            const linkRenderDatum: LinkRenderData = {
              simulationData: l,
              gfx,
              color: computedStyleMap['--neutral-6'],
              alpha: 1,
              active: false,
            };

            linkRenderData.push(linkRenderDatum);
          }

          let currentTransform = zoomIdentity;
          if (enableDrag) {
            select<HTMLCanvasElement, NodeData | undefined>(app.canvas).call(
              drag<HTMLCanvasElement, NodeData | undefined>()
                .container(() => app.canvas)
                .subject(() =>
                  graphData.nodes.find((n) => n.id === hoveredNodeId)
                )
                .on('start', function dragstarted(event) {
                  if (!event.active) simulation.alphaTarget(1).restart();
                  if (event.subject) {
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                    event.subject.__initialDragPos = {
                      x: event.subject.x,
                      y: event.subject.y,
                      fx: event.subject.fx,
                      fy: event.subject.fy,
                    };
                  }
                  dragStartTime = Date.now();
                  dragging = true;
                })
                .on('drag', function dragged(event) {
                  if (event.subject) {
                    const initPos = event.subject.__initialDragPos;
                    if (initPos) {
                      event.subject.fx = initPos.x +
                        (event.x - initPos.x) / currentTransform.k;
                      event.subject.fy = initPos.y +
                        (event.y - initPos.y) / currentTransform.k;
                    }
                  }
                })
                .on('end', function dragended(event) {
                  if (!event.active) simulation.alphaTarget(0);
                  if (event.subject) {
                    event.subject.fx = null;
                    event.subject.fy = null;
                  }
                  dragging = false;

                  // if the time between mousedown and mouseup is short, we consider it a click
                  if (Date.now() - dragStartTime < 500 && event.subject) {
                    const node = graphData.nodes.find(
                      (n) => n.id === event.subject!.id,
                    ) as NodeData;
                    if (onNodeClickRef.current && node) {
                      onNodeClickRef.current(node.id);
                    }
                  }
                }),
            );
          } else {
            for (const node of nodeRenderData) {
              node.gfx.on('click', () => {
                if (onNodeClickRef.current) {
                  onNodeClickRef.current(node.simulationData.id);
                }
              });
            }
          }

          if (enableZoom) {
            select<HTMLCanvasElement, NodeData>(app.canvas).call(
              zoom<HTMLCanvasElement, NodeData>()
                .extent([
                  [0, 0],
                  [width, height],
                ])
                .scaleExtent([0.25, 4])
                .on('zoom', ({ transform }) => {
                  currentTransform = transform;
                  stage.scale.set(transform.k, transform.k);
                  stage.position.set(transform.x, transform.y);

                  // zoom adjusts opacity of labels too
                  const scale = transform.k * opacityScale;
                  const scaleOpacity = Math.max((scale - 1) / 3.75, 0);
                  const activeNodes = nodeRenderData
                    .filter((n) => n.active)
                    .flatMap((n) => n.label);

                  for (const label of labelsContainer.children) {
                    if (!activeNodes.includes(label)) {
                      label.alpha = scaleOpacity;
                    }
                  }
                }),
            );
          }

          let stopAnimation = false;
          function animate(time: number) {
            if (stopAnimation) return;
            for (const n of nodeRenderData) {
              const { x, y } = n.simulationData;
              if (!x || !y) continue;
              n.gfx.position.set(x + width / 2, y + height / 2);
              if (n.label) {
                n.label.position.set(x + width / 2, y + height / 2);
              }
            }

            for (const l of linkRenderData) {
              const linkData = l.simulationData;
              l.gfx.clear();
              l.gfx.moveTo(
                linkData.source.x! + width / 2,
                linkData.source.y! + height / 2,
              );
              l.gfx
                .lineTo(
                  linkData.target.x! + width / 2,
                  linkData.target.y! + height / 2,
                )
                .stroke({ alpha: l.alpha, width: 1, color: l.color });
            }

            tweens.forEach((t) => t.update(time));
            app.renderer.render(stage);
            requestAnimationFrame(animate);
          }

          requestAnimationFrame(animate);

          cleanup = () => {
            stopAnimation = true;
            tweens.forEach((tween) => tween.stop());
            tweens.clear();
            // Remove WebGL context event listeners
            canvas.removeEventListener('webglcontextlost', handleContextLost);
            canvas.removeEventListener(
              'webglcontextrestored',
              handleContextRestored,
            );
            app.destroy();
          };

          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing graph:', error);

          // Retry logic for WebGL context issues
          if (
            retryCount < maxRetries &&
            error instanceof Error &&
            (error.message.includes('WebGL') ||
              error.message.includes('context') ||
              error.message.includes('lost'))
          ) {
            retryCount++;
            console.log(
              `Retrying graph initialization (${retryCount}/${maxRetries})...`,
            );
            setTimeout(() => renderGraph(), 1000 * retryCount);
          } else {
            console.error('Failed to initialize graph after retries');
          }
        }
      };

      // Add a small delay to help with WebGL context initialization
      const timeoutId = setTimeout(() => renderGraph(), 100);

      return () => {
        clearTimeout(timeoutId);
        if (cleanup) {
          cleanup();
        }
      };
    }, [nodes, links, finalConfig]);

    return (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          inset: 0,
          opacity: isInitialized ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    );
  },
);

export default GraphViewer;
