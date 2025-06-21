import fs from 'fs';
import path from 'path';
import { globSync } from 'tinyglobby';
import { fileURLToPath } from 'url';
import { unified, Plugin } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import type { Root, Link as MdastLink, Definition, Heading, ListItem, Text } from 'mdast';
import Graph from 'graphology';
import type {
  WikiConfig,
  GraphNode,
  GraphLink,
  GraphData,
  ExtractedLink,
  ExtractedHeading,
  ExtractedListItem,
  AstExtractionData,
  // LinkExtractorRule, // Not directly used here, but its structure is applied
  // NodeShapeRule,   // Not directly used here, but its structure is applied
  // CustomDataExtractorRule, // Not directly used here, but its structure is applied
} from './configTypes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default ignore lists
export const DEFAULT_IGNORED_DIRS = [ // Exporting for potential test inspection
  'br', 'es', 'ro', 'sandbox', 'other', 'posts', 'node_modules', '.git', '.github',
];
export const DEFAULT_IGNORED_FILES = [ // Exporting for potential test inspection
  'index.md', 'sandbox.md', 'license.md', 'LICENSE.md', 'contribute.md',
  'CONTRIBUTING.md', 'README.md', 't.md', 'start.md', 'about.md',
  'credits.md', 'faq.md', 'SUMMARY.md', // Common in gitbook-style wikis
];

export function getMarkdownFiles(docsDir: string, config?: WikiConfig): string[] {
  const currentIgnoredDirs = config?.ignoreDirs || DEFAULT_IGNORED_DIRS;
  const currentIgnoredFiles = config?.ignoreFiles || DEFAULT_IGNORED_FILES;

  const pattern = path.join(docsDir, '**/*.md');
  return globSync(pattern, {
    ignore: [
      ...currentIgnoredDirs.map((folder) => path.join(docsDir, '**', folder, '**')), // ignore sub-content
      ...currentIgnoredDirs.map((folder) => path.join(docsDir, '**', folder)),      // ignore the folder itself
      ...currentIgnoredFiles.map((file) => path.join(docsDir, '**', file)),
    ],
    absolute: true, // Return absolute paths for easier processing later
  });
}

// Extracts links from a pre-parsed AST (Root node)
export function extractLinksFromAst(tree: Root): ExtractedLink[] {
  const extractedLinks: ExtractedLink[] = [];

  visit(tree, 'link', (node: MdastLink) => {
    let textContent = null;
    if (node.children && node.children.length > 0) {
      textContent = node.children.map(child => {
        if (child.type === 'text') return child.value;
        if ((child.type === 'strong' || child.type === 'emphasis') && child.children && child.children.length === 1 && child.children[0].type === 'text') {
          return child.children[0].value;
        }
        return '';
      }).join('');
    }
    extractedLinks.push({ url: node.url, text: textContent, title: node.title });
  });

  const definitions = new Map<string, { url: string, title?: string | null }>();
  visit(tree, 'definition', (node: Definition) => {
    definitions.set(node.identifier, { url: node.url, title: node.title });
  });

  visit(tree, 'linkReference', (node: any) => { // Using 'any' for linkReference due to complex type from mdast
    const def = definitions.get(node.identifier);
    if (def) {
      let textContent = null;
      if (node.children && node.children.length > 0) {
        textContent = node.children.map(child => {
          if (child.type === 'text') return child.value;
          if ((child.type === 'strong' || child.type === 'emphasis') && child.children && child.children.length === 1 && child.children[0].type === 'text') {
            return child.children[0].value;
          }
          return '';
        }).join('');
      }
      if (!textContent && node.referenceType !== 'shortcut') {
        textContent = node.label || node.identifier;
      }
      extractedLinks.push({ url: def.url, text: textContent, title: def.title || node.label });
    }
  });
  return extractedLinks;
}

