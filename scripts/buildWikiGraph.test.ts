// Basic Test Suite for buildWikiGraph.ts (Conceptual)
// In a real environment, you'd use a test runner like Jest, Vitest, or Mocha/Chai.
// For now, these are functions that would be called by such a runner.
// We'll use simple console.assert for demonstration if these were to be run directly.

import path from 'path';
import type { Root } from 'mdast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

import {
  extractLinksFromAst,
  extractAllDataFromAst,
  resolveLocalLink,
  // WIKI_CONFIGS_FOR_TESTING // Example config can be used here
} from './buildWikiGraph'; // Adjust path if necessary
import type { WikiConfig, ExtractedLink, AstExtractionData } from './configTypes';

// Helper for parsing markdown to AST for tests that need it
const parseToAst = (markdown: string): Root => {
  return unified().use(remarkParse).parse(markdown) as Root;
};

// --- Test Data ---
const simpleMd = `
# Title

[A link](http://example.com "Example Dot Com") and [another link](./local.md).

A [reference-style link][ref].

[ref]: /absolute/path.md "Ref Title"
`;

const listMd = `
# List Test
- Item 1
- Item 2 with [a link](page.md)
- - Sub Item 2.1 (Note: simple text extraction won't capture nesting well for list items)

### Tasks
- [x] Completed task
- [ ] Pending task / [Discord](discord.com/server)
- Item with @mention and a [link to section](#tasks)
`;

const fmhyStyleMd = `
### Cool Apps
- [App One](app1.com) - A great app / [Discord](discord.com/app1) / [Source](github.com/app1)
- - [Nested App](nested.com) - Sub app / [Bluesky](bsky.app/profile)
- [App Two](app2.net) - Another choice
`;

// --- Test Suites (Conceptual) ---

function testExtractLinks() {
  console.log("--- Running: testExtractLinks ---");
  const ast = parseToAst(simpleMd);
  const links = extractLinksFromAst(ast);

  console.assert(links.length === 3, "TestExtractLinks: Expected 3 links");
  console.assert(links.some(l => l.url === 'http://example.com' && l.text === 'A link' && l.title === "Example Dot Com"), "TestExtractLinks: Direct link failed");
  console.assert(links.some(l => l.url === './local.md' && l.text === 'another link'), "TestExtractLinks: Relative link failed");
  console.assert(links.some(l => l.url === '/absolute/path.md' && l.text === 'reference-style link' && l.title === "Ref Title"), "TestExtractLinks: Reference link failed");
  console.log("--- Finished: testExtractLinks ---");
}

function testResolveLocalLink() {
  console.log("--- Running: testResolveLocalLink ---");
  const currentDir = '/test/docs';

  console.assert(resolveLocalLink('./page.md', currentDir) === path.resolve(currentDir, 'page.md'), "Resolve: ./page.md");
  console.assert(resolveLocalLink('another.md', currentDir) === path.resolve(currentDir, 'another.md'), "Resolve: another.md");
  console.assert(resolveLocalLink('../sibling/file.md', currentDir) === path.resolve(currentDir, '../sibling/file.md'), "Resolve: ../sibling/file.md");
  console.assert(resolveLocalLink('/root.md', currentDir) === null, "Resolve: /root.md (should be null as it's treated as absolute path outside context of simple resolver)"); // Current resolver doesn't handle this well.
  console.assert(resolveLocalLink('page#section', currentDir) === path.resolve(currentDir, 'page.md'), "Resolve: page#section");
  console.assert(resolveLocalLink('http://ext.com', currentDir) === null, "Resolve: http://ext.com");
  console.assert(resolveLocalLink('#fragment', currentDir) === null, "Resolve: #fragment (fragment only)");
  console.assert(resolveLocalLink('noextension', currentDir) === path.resolve(currentDir, 'noextension.md'), "Resolve: noextension");
  console.assert(resolveLocalLink('folder/', currentDir) === path.resolve(currentDir, 'folder/index.md'), "Resolve: folder/");

  // Test with a file that is in a subdirectory
  const subDirFile = '/test/docs/subdir/current.md';
  const subDir = path.dirname(subDirFile);
  console.assert(resolveLocalLink('../another.md', subDir) === path.resolve(subDir, '../another.md'), "Resolve: ../another.md from subdir");


  console.log("--- Finished: testResolveLocalLink ---");
}

