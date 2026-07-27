#!/usr/bin/env node
/**
 * sync-version.mjs
 * ----------------
 * Single-command version stamping for Space Voyage.
 *
 * `package.json` is the single source of truth. This script propagates that
 * version into every other place the version is duplicated:
 *
 *   - sw.js            -> header comment + `const CACHE_VERSION = '...'`
 *   - src/modules/utils.js -> `export const APP_VERSION = '...'`
 *   - src/i18n.js      -> the two `|| '<version>'` fallbacks
 *   - index.html       -> every `?v=<semver>` / `&v=<semver>` cache buster
 *
 * Usage:
 *   node scripts/sync-version.mjs            # stamp current package.json version
 *   node scripts/sync-version.mjs --bump     # bump patch, then stamp
 *   node scripts/sync-version.mjs --check    # verify only, non-zero exit on drift
 *   node scripts/sync-version.mjs 2.11.0     # set an explicit version, then stamp
 *
 * All files are written as UTF-8 without BOM (project-wide requirement).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = /^\d+\.\d+\.\d+$/;

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const bump = args.includes('--bump');
const explicit = args.find((a) => SEMVER.test(a));

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const write = (rel, text) => writeFileSync(join(ROOT, rel), text, 'utf8');

// ── Resolve target version ────────────────────────────────────────────────────
const pkgRaw = read('package.json');
const pkg = JSON.parse(pkgRaw);
let version = pkg.version;

if (explicit) {
  version = explicit;
} else if (bump) {
  const [maj, min, patch] = version.split('.').map(Number);
  version = `${maj}.${min}.${patch + 1}`;
}

if (!SEMVER.test(version)) {
  console.error(`[sync-version] Invalid version "${version}" (expected MAJOR.MINOR.PATCH).`);
  process.exit(1);
}

// ── Rewrite rules ─────────────────────────────────────────────────────────────
/** @type {{file: string, replacements: Array<[RegExp, string]>}[]} */
const targets = [
  {
    file: 'package.json',
    replacements: [[/("version"\s*:\s*")\d+\.\d+\.\d+(")/, `$1${version}$2`]]
  },
  {
    file: 'sw.js',
    replacements: [
      [/^(\/\/ Version )\d+\.\d+\.\d+$/m, `$1${version}`],
      [/(const CACHE_VERSION = ')\d+\.\d+\.\d+(')/, `$1${version}$2`]
    ]
  },
  {
    file: 'src/modules/utils.js',
    replacements: [[/(export const APP_VERSION = ')\d+\.\d+\.\d+(')/, `$1${version}$2`]]
  },
  {
    file: 'src/i18n.js',
    replacements: [[/(\|\|\s*')\d+\.\d+\.\d+(')/g, `$1${version}$2`]]
  },
  {
    file: 'index.html',
    replacements: [[/([?&]v=)\d+\.\d+\.\d+/g, `$1${version}`]]
  }
];

let drift = 0;
let changed = 0;

for (const { file, replacements } of targets) {
  const before = read(file);
  let after = before;
  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(after)) {
      console.error(`[sync-version] Pattern not found in ${file}: ${pattern}`);
      process.exit(1);
    }
    // Reset lastIndex for /g regexes reused by .test() above.
    pattern.lastIndex = 0;
    after = after.replace(pattern, replacement);
  }
  if (after === before) continue;

  drift++;
  if (checkOnly) {
    console.error(`[sync-version] DRIFT: ${file} is not at ${version}`);
  } else {
    write(file, after);
    changed++;
    console.log(`[sync-version] updated ${file}`);
  }
}

if (checkOnly) {
  if (drift > 0) {
    console.error(`[sync-version] ${drift} file(s) out of sync with ${version}. Run: npm run version:sync`);
    process.exit(1);
  }
  console.log(`[sync-version] OK - all files at ${version}`);
} else {
  console.log(`[sync-version] ${changed} file(s) stamped to ${version}`);
}
