This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: **/**/*.test.ts, components/ui/, lib/, components/react-scan.ts, components/theme-provider.tsx, components/theme-toggle.tsx, index.css, graph.ts, vite-env-d.ts, *.md
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded

## Additional Info

# Directory Structure
```
components/
  graph/
    graphWorker.ts
    index.tsx
    types.ts
  error-boundary.tsx
App.tsx
main.tsx
utils.ts
vite-env.d.ts
```

# Files

## File: components/graph/graphWorker.ts
```typescript
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationNodeDatum,
} from 'd3-force';
import type { Link, Node } from './types';

let simulation: Simulation<Node, undefined> | null = null;
let nodeData: Node[] = [];

self.onmessage = (e: MessageEvent) => {
  const { type, nodes, links, nodeId, x, y } = e.data;
  if (type === 'init') {
    if (simulation) simulation.stop();
    nodeData = nodes.map((n: Node) => ({ ...n }));
    const linkData: { source: string | Node; target: string | Node }[] = links
      .map((l: Link) => ({ ...l }));
    simulation = forceSimulation(nodeData)
      .force(
        'link',
        forceLink(linkData)
          .id((d: SimulationNodeDatum) => (d as Node).id),
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(0, 0))
      .on('tick', () => {
        self.postMessage({
          type: 'tick',
          nodes: nodeData.map((n) => ({ ...n })),
        });
      });
  } else if (type === 'drag') {
    if (!simulation) return;
    const node = nodeData.find((n) => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
      simulation.alphaTarget(0.3).restart();
    }
  } else if (type === 'dragEnd') {
    if (!simulation) return;
    const node = nodeData.find((n) => n.id === nodeId);
    if (node) {
      node.fx = undefined;
      node.fy = undefined;
      simulation.alphaTarget(0);
    }
  }
};
```

## File: components/graph/index.tsx
```typescript
import { select, zoom, zoomIdentity } from 'd3';
import type { ZoomBehavior, ZoomTransform } from 'd3';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import type { Graph, Node } from './types';

const GraphViewCanvas = forwardRef<
  { recenter: () => void },
  Graph
>(({ nodes, links }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const nodePositions = useRef<Node[]>([]);
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    content: string;
    visible: boolean;
  }>({ x: 0, y: 0, content: '', visible: false });
  const draggingNodeId = useRef<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(transformRef.current.x, transformRef.current.y);
    ctx.scale(transformRef.current.k, transformRef.current.k);
    const getVar = (v: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const primary = getVar('--primary') || '#2563eb';
    const primaryFg = getVar('--primary-foreground') || '#fff';
    const destructive = getVar('--destructive') || '#e11d48';
    const destructiveFg = getVar('--destructive-foreground') || '#fff';
    ctx.strokeStyle = '#aaa';
    ctx.globalAlpha = 0.7;
    for (const link of links) {
      const source = typeof link.source === 'object'
        ? link.source
        : nodePositions.current.find((n) => n.id === link.source);
      const target = typeof link.target === 'object'
        ? link.target
        : nodePositions.current.find((n) => n.id === link.target);
      if (!source || !target) continue;
      ctx.beginPath();
      ctx.moveTo(source.x ?? 0, source.y ?? 0);
      ctx.lineTo(target.x ?? 0, target.y ?? 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const node of nodePositions.current) {
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, 10, 0, 2 * Math.PI);
      ctx.fillStyle = node.isExternal
        ? `hsl(${destructive})`
        : `hsl(${primary})`;
      ctx.strokeStyle = node.isExternal
        ? `hsl(${destructiveFg})`
        : `hsl(${primaryFg})`;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }, [links, nodePositions]);

  useEffect(() => {
    let worker: Worker | null = null;
    let cancelled = false;
    (async () => {
      const GraphWorker = (await import('./graphWorker?worker')).default;
      if (cancelled) return;
      worker = new GraphWorker();
      workerRef.current = worker;
      worker.postMessage({ type: 'init', nodes, links });
      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === 'tick') {
          nodePositions.current = e.data.nodes;
          draw();
        }
      };
    })();
    return () => {
      cancelled = true;
      workerRef.current?.terminate();
    };
  }, [nodes, links, draw]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const zoomFn = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        draw();
      });
    select<HTMLCanvasElement, unknown>(canvasRef.current).call(zoomFn);
    zoomRef.current = zoomFn;
  }, [draw]);

  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (!canvasRef.current || !zoomRef.current) return;
      select<HTMLCanvasElement, unknown>(canvasRef.current)
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, zoomIdentity);
    },
  }));

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      draw();
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dragging = false;
    let dragOffset = { x: 0, y: 0 };
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - transformRef.current.x) /
        transformRef.current.k;
      const y = (e.clientY - rect.top - transformRef.current.y) /
        transformRef.current.k;
      const found = nodePositions.current.find(
        (n) => Math.hypot((n.x ?? 0) - x, (n.y ?? 0) - y) < 12,
      );
      if (found) {
        dragging = true;
        draggingNodeId.current = found.id;
        dragOffset = { x: (found.x ?? 0) - x, y: (found.y ?? 0) - y };
        canvas.style.cursor = 'grabbing';
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - transformRef.current.x) /
        transformRef.current.k;
      const y = (e.clientY - rect.top - transformRef.current.y) /
        transformRef.current.k;
      if (dragging && draggingNodeId.current && workerRef.current) {
        workerRef.current.postMessage({
          type: 'drag',
          nodeId: draggingNodeId.current,
          x: x + dragOffset.x,
          y: y + dragOffset.y,
        });
      } else {
        const found = nodePositions.current.find(
          (n) => Math.hypot((n.x ?? 0) - x, (n.y ?? 0) - y) < 12,
        );
        if (found) {
          setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            content: found.id,
            visible: true,
          });
        } else {
          setTooltip((t) => (t.visible ? { ...t, visible: false } : t));
        }
      }
    };
    const handleMouseUp = () => {
      if (dragging && draggingNodeId.current && workerRef.current) {
        workerRef.current.postMessage({
          type: 'dragEnd',
          nodeId: draggingNodeId.current,
        });
      }
      dragging = false;
      draggingNodeId.current = null;
      if (canvas) canvas.style.cursor = '';
    };
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100vw', height: '100vh', display: 'block' }}
      />
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            pointerEvents: 'none',
            background: '#222',
            color: '#fff',
            padding: 6,
            borderRadius: 6,
            fontSize: 13,
            zIndex: 10,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
});
GraphViewCanvas.displayName = 'GraphViewCanvas';

export default GraphViewCanvas;
```