// Main AST data extraction function
export function extractAllDataFromAst(content: string, filePath: string, config?: WikiConfig): AstExtractionData {
  const tree = unified().use(remarkParse as Plugin<[], Root>).parse(content) as Root;

  const links = extractLinksFromAst(tree);
  const headings: ExtractedHeading[] = [];
  const listItems: ExtractedListItem[] = [];
  const extractedCustomData: Record<string, any[]> = {};

  visit(tree, 'heading', (node: Heading) => {
    const depth = node.depth;
    let text = '';
    if (node.children && node.children.length > 0) {
      text = node.children.map((child: any) => {
        if (child.type === 'text') return child.value;
        if (child.type === 'inlineCode') return `\`${child.value}\``;
        return '';
      }).join('');
    }
    headings.push({ depth, text });
  });

  visit(tree, 'listItem', (node: ListItem) => {
    let itemText = '';
    // Simple text extraction from list item children
    visit(node, ['text', 'inlineCode'], (textNode: Text | any) => { // any for inlineCode
        itemText += textNode.value;
    });
    const trimmedItemText = itemText.trim();
    listItems.push({ text: trimmedItemText });

    if (config?.customDataExtractors) {
      for (const extractor of config.customDataExtractors) {
        if (extractor.listItemPattern) {
          const itemMatch = new RegExp(extractor.listItemPattern).exec(trimmedItemText);
          if (itemMatch) {
            const data: Record<string, string> = {};
            for (const dp of extractor.dataPoints) {
              const dpMatch = new RegExp(dp.pattern).exec(trimmedItemText);
              if (dpMatch && dpMatch[1]) { // Assumes pattern has one capture group for the data
                data[dp.key] = dpMatch[1];
              } else if (dpMatch && dpMatch[0] && extractor.dataPoints.length === 1 && Object.keys(data).length === 0) {
                // If only one data point, no capture group in dp.pattern, and no other data points matched for this item
                data[dp.key] = dpMatch[0];
              }
            }
            if (Object.keys(data).length > 0) {
              const keyForStorage = extractor.key || 'defaultCustomData';
              if (!extractedCustomData[keyForStorage]) {
                extractedCustomData[keyForStorage] = [];
              }
              extractedCustomData[keyForStorage].push({ ...data, originalText: trimmedItemText, sourceFile: path.basename(filePath) });
            }
          }
        }
      }
    }
  });

  return { links, headings, listItems, customData: extractedCustomData, rawAst: tree };
}

