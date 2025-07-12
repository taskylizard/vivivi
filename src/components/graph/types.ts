import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3'
import type { Graphics, Text } from 'pixi.js'

export interface Node {
  id: string
  isExternal: boolean
  text?: string // Optional text field for display purposes
  x?: number
  y?: number
  fx?: number
  fy?: number
}

export interface Link {
  source: string | Node
  target: string | Node
}

export interface Graph {
  nodes: Node[]
  links: Link[]
}

export interface D3Config {
  drag: boolean
  zoom: boolean
  depth: number
  scale: number
  repelForce: number
  centerForce: number
  linkDistance: number
  fontSize: number
  opacityScale: number
  removeTags: string[]
  showTags: boolean
  focusOnHover?: boolean
  enableRadial?: boolean
  // PIXI.js options
  pixiPreference?: 'webgl' | 'webgpu'
  powerPreference?: 'high-performance' | 'low-power'
  failIfMajorPerformanceCaveat?: boolean
  static?: boolean
}

export type GraphicsInfo = {
  color: string
  gfx: Graphics
  alpha: number
  active: boolean
}

export type NodeData = {
  id: string
  text: string
  tags: string[]
  isExternal?: boolean
} & SimulationNodeDatum

export type SimpleLinkData = {
  source: string
  target: string
}

export type LinkData = {
  source: NodeData
  target: NodeData
} & SimulationLinkDatum<NodeData>

export type LinkRenderData = GraphicsInfo & {
  simulationData: LinkData
}

export type NodeRenderData = GraphicsInfo & {
  simulationData: NodeData
  label: Text
}

export type TweenNode = {
  update: (time: number) => void
  stop: () => void
}