## File: components/graph/types.ts
```typescript
export interface Node {
  id: string;
  isExternal: boolean;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface Link {
  source: string | Node;
  target: string | Node;
}

export interface Graph {
  nodes: Node[];
  links: Link[];
}
```

## File: components/error-boundary.tsx
```typescript
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
    // You can also log the error to an error reporting service here
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className='fixed inset-0 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
          <div className='w-full max-w-2xl p-6 bg-background border border-border rounded-lg shadow-lg'>
            <div className='space-y-4'>
              <h2 className='text-2xl font-bold text-destructive'>
                Something went wrong!
              </h2>

              <div className='p-4 bg-muted rounded-md'>
                <p className='font-mono text-sm text-muted-foreground break-words'>
                  {this.state.error.toString()}
                </p>
              </div>

              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>
                  This error occurred in the application and couldn't be handled
                  gracefully.
                </p>
                {this.state.errorInfo && (
                  <details className='mt-4'>
                    <summary className='text-sm text-muted-foreground cursor-pointer hover:text-foreground'>
                      Stack trace
                    </summary>
                    <pre className='mt-2 p-4 bg-muted rounded-md overflow-auto text-xs font-mono text-muted-foreground'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className='flex gap-4 mt-6'>
                <button
                  onClick={() => window.location.reload()}
                  className='px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors'
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className='px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-md hover:bg-muted/90 transition-colors'
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## File: App.tsx
```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import privateersclubData from '../data/privateersclub.json';
import wotakuData from '../data/wotaku.json';
import { ErrorBoundary } from './components/error-boundary';
import GraphView from './components/graph';
import type { Graph } from './components/graph/types';
import { useToggleReactScan } from './components/react-scan';
import { Spinner } from './components/ui/spinner';

const GRAPH_OPTIONS = [
  {
    key: 'privateersclub',
    name: 'privateersclub',
    data: privateersclubData,
  },
  {
    key: 'wotaku',
    name: 'Wotaku',
    data: wotakuData,
  },
];