export function resolveLocalLink(linkUrl: string, currentFileDir: string): string | null {
  if (/^(https?:|mailto:|#)/.test(linkUrl)) return null; // Ignore absolute URLs, mailto, and fragment-only links

  // Resolve relative paths
  let resolvedPath = path.resolve(currentFileDir, linkUrl.split('#')[0]); // Remove hash for path resolution

  // If it's a directory link, assume index.md
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    resolvedPath = path.join(resolvedPath, 'index.md');
  }

  // Ensure .md extension
  if (!resolvedPath.endsWith('.md')) {
    resolvedPath += '.md';
  }

  return resolvedPath; // Returns an absolute path or null
}

// buildGraph is not typically unit-tested directly in this context,
// as it orchestrates many file system operations and other functions.
// Its behavior is better tested via integration or end-to-end tests.
// However, if specific sub-logic within it were isolated, that could be exported.
function buildGraph(docsDir: string, outputFile: string, repoName: string, config?: WikiConfig) {
  const files = getMarkdownFiles(docsDir, config);
  console.log(`\nProcessing ${repoName} - Files found: ${files.length}`);

  const graph = new Graph({ multi: true, allowSelfLoops: true });
  const allFoundFilePaths = new Set(files.map(f => path.resolve(f))); // Store absolute paths

  for (const absoluteFilePath of files) {
    const fileId = path.basename(absoluteFilePath); // Using basename as a simple ID for now
    const fileDir = path.dirname(absoluteFilePath);

    if (!graph.hasNode(fileId)) {
      graph.addNode(fileId, {
        id: fileId, label: fileId, type: 'page', repoName: repoName,
        filePath: absoluteFilePath, isExternal: false, customProperties: {},
      } as GraphNode);
    }

    const content = fs.readFileSync(absoluteFilePath, 'utf-8');
    const astData = extractAllDataFromAst(content, absoluteFilePath, config);

    graph.updateNodeAttribute(fileId, 'customProperties', (props = {}) => ({
      ...props,
      title: astData.headings.find(h => h.depth === 1)?.text || fileId,
      headings: astData.headings, // Store full heading objects
      listItems: astData.listItems, // Store full list item objects
      extractedData: astData.customData,
    }));

    for (const link of astData.links) {
      const sourceNodeId = fileId;
      let targetNodeId: string;
      let targetNodePath: string | undefined = undefined;
      let linkType: GraphLink['type'] = 'internal'; // Default
      const edgeCustomProps: Record<string, any> = {
        sourceFile: sourceNodeId,
        targetOriginalUrl: link.url, // Store original URL for context
        text: link.text,
        titleAttr: link.title
      };

      if (/^(https?:|mailto:)/.test(link.url)) {
        targetNodeId = link.url;
        linkType = 'externalUrl';
        if (!graph.hasNode(targetNodeId)) {
          graph.addNode(targetNodeId, {
            id: targetNodeId, label: targetNodeId, type: 'externalUrl', repoName: repoName, // Or null for truly external
            isExternal: true, customProperties: {},
          } as GraphNode);
        }
      } else if (link.url.startsWith('#')) {
        // Link to a fragment within the same document
        targetNodeId = sourceNodeId; // Self-loop conceptually, or link to section
        linkType = 'internal-fragment';
        edgeCustomProps.targetFragment = link.url;
        // No new node, but edge represents fragment link
      }
      else { // Internal link to another file or potentially unresolved
        const resolvedAbsolutePath = resolveLocalLink(link.url, fileDir);

        if (resolvedAbsolutePath && allFoundFilePaths.has(resolvedAbsolutePath)) {
          targetNodeId = path.basename(resolvedAbsolutePath);
          targetNodePath = resolvedAbsolutePath;
          linkType = 'internal';
          if (!graph.hasNode(targetNodeId)) {
             // This should ideally not happen if all files are processed first,
             // but can happen if a link points to a file not in the initial glob (e.g. outside docsDir but resolved relatively)
             // Or if files are processed one by one. For now, add it.
            graph.addNode(targetNodeId, {
              id: targetNodeId, label: targetNodeId, type: 'page', repoName: repoName,
              filePath: targetNodePath, isExternal: false, customProperties: {},
            } as GraphNode);
          }
        } else {
          console.warn(`[${repoName}/${fileId}] Unresolved local link: "${link.url}" (resolved to: ${resolvedAbsolutePath})`);
          targetNodeId = `unresolved:${link.url}`;
          linkType = 'unresolved-internal';
           if (!graph.hasNode(targetNodeId)) {
            graph.addNode(targetNodeId, {
              id: targetNodeId, label: `Unresolved: ${link.url}`, type: 'unresolved', repoName: repoName,
              isExternal: false, customProperties: { originalLink: link.url },
            } as GraphNode);
          }
        }
      }

      if (config?.linkExtractors) {
        for (const extractor of config.linkExtractors) {
          const textToMatch = link.text || "";
          if (new RegExp(extractor.pattern).test(link.url) || new RegExp(extractor.pattern).test(textToMatch)) {
            edgeCustomProps.linkSubtype = extractor.linkType; // e.g., "discord", "docs"
            if (extractor.dataPattern) {
              const match = new RegExp(extractor.dataPattern).exec(link.url) || new RegExp(extractor.dataPattern).exec(textToMatch);
              if (match && match[1]) edgeCustomProps.extractedValue = match[1];
            }
            break;
          }
        }
      }

      // Use a unique key for each edge to prevent duplicates if the same link appears multiple times
      // and to allow multiple distinct links between same nodes.
      const edgeKey = `${sourceNodeId}#${targetNodeId}#${link.url}#${link.text || ''}`;
      if (!graph.hasEdge(edgeKey)) {
          graph.addEdgeWithKey(edgeKey, sourceNodeId, targetNodeId, {
          type: linkType,
          label: link.text || '',
          customProperties: edgeCustomProps,
        } as Omit<GraphLink, 'source' | 'target'>);
      }
    }
  }

  if (config?.nodeShapes) {
    graph.forEachNode((nodeId, attrs) => {
      for (const rule of config.nodeShapes) {
        if (new RegExp(rule.pattern).test(attrs.label || nodeId)) { // Match against label first, then ID
          graph.setNodeAttribute(nodeId, 'shape', rule.shape);
          if (rule.color) graph.setNodeAttribute(nodeId, 'color', rule.color);
          // graph.setNodeAttribute(nodeId, 'type', rule.shape); // Optionally override general type
          break;
        }
      }
    });
  }

  const outputNodes: GraphNode[] = graph.mapNodes((nodeId, attrs) => ({ ...attrs, id: nodeId } as GraphNode));
  const outputLinks: GraphLink[] = graph.mapEdges((_edgeKey, attrs, source, target) => ({
    source: source.toString(), target: target.toString(), ...attrs,
  } as GraphLink));

  const finalGraphData: GraphData = {
    nodes: outputNodes, links: outputLinks,
    nodesCount: graph.order, linksCount: graph.size,
  };

  fs.writeFileSync(outputFile, JSON.stringify(finalGraphData, null, 2));
  console.log(`Graph data for ${repoName} written to ${outputFile} (Nodes: ${finalGraphData.nodesCount}, Links: ${finalGraphData.linksCount})`);
}

const WIKI_CONFIGS: WikiConfig[] = [
  {
    repoName: "example-wiki", // Create a directory named 'example-wiki' in your 'repos/' folder for this to apply
    ignoreDirs: ["_archive", "drafts", "node_modules"],
    ignoreFiles: ["todo.md", "temp.md", "SUMMARY.md"],
    linkExtractors: [
      { pattern: "discord\\.com\\/invite\\/([a-zA-Z0-9]+)", linkType: "discord-invite", dataPattern: "discord\\.com\\/invite\\/([a-zA-Z0-9]+)" },
      { pattern: "twitter\\.com", linkType: "social-twitter" },
      { pattern: "github\\.com\\/[^\\/]+\\/[^\\/]+", linkType: "source-github-repo"},
      { pattern: "\\/docs\\/", linkType: "internal-docs-link"}
    ],
    nodeShapes: [
      { pattern: "^(api|svc)-", shape: "cylinder", color: "#4287f5" },
      { pattern: "discord\\.com", shape: "ellipse", color: "#7289DA"},
      { pattern: "twitter\\.com", shape: "hexagon", color: "#1DA1F2"},
      { pattern: "github\\.com", shape: "parallelogram", color: "#333"},
      { pattern: "unresolved:", shape: "rectangle", color: "#FF0000"},
    ],
    customDataExtractors: [
      {
        key: "tasks",
        listItemPattern: "^-\s*\\[([xX\\s])\\]\\s*(.+)",
        dataPoints: [
          { key: "status", pattern: "\\[([xX\\s])\\]" },
          { key: "description", pattern: "\\]\\s*(.+)" }
        ]
      },
      {
        key: "mentions",
        listItemPattern: "@(\\w+)", // Simpler: find list items containing @mentions
        dataPoints: [ {key: "user", pattern: "@(\\w+)"} ]
      }
    ]
  },
  // Add more configurations for other wikis (e.g., fmhy) here
];
export const WIKI_CONFIGS_FOR_TESTING = WIKI_CONFIGS; // Exporting for test usage if needed

const main = () => {
  const reposDir = path.join(__dirname, '../repos');
  const dataDir = path.join(__dirname, '../data');

  if (!fs.existsSync(reposDir)) {
    console.warn(`Repositories directory does not exist: ${reposDir}. Please create it and add your markdown repos.`);
    fs.mkdirSync(reposDir, { recursive: true });
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const repos = fs.readdirSync(reposDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`Found ${repos.length} potential repos: ${repos.join(', ')}`);

  for (const repo of repos) {
    const docsDir = path.join(reposDir, repo);
    const outputFile = path.join(dataDir, `${repo}.json`);
    const currentRepoConfig = WIKI_CONFIGS.find(c => c.repoName === repo);

    if (currentRepoConfig) {
      console.log(`Using custom configuration for ${repo}`);
    } else {
      console.log(`No custom configuration found for ${repo}, using defaults for ignores.`);
    }

    try {
      buildGraph(docsDir, outputFile, repo, currentRepoConfig);
    } catch (error) {
      console.error(`Error processing ${repo}:`, error);
    }
  }
};

main();
