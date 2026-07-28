#!/usr/bin/env node
/**
 * Single-source-of-truth version stamping.
 *
 * `package.json` -> version is authoritative. This script propagates it to every
 * place the app repeats it (service-worker cache key, runtime constant, i18n
 * fallback, and the ~11 cache-busting `?v=` query strings in index.html).
 *
 * Usage:
 *   node scripts/sync-version.mjs           # stamp files from package.json
 *   node scripts/sync-version.mjs --check   # fail if anything is out of sync
 *   node scripts/sync-version.mjs --bump    # bump patch, then stamp
 *
 * Rationale: the service worker only invalidates caches when CACHE_VERSION
 * changes. Forgetting one of these locations ships stale JS to every installed
 * user, which is not detectable at runtime. Automating it removes the class.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const mode = process.argv.includes('--check')
  ? 'check'
  : process.argv.includes('--bump')
    ? 'bump'
    : 'write';

const VERSION_RE = /\d+\.\d+\.\d+/;

/** Each target declares how to find the version token(s) it owns. */
const targets = [
  {
    file: 'sw.js',
    pattern: /^\/\/ Version \d+\.\d+\.\d+$/m,
    replace: (v) => `// Version ${v}`
  },
  {
    file: 'sw.js',
    pattern: /const CACHE_VERSION = '\d+\.\d+\.\d+';/,
    replace: (v) => `const CACHE_VERSION = '${v}';`
  },
  {
    file: 'src/modules/utils.js',
    pattern: /export const APP_VERSION = '\d+\.\d+\.\d+';/,
    replace: (v) => `export const APP_VERSION = '${v}';`
  },
  {
    file: 'src/i18n.js',
    pattern: /\.get\('v'\) \|\| '\d+\.\d+\.\d+'/,
    replace: (v) => `.get('v') || '${v}'`
  },
  {
    file: 'index.html',
    pattern: /\?v=\d+\.\d+\.\d+/g,
    replace: (v) => `?v=${v}`,
    minMatches: 10
  }
];

async function readPackageVersion() {
  const raw = await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8');
  return { raw, json: JSON.parse(raw) };
}

function bumpPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

async function main() {
  const { raw: pkgRaw, json: pkg } = await readPackageVersion();

  if (!VERSION_RE.test(pkg.version)) {
    throw new Error(`package.json version "${pkg.version}" is not semver-like`);
  }

  const version = mode === 'bump' ? bumpPatch(pkg.version) : pkg.version;

  if (mode === 'bump') {
    await fs.writeFile(
      path.join(repoRoot, 'package.json'),
      pkgRaw.replace(`"version": "${pkg.version}"`, `"version": "${version}"`),
      'utf8'
    );
  }

  const problems = [];
  const changed = [];

  // Group edits per file so each file is read and written once.
  const byFile = new Map();
  for (const target of targets) {
    if (!byFile.has(target.file)) byFile.set(target.file, []);
    byFile.get(target.file).push(target);
  }

  for (const [file, fileTargets] of byFile) {
    const absolute = path.join(repoRoot, file);
    const original = await fs.readFile(absolute, 'utf8');
    let updated = original;

    for (const target of fileTargets) {
      const matches = updated.match(target.pattern);
      if (!matches) {
        problems.push(`${file}: no match for ${target.pattern}`);
        continue;
      }
      if (target.minMatches && matches.length < target.minMatches) {
        problems.push(
          `${file}: expected at least ${target.minMatches} version stamps, found ${matches.length}`
        );
      }
      updated = updated.replace(target.pattern, target.replace(version));
    }

    if (updated === original) continue;

    if (mode === 'check') {
      problems.push(`${file}: version stamps are out of sync with package.json (${version})`);
    } else {
      await fs.writeFile(absolute, updated, 'utf8');
      changed.push(file);
    }
  }

  if (problems.length > 0) {
    console.error('Version sync failed:');
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error('\nRun `npm run version:sync` to fix.');
    process.exitCode = 1;
    return;
  }

  if (mode === 'check') {
    console.log(`Version ${version} is in sync across all targets.`);
  } else {
    console.log(
      changed.length > 0
        ? `Stamped ${version} into: ${changed.join(', ')}`
        : `Version ${version} was already in sync.`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
