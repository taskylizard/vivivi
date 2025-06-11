import { remark } from "remark";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

export type Input = {
  url: string;
  title: string;
  content: string;
};

type Url = string;

type Node = {
  id: number;
  text: string;
  url: Url;
};

type Source = string;
type Target = string;

type Edge = {
  source: Source;
  target: Target;
};

type UrlToIDMap = {
  [key: Url]: string;
};

type Connections = {
  [key: string]: boolean;
};

export class Graph {
  private _nodes: Node[];
  private _edges: Edge[];
  private urlToIDMap: UrlToIDMap;
  private connections: Connections;

  constructor(postMarkdowns: Input[]) {
    this._nodes = [];
    this._edges = [];
    this.urlToIDMap = this.buildUrlToID(postMarkdowns);
    this.connections = {};
  }

  get nodes() {
    return this._nodes;
  }

  get edges() {
    return this._edges;
  }

  addNode({ url, title }: Input) {
    this._nodes.push({
      url,
      text: title,
      id: this._nodes.length,
    });
  }

  addEdge(sourceUrl: Url, targetUrl: Url) {
    const source = this.urlToIDMap[sourceUrl];
    const target = this.urlToIDMap[targetUrl];

    if (this.hasConnection(source, target)) return;

    this._edges.push({
      source,
      target,
    });

    this.updateConnections(source, target);
  }

  private buildUrlToID(postMarkdowns: Input[]) {
    return postMarkdowns.reduce(
      (urlToIDMap, { url }, index: number) => ({
        ...urlToIDMap,
        [url]: index.toString(),
      }),
      {},
    );
  }

  private updateConnections(source: string, target: string) {
    this.connections[`${source}-${target}`] = true;
  }

  private hasConnection(source: string, target: string) {
    return (
      this.connections[`${source}-${target}`] ||
      this.connections[`${target}-${source}`]
    );
  }
}

type AddEdge = (url: string) => boolean;

function buildLink(input: Input, graph: Graph, addEdge: AddEdge = () => true) {
  graph.addNode(input);

  remark()
    .use(() => (mdast: Root) => {
      visit(mdast, "link", (node) => {
        if (addEdge(node.url)) {
          graph.addEdge(input.url, node.url);
        }
      });
    })
    .process(input.content);
}

export function createGraph(
  inputs: Input[],
  isAbleToAddEdge: AddEdge = () => true,
) {
  const graph = new Graph(inputs);

  for (const postMarkdown of inputs) {
    buildLink(postMarkdown, graph, isAbleToAddEdge);
  }

  return graph;
}
