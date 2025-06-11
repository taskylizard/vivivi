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