const useGraphData = (selectedGraph: string | null) => {
  const [data, setData] = useState<Graph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedGraph) return;
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const graph = GRAPH_OPTIONS.find((g) => g.key === selectedGraph);
        if (!graph) throw new Error('Graph not found');
        setData(graph.data as unknown as Graph);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    setError(null);
    setData(null);
    fetchData();
  }, [selectedGraph]);

  return { data, loading, error };
};

const HomePage: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
      <div
        className='absolute inset-0 bg-cover bg-center bg-no-repeat'
        style={{
          backgroundImage: 'url(/background.webp)',
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />

      <div className='absolute inset-0 bg-black/40' />

      <div className='relative w-full max-w-md mx-auto p-8 flex flex-col items-center gap-6 z-10'>
        <h2 className='text-xl text-foreground font-mono'>vivivi</h2>

        <div className='text-center text-white/90 font-sans'>
          <p className='text-sm mb-2'>
            Interactive graph visualization tool for exploring relationships
            between markdown files and external links.
          </p>
          <p className='text-xs text-white/70'>
            Navigate through connected content with dynamic{' '}
            <a
              href='https://en.wikipedia.org/wiki/Force-directed_graph_drawing'
              target='_blank'
              rel='noopener noreferrer'
              className='text-white/70 hover:text-white underline transition-colors cursor-pointer'
            >
              force-directed layouts
            </a>
            .
          </p>
        </div>

        <div className='bg-[#eda33b]/25 text-white p-4 w-full rounded font-sans'>
          <div className='text-xs'>
            <span className='font-bold'>{'⚠️ warning: '}</span>
            Large graphs may crash or severely lag your browser. Proceed with
            caution.
          </div>
        </div>

        <div className='flex flex-col gap-2 w-full text-center'>
          {GRAPH_OPTIONS.map((opt) => (
            <div key={opt.key} className='text-lg'>
              <button
                onClick={() => setLocation(`/graph/${opt.key}`)}
                className='appearance-none bg-transparent border-none p-0 m-0 text-white/70 hover:text-white underline transition-colors cursor-pointer'
              >
                {opt.name}{' '}
                <span className='text-xs text-muted-foreground'>
                  ({opt.data.nodesCount} nodes)
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className='absolute bottom-4 text-xs text-muted-foreground font-sans text-center w-full z-10'>
        <p>
          <a
            href='https://github.com/taskylizard/vivivi'
            target='_blank'
            rel='noopener noreferrer'
            className='appearance-none text-white/70 hover:text-white underline transition-colors cursor-pointer'
          >
            source code
          </a>{' '}
          • built by <span className='font-semibold'>taskylizard</span>
        </p>
      </footer>
    </div>
  );
};

const GraphPage: React.FC<{ params: { graphId: string } }> = ({ params }) => {
  const { data, loading, error } = useGraphData(params.graphId);
  const [showInfo, setShowInfo] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'info' | 'developer' | 'graphs'
  >('info');

  const [enabled, setEnabled] = useState(true);
  const { toggle } = useToggleReactScan({
    mode: 'controlled',
    enabled,
    setEnabled,
  });

  const [, setLocation] = useLocation();

  const graphRef = useRef<{ recenter: () => void }>(null);

  const handleRecenter = () => {
    graphRef.current?.recenter();
  };

  // avoid unnecessary re-renders
  const memoizedNodes = useMemo(() => data?.nodes || [], [data]);
  const memoizedLinks = useMemo(() => data?.links || [], [data]);

  if (loading) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
        <div className='relative w-full max-w-md mx-auto p-8 flex flex-col items-center gap-6'>
          <Spinner size='lg' className='bg-black dark:bg-white' />
          <p className='text-muted-foreground font-sans'>
            Loading graph data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 h-screen flex items-center justify-center dark'>
        <div className='text-center bg-card p-8 rounded-lg border'>
          <h2 className='text-xl font-bold mb-2'>Error loading graph</h2>
          <p className='text-destructive'>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='min-h-screen bg-background font-mono'>
      <ErrorBoundary>
        <GraphView
          ref={graphRef}
          nodes={memoizedNodes}
          links={memoizedLinks}
        />
      </ErrorBoundary>

      <div className='fixed bottom-6 right-6 z-50 flex flex-col items-end'>
        {showInfo && (
          <div className='w-72 bg-card/80 backdrop-blur border border-border rounded-xl shadow-2xl p-5 flex flex-col gap-4'>
            <div className='flex gap-2 mb-2'>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-card transition-all border-none outline-none ${
                  activeTab === 'info'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-card transition-all border-none outline-none ${
                  activeTab === 'graphs'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setActiveTab('graphs')}
              >
                Graphs
              </button>
              <button
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium bg-card transition-all border-none outline-none ${
                  activeTab === 'developer'
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setActiveTab('developer')}
              >
                Developer
              </button>
            </div>

            {activeTab === 'info' && (
              <div className='space-y-4'>
                <div>
                  <h4 className='text-sm font-semibold text-foreground mb-2'>
                    Legend
                  </h4>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block w-5 h-5 rounded-full border-2'
                        style={{
                          background: 'hsl(var(--primary))',
                          borderColor: 'hsl(var(--primary-foreground))',
                          borderStyle: 'solid',
                          borderWidth: '2px',
                        }}
                      >
                      </span>
                      <span className='text-sm text-foreground'>
                        Internal Markdown Node
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        className='inline-block w-5 h-5 rounded-full border-2'
                        style={{
                          background: 'hsl(var(--destructive))',
                          borderColor: 'hsl(var(--destructive-foreground))',
                          borderStyle: 'solid',
                          borderWidth: '2px',
                        }}
                      >
                      </span>
                      <span className='text-sm text-foreground'>
                        External Link Node
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='text-sm font-semibold text-foreground mb-2'>
                    Controls
                  </h4>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>🔍</span>
                      <span className='text-sm text-foreground'>
                        Scroll to <b>zoom</b> in/out
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>✋</span>
                      <span className='text-sm text-foreground'>
                        Drag background to <b>pan</b>
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg'>🖱</span>
                      <span className='text-sm text-foreground'>
                        Drag node to reposition
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'graphs' && (
              <div className='space-y-2'>
                <div className='text-xs text-muted-foreground mb-3'>
                  Switch between available graphs:
                </div>
                {GRAPH_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setLocation(`/graph/${opt.key}`)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-all border-none outline-none flex items-center justify-between ${
                      params.graphId === opt.key
                        ? 'bg-primary/20 text-primary-foreground border border-primary/30'
                        : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className='flex flex-col'>
                      <span className='text-sm font-medium'>{opt.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        {opt.data.nodesCount} nodes
                      </span>
                    </div>
                    {params.graphId === opt.key && (
                      <span className='text-xs'>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'developer' && (
              <div className='space-y-2 flex flex-col gap-2'>
                <button
                  className='text-sm text-muted-foreground hover:text-foreground bg-card px-2 py-1 rounded-md transition-all border-none outline-none flex items-center gap-2'
                  onClick={toggle}
                >
                  <span className='text-lg'>🔍</span>
                  {enabled ? ' Disable React Scan' : ' Enable React Scan'}
                </button>
                <button
                  className='text-sm text-muted-foreground hover:text-foreground bg-card px-2 py-1 rounded-md transition-all border-none outline-none flex items-center gap-2'
                  onClick={handleRecenter}
                >
                  <span className='text-lg'>🔄</span> Recenter
                </button>
              </div>
            )}
          </div>
        )}
        <button
          className={`mb-2 px-4 py-2 rounded-full bg-card text-foreground transition-all border-none outline-none ${
            showInfo ? 'opacity-70' : 'opacity-100'
          }`}
          onClick={() => setShowInfo((v) => !v)}
          aria-label={showInfo ? 'Hide info panel' : 'Show info panel'}
        >
          {showInfo
            ? <span className='font-semibold text-sm'>Hide</span>
            : <span className='font-semibold text-sm'>Show</span>}
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Switch>
      <Route path='/' component={HomePage} />
      <Route path='/graph/:graphId'>
        {(params) => <GraphPage params={params} />}
      </Route>
      <Route>
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-background'>
          <div className='text-center'>
            <h2 className='text-xl font-bold mb-2'>Page Not Found</h2>
            <button
              onClick={() => window.location.href = '/'}
              className='text-blue-500 hover:text-blue-400 underline'
            >
              Go back to home
            </button>
          </div>
        </div>
      </Route>
    </Switch>
  );
};

export default App;
```

## File: main.tsx
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider';
import 'virtual:uno.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme='dark'>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
```

## File: utils.ts
```typescript
import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## File: vite-env.d.ts
```typescript
/// <reference types="vite/client" />
```
