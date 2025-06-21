import type { Root } from 'mdast';

// Main configuration for a specific wiki/repository
export interface WikiConfig {
  repoName: string;
  ignoreDirs?: string[];
  ignoreFiles?: string[];
  linkExtractors?: LinkExtractorRule[];
  nodeShapes?: NodeShapeRule[];
  customDataExtractors?: CustomDataExtractorRule[];
}

// Rule for classifying links and extracting data from them
export interface LinkExtractorRule {
  pattern: string; // Regex to match link URL or text
  linkType: string; // Type to assign to the link (e.g., "discord", "docs")
  dataPattern?: string; // Regex to extract specific data from URL or text (first capture group)
  // Example: For a discord invite link, dataPattern could capture the invite code.
}

// Rule for defining visual shapes/colors for nodes
export interface NodeShapeRule {
  pattern: string; // Regex to match node ID or label
  shape: string; // Shape name (e.g., "circle", "box", "database")
  color?: string; // Optional color for the node
  // Example: Nodes with IDs starting "user-" get a "person" shape.
}

// Rule for extracting custom structured data from markdown content
export interface CustomDataExtractorRule {
  key: string; // A unique key for this set of extracted data (e.g., "tasks", "mentions")
  // sectionPattern?: string; // TODO: Regex to identify specific sections where this rule applies
  listItemPattern: string; // Regex to match against the full text of a list item
  dataPoints: DataPoint[]; // Defines what specific data to extract from matching list items
  // Example: Extracting task status and description from "- [x] Task description"
}

export interface DataPoint {
  key: string; // Name for the extracted piece of data (e.g., "status", "description")
  pattern: string; // Regex to find the data within the list item text (uses first capture group)
}

// --- Interfaces for data extracted directly from AST ---

export interface ExtractedLink {
  url: string;
  text: string | null;
  title?: string | null;
}

export interface ExtractedHeading {
  depth: number;
  text: string;
}

export interface ExtractedListItem {
  text: string;
  // Could include raw AST node for list item if needed for very complex extractors
  // rawListItemNode?: MdastListItem;
}

// Container for all data extracted from a single markdown file's AST
export interface AstExtractionData {
  links: ExtractedLink[];
  headings: ExtractedHeading[];
  listItems: ExtractedListItem[];
  customData?: Record<string, any[]>; // Data from CustomDataExtractorRule, grouped by extractor's key
  rawAst?: Root; // Optional: for very custom scenarios or debugging
}


// --- Interfaces for the final graph output ---

export interface GraphNode {
  id: string; // Unique ID (e.g., file basename, external URL)
  label: string; // Display label for the node
  type: 'page' | 'externalUrl' | string; // Node type (e.g., 'page', 'externalUrl', or custom types from config)
  repoName: string; // Repository this node belongs to or is referenced from
  filePath?: string; // Absolute path for 'page' nodes
  isExternal: boolean;
  shape?: string; // Visual shape (from NodeShapeRule)
  color?: string; // Color (from NodeShapeRule)
  customProperties?: Record<string, any>; // For any other data, including from customDataExtractors
}

export interface GraphLink {
  source: string; // ID of the source GraphNode
  target: string; // ID of the target GraphNode
  label?: string; // Optional label for the link (e.g., link text)
  type: 'internal' | 'external' | string; // Link type (e.g., 'internal', 'external', or custom from LinkExtractorRule)
  customProperties?: Record<string, any>; // For other data, like extracted data from LinkExtractorRule
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  nodesCount: number;
  linksCount: number;
}
