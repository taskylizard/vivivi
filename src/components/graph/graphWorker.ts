import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

interface Node extends SimulationNodeDatum {
  id: string;
  isExternal: boolean;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

let simulation: ReturnType<typeof forceSimulation<Node, Link>> | null = null;

self.onmessage = (
  // nodeId, x, y are no longer used in any message type
  e: MessageEvent<{ type: string; nodes?: Node[]; links?: Link[] }>,
) => {
  switch (e.data.type) {
    case 'init': {
      const { nodes, links } = e.data;
      if (!nodes || !links) return;

      simulation = forceSimulation<Node, Link>(nodes)
        .force('link', forceLink<Node, Link>(links).id((d) => d.id).distance(50))
        .force('charge', forceManyBody().strength(-300))
        .force('center', forceCenter(self.innerWidth / 2, self.innerHeight / 2).strength(0.1));

      // Run simulation for a fixed number of ticks to stabilize layout
      const numTicks = 300; // Adjust as needed
      for (let i = 0; i < numTicks; ++i) {
        simulation.tick();
      }

      // Fix node positions
      nodes.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
      });

      // Send final positions
      self.postMessage({ type: 'layoutComplete', nodes });
      // simulation.stop(); // Not strictly necessary as it will be idle.
      break;
    }
    // Drag messages (drag, dragEnd) were removed as dragging is disabled.
  }
};
