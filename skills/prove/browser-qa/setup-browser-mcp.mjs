#!/usr/bin/env node
// setup-browser-mcp.mjs — give an MCP-based agent a browser capability by adding
// the Playwright MCP server to its config, so browser-qa doesn't need the user to
// wire it by hand. Zero-dependency, idempotent, and NON-CLOBBERING: it merges one
// server entry and preserves everything else.
//
// Schema verified against https://opencode.ai/docs/mcp-servers — the server is a
// direct child of `mcp`, keyed by name (NOT nested under a "servers" key).
//
// Usage:
//   node setup-browser-mcp.mjs                 # global OpenCode: ~/.config/opencode/opencode.json
//   node setup-browser-mcp.mjs --project       # project OpenCode: ./opencode.json
//   node setup-browser-mcp.mjs --path <file>   # explicit config file
//   node setup-browser-mcp.mjs --dry-run       # show what would change, write nothing
//   node setup-browser-mcp.mjs --no-testing    # omit the --caps=testing assertion tools
//
// After it runs, RESTART OpenCode — a freshly-added MCP server isn't usable in the
// running session. Requires Node >= 20 (Playwright MCP's requirement).
//
// Exit: 0 added or already present; 2 refused (unparseable config — never clobbered).

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve, join } from 'node:path';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

const configPath = resolve(
  val('--path') ??
  (has('--project') ? join(process.cwd(), 'opencode.json')
                    : join(homedir(), '.config', 'opencode', 'opencode.json'))
);

const command = ['npx', '-y', '@playwright/mcp@latest'];
if (!has('--no-testing')) command.push('--caps=testing');
const SERVER = { type: 'local', command, enabled: true };
const NAME = 'playwright';

// Read existing config, or start a fresh one. NEVER overwrite a file we can't parse.
let config = { $schema: 'https://opencode.ai/config.json' };
let existed = false;
if (existsSync(configPath)) {
  existed = true;
  const raw = readFileSync(configPath, 'utf8');
  try {
    config = JSON.parse(raw);
  } catch (e) {
    console.error(`Refusing to touch ${configPath}: it isn't valid JSON (${e.message}).`);
    console.error(`Fix or add the "${NAME}" MCP server by hand — see docs/browser-qa-setup.md.`);
    process.exit(2);
  }
}

if (config.mcp && config.mcp[NAME]) {
  console.log(`Already configured: "${NAME}" MCP server is present in ${configPath}. Nothing to do.`);
  process.exit(0);
}

// Merge — preserve $schema, any other keys, and any existing mcp servers.
const next = { ...config, mcp: { ...(config.mcp ?? {}), [NAME]: SERVER } };
const out = JSON.stringify(next, null, 2) + '\n';

if (has('--dry-run')) {
  console.log(`[dry-run] would write to ${configPath}:\n`);
  console.log(out);
  console.log('[dry-run] no changes made.');
  process.exit(0);
}

mkdirSync(dirname(configPath), { recursive: true });
if (existed) copyFileSync(configPath, configPath + '.bak'); // safety: back up before editing
writeFileSync(configPath, out);

console.log(`Added the "${NAME}" (Playwright) MCP server to ${configPath}.`);
if (existed) console.log(`(Backed up the previous config to ${configPath}.bak.)`);
console.log('Next: RESTART OpenCode so it loads the server, then confirm with `opencode mcp list`.');
console.log('Requires Node >= 20. Vision/coordinate mode: add "--caps=testing,vision" if you need it.');
process.exit(0);
