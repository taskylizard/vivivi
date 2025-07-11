import fs from 'fs';
import path from 'path';
import { globSync } from 'tinyglobby';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Node {
  id: string;
  isExternal: boolean;
  text?: string; // Add text field for display purposes
}

interface Link {
  source: string;
  target: string;
}

interface ExtractedLink {
  text: string;
  url: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
  nodesCount: number;
}

const IGNORED_DIRS = [
  'br',
  'es',
  'ro',
  'sandbox',
  'other',
  'posts',
  'node_modules',
];

const IGNORED_FILES = [
  'index.md',
  'sandbox.md',
  'license.md',
  'LICENSE.md',
  'contribute.md',
  'CONTRIBUTING.md',
  'README.md',
  't.md',
  'start.md',
  'about.md',
  'credits.md',
  'faq.md',
];

function getMarkdownFiles(docsDir: string): string[] {
  const pattern = path.join(docsDir, '**/*.md');

  return globSync(pattern, {
    ignore: [
      ...IGNORED_DIRS.map((folder) => path.join('**', folder)),
      ...IGNORED_FILES.map((file) => path.join(docsDir, '**', file)),
    ],
  });
}

function extractLinks(content: string): ExtractedLink[] {
  // Matches [text](link) including those wrapped in bold **[text](link)**
  const regex = /\*{0,2}\[([^\]]*)\]\(([^)]+)\)\*{0,2}/g;
  const links: ExtractedLink[] = [];
  let match;
  while ((match = regex.exec(content))) {
    const text = match[1] || match[2]; // Use link text, fallback to URL
    // Strip any remaining asterisks from the text
    const cleanText = text.replace(/^\*+|\*+$/g, '');
    links.push({
      text: cleanText,
      url: match[2],
    });
  }
  return links;
}

function resolveLocalLink(link: string): string | null {
  // Ignore mailto, http, https
  if (/^(https?:|mailto:)/.test(link)) return null;
  // Remove anchor/hash
  let clean = link.split('#')[0];
  // Remove leading /
  if (clean.startsWith('/')) clean = clean.slice(1);
  // If it ends with /, treat as index.md in that folder
  if (clean.endsWith('/')) clean += 'index.md';
  // If no .md, add .md (for wiki links like 'useful')
  if (!clean.endsWith('.md')) clean += '.md';
  return clean;
}

function buildGraph(docsDir: string, outputFile: string) {
  const files = getMarkdownFiles(docsDir);
  console.log(`\nFiles in ${docsDir}:`);
  files.forEach(file => console.log(`- ${file}`));

  const fileNodes = new Set<string>();
  const externalNodes = new Map<string, string>(); // Map URL to text
  const links: Link[] = [];

  const fileBasenames = new Set(files.map((f) => path.basename(f)));

  for (const file of files) {
    const fileId = path.basename(file);
    fileNodes.add(fileId);
    const content = fs.readFileSync(file, 'utf-8');
    const foundLinks = extractLinks(content);
    for (const link of foundLinks) {
      if (/^https?:/.test(link.url)) {
        // External link
        externalNodes.set(link.url, link.text);
        links.push({ source: fileId, target: link.url });
      } else {
        // Local link
        const resolved = resolveLocalLink(link.url);
        if (resolved && fileBasenames.has(resolved)) {
          links.push({ source: fileId, target: resolved });
        }
      }
    }
  }

  const nodes: Node[] = [
    ...Array.from(fileNodes).map((id) => ({ id, isExternal: false })),
    ...Array.from(externalNodes.entries()).map(([id, text]) => ({
      id,
      isExternal: true,
      text,
    })),
  ];

  const graph: GraphData = {
    nodes,
    links,
    nodesCount: nodes.length,
  };
  fs.writeFileSync(outputFile, JSON.stringify(graph, null, 2));
  console.log(`Graph data written to ${outputFile}`);
  console.log(`Total nodes: ${nodes.length}`);
}

const reposDir = path.join(__dirname, '../repos');
const dataDir = path.join(__dirname, '../data');

if (fs.existsSync(dataDir)) {
  fs.rmSync(dataDir, { recursive: true });
}
fs.mkdirSync(dataDir);

const repos = fs.readdirSync(reposDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

for (const repo of repos) {
  const docsDir = path.join(reposDir, repo);
  const outputFile = path.join(dataDir, `${repo}.json`);

  try {
    buildGraph(docsDir, outputFile);
  } catch (error) {
    console.error(`Error processing ${repo}:`, error);
  }
}
