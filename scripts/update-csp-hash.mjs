#!/usr/bin/env node
/**
 * Keep the CSP script-src hashes in step with every inline <script> in index.html.
 *
 * index.html contains more than one inline script (the importmap and a bootstrap
 * block). A stale or missing hash produces no obvious failure in a released
 * build - the script is simply never executed and the app hangs on the loading
 * screen - so these are generated rather than maintained by hand.
 *
 * Usage:
 *   node scripts/update-csp-hash.mjs           rewrite index.html in place
 *   node scripts/update-csp-hash.mjs --check   exit 1 if hashes are stale (CI)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'index.html');
const check = process.argv.includes('--check');

const html = readFileSync(indexPath, 'utf8');

// Every <script> that has a body and no src attribute needs a hash. The digest
// covers the element's text content exactly as written, so indentation matters.
//
// Line endings must be normalised first: the HTML parser converts CRLF and lone
// CR to LF in the input stream before the content ever reaches the CSP check, so
// hashing the raw bytes of a CRLF file yields a digest the browser never sees.
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .map((m) => m[2].replace(/\r\n?/g, '\n'))
    .filter((body) => body.trim().length > 0);

if (inlineScripts.length === 0) {
    console.error('index.html: no inline scripts found');
    process.exit(1);
}

const hashes = inlineScripts.map(
    (body) => `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`
);

const cspMatch = html.match(/(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/);
if (!cspMatch) {
    console.error('index.html: no Content-Security-Policy meta tag found');
    process.exit(1);
}

const csp = cspMatch[2];
const scriptSrcMatch = csp.match(/script-src ([^;]*)/);
if (!scriptSrcMatch) {
    console.error('index.html: CSP has no script-src directive');
    process.exit(1);
}

// Preserve non-hash sources ('self', host allowlists) and replace only the hashes.
const existing = scriptSrcMatch[1].trim().split(/\s+/);
const nonHash = existing.filter((tok) => !/^'sha(256|384|512)-/.test(tok));
const currentHashes = existing
    .filter((tok) => /^'sha256-/.test(tok))
    .map((tok) => tok.slice(1, -1));

const upToDate =
    currentHashes.length === hashes.length &&
    hashes.every((h) => currentHashes.includes(h));

if (upToDate) {
    console.log(`CSP script-src hashes are up to date (${hashes.length} inline script(s))`);
    process.exit(0);
}

if (check) {
    console.error(
        'CSP script-src hashes are stale.\n' +
        `  inline scripts: ${hashes.length}\n` +
        `  found:    ${currentHashes.join(' ') || '(none)'}\n` +
        `  expected: ${hashes.join(' ')}\n` +
        '  run: npm run csp:sync'
    );
    process.exit(1);
}

const desired = [...nonHash, ...hashes.map((h) => `'${h}'`)].join(' ');
const newCsp = csp.replace(/script-src [^;]*/, `script-src ${desired}`);
writeFileSync(indexPath, html.replace(cspMatch[0], `${cspMatch[1]}${newCsp}${cspMatch[3]}`), 'utf8');
console.log(`Updated CSP script-src for ${hashes.length} inline script(s):\n  ${hashes.join('\n  ')}`);