function testExtractAllData() {
  console.log("--- Running: testExtractAllData ---");
  const data = extractAllDataFromAst(listMd, "/test/lists.md");

  console.assert(data.headings.length === 2, "ExtractAll: Headings count");
  console.assert(data.headings[0].text === 'List Test' && data.headings[0].depth === 1, "ExtractAll: H1 Text/Depth");
  console.assert(data.links.length === 2, "ExtractAll: Links count in listMd");
  console.assert(data.links.some(l => l.url === 'page.md'), "ExtractAll: Link from list item");
  console.assert(data.links.some(l => l.url === 'discord.com/server'), "ExtractAll: Discord link from list item");
  console.assert(data.listItems.length === 4, "ExtractAll: List items count"); // Includes sub-item as a flat item
  console.assert(data.listItems.some(li => li.text.includes("Item 1")), "ExtractAll: List item text check");

  // Test with a simple config for customDataExtractors
  const taskConfig: WikiConfig = {
    repoName: "test-repo",
    customDataExtractors: [
      {
        key: "tasks",
        listItemPattern: "^\\[([xX\\s])\\]\\s*(.+)", // Matches list items starting with [x] or [ ]
        dataPoints: [
          { key: "status", pattern: "\\[([xX\\s])\\]" },
          { key: "description", pattern: "\\]\\s*(.+)" }
        ]
      },
      {
        key: "mentionsInTasks", // More specific key
        listItemPattern: "^\\[([xX\\s])\\]\\s*.*@(\\w+)", // Matches tasks that also contain a mention
        dataPoints: [{ key: "mentionedUser", pattern: "@(\\w+)"}]
      }
    ]
  };
  const dataWithTaskConfig = extractAllDataFromAst(listMd, "/test/tasks.md", taskConfig);

  console.assert(dataWithTaskConfig.customData?.tasks?.length === 2, "ExtractAll (Config): Tasks count");
  const completedTask = dataWithTaskConfig.customData?.tasks?.find((t:any) => t.description === 'Completed task');
  console.assert(completedTask && completedTask.status === 'x', "ExtractAll (Config): Completed task status/desc");

  const pendingTask = dataWithTaskConfig.customData?.tasks?.find((t:any) => t.description.startsWith('Pending task'));
  console.assert(pendingTask && pendingTask.status === ' ', "ExtractAll (Config): Pending task status/desc");

  console.assert(dataWithTaskConfig.customData?.mentionsInTasks === undefined, "ExtractAll (Config): Mentions in tasks (should be undefined as pattern is different)");

  // Test fmhyStyleMd with a more complex extractor
  const fmhyConfig: WikiConfig = {
      repoName: "fmhy-test",
      customDataExtractors: [
          {
              key: "apps",
              listItemPattern: "^-\s*\\[([^\\]]+)\\]\\(([^\\)]+)\\)\\s*-\\s*(.+)", // Markdown: - [Text](link) - Description / Link / Link
              dataPoints: [
                  { key: "appName", pattern: "\\[([^\\]]+)\\]" },       // Extracts "App One"
                  { key: "appUrl", pattern: "\\(([^\\)]+)\\)" },        // Extracts "app1.com"
                  { key: "description", pattern: "-\\s*([^/]+)" },  // Extracts "A great app "
                  // For multiple links in description, one would need more sophisticated dataPoints or post-processing
                  // Or multiple customDataExtractors targeting the same listItemPattern with different dataPoints.
              ]
          }
      ]
  };
  const fmhyData = extractAllDataFromAst(fmhyStyleMd, "/test/fmhy.md", fmhyConfig);
  console.assert(fmhyData.customData?.apps?.length === 2, "ExtractAll (FMHY): Apps count"); // Nested app not caught by this simple pattern
  const appOne = fmhyData.customData?.apps?.find((app:any) => app.appName === "App One");
  console.assert(appOne && appOne.appUrl === "app1.com", "ExtractAll (FMHY): App One URL");
  console.assert(appOne && appOne.description && appOne.description.trim() === "A great app", "ExtractAll (FMHY): App One Description: " + appOne?.description);


  console.log("--- Finished: testExtractAllData ---");
}


// --- Runner (Conceptual) ---
function runTests() {
  testExtractLinks();
  testResolveLocalLink();
  testExtractAllData();
  console.log("\nConceptual tests completed. Check assertions in console.");
}

// If this file were run directly (e.g., `node scripts/buildWikiGraph.test.js` after tsc)
// runTests();
// However, typically a test runner (Jest/Vitest) would discover and run these.

console.log("buildWikiGraph.test.ts loaded. Run tests with a test runner or by calling runTests().");
