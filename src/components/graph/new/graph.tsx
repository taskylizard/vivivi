import { max, scaleSqrt } from 'd3';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';
import type { Simulation, SimulationNodeDatum } from 'd3-force';
import { Viewport } from 'pixi-viewport';
import { Application, Container, Graphics } from 'pixi.js';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Graph, Link, Node } from '../types';

const PIXIGraphView = forwardRef<
  { recenter: () => void },
  Graph
>(({ nodes, links }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const simulationRef = useRef<Simulation<Node, undefined> | null>(null);
  const nodeDataToNodeGfx = useRef<WeakMap<Node, Container>>(new WeakMap());
  const nodeGfxToNodeData = useRef<WeakMap<Container, Node>>(new WeakMap());
  const linkDataToLinkGfx = useRef<WeakMap<Link, Container>>(new WeakMap());
  const linkGfxToLinkData = useRef<WeakMap<Container, Link>>(new WeakMap());

  useEffect(() => {
    let ignore = false; // Move this to the top
    let cleanup: (() => void) | null = null;

    const initPixi = async () => {
      // Remove the null checks that prevent initialization
      if (!containerRef.current || ignore) return;

      console.info('starting....');

      try {
        // Initialize PIXI Application
        const app = new Application();
        await app.init({
          width: window.innerWidth,
          height: window.innerHeight,
          resolution: window.devicePixelRatio || 1,
          antialias: true,
          autoDensity: true,
          backgroundColor: 0xffffff,
          backgroundAlpha: 0,
        });

        if (ignore) return; // Check again after async init

        appRef.current = app;
        containerRef.current.appendChild(app.view as HTMLCanvasElement);

        // Create viewport for zooming and panning
        const viewport = new Viewport({
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          worldWidth: window.innerWidth,
          worldHeight: window.innerHeight,
          events: app.renderer.events,
        });

        viewportRef.current = viewport;
        app.stage.addChild(viewport);
        viewport
          .drag()
          .pinch()
          .wheel()
          .decelerate()
          .clampZoom({ minScale: 0.1, maxScale: 5 });

        // Create layers
        const linksLayer = new Container();
        const nodesLayer = new Container();
        viewport.addChild(linksLayer);
        viewport.addChild(nodesLayer);

        const nodeRadiusScale = scaleSqrt()
          .domain([0, max(nodes.map(node => (node as Node).degree))])
          .range([10, 50])
          .clamp(true);

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as Node;
          node.radius = nodeRadiusScale(node.degree);
        }

        // Initialize force simulation
        const simulation = forceSimulation<Node>(nodes)
          .force(
            'link',
            forceLink<Node, Link>(links).id((d: SimulationNodeDatum) =>
              (d as Node).id
            ),
          )
          .force(
            'x',
            forceX((d: SimulationNodeDatum) => (d as Node).x),
          )
          .force(
            'y',
            forceY((d: SimulationNodeDatum) => (d as Node).y),
          )
          .force(
            'charge',
            forceManyBody().strength(-100).distanceMin(100),
          )
          .force(
            'collide',
            forceCollide().radius((d: SimulationNodeDatum) =>
              (d as Node).radius
            ),
          );

        simulationRef.current = simulation;

        // Create visual elements
        const nodeDataGfxPairs: [Node, Container][] = [];
        const linkDataGfxPairs: [Link, Container][] = [];

        // Create links
        links.forEach((link) => {
          const linkGfx = new Container();
          const line = new Graphics();
          linkGfx.addChild(line);
          linksLayer.addChild(linkGfx);
          linkDataGfxPairs.push([link, linkGfx]);
        });

        // Create nodes
        nodes.forEach((node) => {
          const nodeGfx = new Container();
          const circle = new Graphics();

          // Draw node circle
          circle.fill(node.isExternal ? 0xe11d48 : 0x2563eb);
          circle.setStrokeStyle({
            width: 2,
            color: node.isExternal ? 0xffffff : 0xffffff,
          });
          circle.circle(0, 0, 10);
          circle.fill();

          nodeGfx.addChild(circle);
          nodesLayer.addChild(nodeGfx);
          nodeDataGfxPairs.push([node, nodeGfx]);

          // Add interactivity
          nodeGfx.eventMode = 'static';
          nodeGfx.cursor = 'pointer';

          nodeGfx.on('pointerdown', (event) => {
            const nodeData = nodeGfxToNodeData.current.get(nodeGfx);
            if (!nodeData) return;

            nodeData.fx = event.global.x;
            nodeData.fy = event.global.y;
            simulation.alphaTarget(0.3).restart();
          });

          nodeGfx.on('pointerup', () => {
            const nodeData = nodeGfxToNodeData.current.get(nodeGfx);
            if (!nodeData) return;

            nodeData.fx = undefined;
            nodeData.fy = undefined;
            simulation.alphaTarget(0);
          });
        });

        // Set up WeakMaps
        nodeDataToNodeGfx.current = new WeakMap(nodeDataGfxPairs);
        nodeGfxToNodeData.current = new WeakMap(
          nodeDataGfxPairs.map(([a, b]) => [b, a]),
        );
        linkDataToLinkGfx.current = new WeakMap(linkDataGfxPairs);
        linkGfxToLinkData.current = new WeakMap(
          linkDataGfxPairs.map(([a, b]) => [b, a]),
        );

        // Update positions on simulation tick
        simulation.on('tick', () => {
          // Update link positions
          links.forEach((link) => {
            const linkGfx = linkDataToLinkGfx.current.get(link);
            if (!linkGfx) return;

            const source = typeof link.source === 'string'
              ? nodes.find(n => n.id === link.source)
              : link.source;
            const target = typeof link.target === 'string'
              ? nodes.find(n => n.id === link.target)
              : link.target;

            if (!source || !target) return;

            const line = linkGfx.getChildAt(0) as Graphics;
            line.clear();
            line.setStrokeStyle({ width: 1, color: 0xaaaaaa, alpha: 0.7 });
            line.moveTo(source.x || 0, source.y || 0);
            line.lineTo(target.x || 0, target.y || 0);
          });

          // Update node positions
          nodes.forEach((node) => {
            const nodeGfx = nodeDataToNodeGfx.current.get(node);
            if (!nodeGfx) return;
            nodeGfx.position.set(node.x || 0, node.y || 0);
          });
        });

        function updatePositions() {
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i] as Node;
            const nodeGfx = nodeDataToNodeGfx.current.get(node);

            if (!nodeGfx) return;
            nodeGfx.x = node.x;
            nodeGfx.y = node.y;
          }

          for (let i = 0; i < links.length; i++) {
            const link = links[i] as Link;
            const source = nodes.find((n) => n.id === link.target);
            const target = nodes.find((n) => n.id === link.source);
            const linkGfx = linkDataToLinkGfx.current.get(link);

            if (!linkGfx) return;
            if (!source || !target) return;

            linkGfx.x = source.x;
            linkGfx.y = source.y;
            linkGfx.rotation = Math.atan2(
              target.y - source.y,
              target.x - source.x,
            );

            const line = linkGfx.getChildAt(0) as Graphics;
            if (!line) return;

            const lineLength = Math.max(
              Math.sqrt(
                (target.x - source.x) ** 2 +
                  (target.y - source.y) ** 2,
              ) - target.radius,
              0,
            );
            line.width = lineLength;
          }
        }

        simulation.tick(Math.ceil(
          Math.log(simulation.alphaMin()) /
            Math.log(1 - simulation.alphaDecay()),
        ));

        updatePositions();

        // Handle window resize
        const handleResize = () => {
          app.renderer.resize(window.innerWidth, window.innerHeight);
          viewport.resize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Set up cleanup function
        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          simulation.stop();
          app.destroy(true);
        };
      } catch (error) {
        console.error('Error initializing PIXI:', error);
      }
    };

    initPixi();

    return () => {
      ignore = true;
      cleanup?.();
    };
  }, [nodes, links]);

  // Implement recenter functionality
  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (viewportRef.current) {
        viewportRef.current.moveCenter(0, 0);
        viewportRef.current.setZoom(1);
      }
    },
  }));

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
      }}
    />
  );
});

PIXIGraphView.displayName = 'PIXIGraphView';

export default PIXIGraphView;
