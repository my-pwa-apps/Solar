import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readText(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf8');
}

test('app version and service worker cache manifest stay in sync', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Static regression checks only need to run once.');

  const [indexHtml, serviceWorker, i18n, utils, packageJsonText] = await Promise.all([
    readText('index.html'),
    readText('sw.js'),
    readText('src/i18n.js'),
    readText('src/modules/utils.js'),
    readText('package.json')
  ]);

  const packageJson = JSON.parse(packageJsonText);
  const version = packageJson.version;

  expect(serviceWorker).toContain(`const CACHE_VERSION = '${version}'`);
  expect(utils).toContain(`export const APP_VERSION = '${version}'`);
  expect(i18n).toContain(`|| '${version}'`);
  expect(indexHtml.match(new RegExp(`v=${version.replaceAll('.', '\\.')}`, 'g'))?.length).toBeGreaterThanOrEqual(10);

  const readManifest = (name) => {
    const match = serviceWorker.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`));
    expect(match, `${name} should be parseable`).not.toBeNull();
    return [...match[1].matchAll(/'([^']+)'/g)]
      .map((entry) => entry[1])
      .filter((entry) => entry.startsWith('./'));
  };

  const coreFiles = readManifest('CORE_CACHE_FILES');
  const assetFiles = readManifest('ASSET_CACHE_FILES');
  const cachedFiles = [...coreFiles, ...assetFiles];

  // Guard against the manifest silently emptying out (e.g. a refactor that
  // replaces the literals with spreads would otherwise make this test vacuous).
  expect(coreFiles.length).toBeGreaterThan(20);
  expect(assetFiles.length).toBeGreaterThan(40);
  expect(new Set(cachedFiles).size, 'precache manifest must not contain duplicates').toBe(cachedFiles.length);

  const missingFiles = [];
  for (const cachedFile of cachedFiles) {
    const relativePath = cachedFile === './' ? '.' : cachedFile.replace(/^\.\//, '');
    try {
      await fs.access(path.join(repoRoot, relativePath));
    } catch {
      missingFiles.push(cachedFile);
    }
  }

  expect(missingFiles).toEqual([]);
});

test('every three.js addon and transitive module the app imports is self-hosted and precached', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Static regression checks only need to run once.');

  const [indexHtml, serviceWorker] = await Promise.all([readText('index.html'), readText('sw.js')]);

  // CSP script-src must be self + importmap hashes only (no external CDN).
  const cspMatch = indexHtml.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
  expect(cspMatch, 'CSP meta tag must exist').not.toBeNull();
  expect(cspMatch[1]).not.toContain('cdn.jsdelivr.net');

  // The importmap must point to self-hosted vendor/three@<version>/ paths.
  const importmapVersions = new Set(
    [...indexHtml.matchAll(/\.\/vendor\/three@([\d.]+)\//g)].map((m) => m[1])
  );
  expect(importmapVersions.size, 'index.html must pin exactly one self-hosted three.js version').toBe(1);
  const [pinnedVersion] = [...importmapVersions];

  const coreMatch = serviceWorker.match(/const CORE_CACHE_FILES = \[([\s\S]*?)\];/);
  expect(coreMatch, 'CORE_CACHE_FILES should be parseable').not.toBeNull();
  const coreFiles = [...coreMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const vendorFiles = coreFiles.filter((f) => f.startsWith('./vendor/three@'));

  for (const file of vendorFiles) {
    expect(file, `${file} must use the pinned three.js version`).toContain(`three@${pinnedVersion}/`);
  }

  // Collect the addon specifiers actually imported by application code, then
  // recursively walk their relative imports inside vendor/three@<version>/examples/jsm/
  // so that missing transitive modules (Pass.js, shaders, GLTFLoader, etc.) fail the build.
  const sourceFiles = ['src/main.js', 'src/modules/SceneManager.js', 'src/modules/SolarSystemModule.js', 'src/modules/utils.js'];
  const addonClosure = new Set();
  const queue = [];

  for (const file of sourceFiles) {
    const source = await readText(file);
    for (const match of source.matchAll(/from 'three\/addons\/([^']+)'/g)) {
      queue.push(match[1]);
    }
  }
  expect(queue.length).toBeGreaterThan(0);

  while (queue.length > 0) {
    const addonRel = queue.pop();
    if (addonClosure.has(addonRel)) continue;
    addonClosure.add(addonRel);

    const addonSource = await readText(`vendor/three@${pinnedVersion}/examples/jsm/${addonRel}`);
    // Match real ES module import statements (not JSDoc comments)
    for (const match of addonSource.matchAll(/^\s*import\s+[\s\S]*?from\s+['"](\.[^'"]+)['"]/gm)) {
      const childRel = path.posix.normalize(path.posix.join(path.posix.dirname(addonRel), match[1]));
      queue.push(childRel);
    }
  }

  const precachedAddons = new Set(
    vendorFiles
      .map((f) => f.split('/examples/jsm/')[1])
      .filter(Boolean)
  );

  expect([...addonClosure].sort(), 'every imported three.js addon and its transitive imports must be precached in CORE_CACHE_FILES')
    .toEqual([...precachedAddons].sort());

  expect(vendorFiles).toContain(`./vendor/three@${pinnedVersion}/build/three.module.js`);
  expect(vendorFiles).toContain(`./vendor/three@${pinnedVersion}/build/three.core.js`);
});

test('all localized manifests expose the same capabilities', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Static regression checks only need to run once.');

  const locales = ['', '.nl', '.fr', '.de', '.es', '.pt'];
  const manifests = await Promise.all(
    locales.map(async (suffix) => ({
      name: `manifest${suffix}.json`,
      json: JSON.parse(await readText(`manifest${suffix}.json`))
    }))
  );

  // Locale manifests drifted apart once already: de/es/pt silently lost
  // handle_links, launch_handler and display_override, so installed apps in
  // those languages behaved differently from the English one for no reason.
  const referenceKeys = Object.keys(manifests[0].json).sort();
  for (const { name, json } of manifests) {
    expect(Object.keys(json).sort(), `${name} must declare the same fields as manifest.json`).toEqual(referenceKeys);
  }

  // A declared share_target that has no route behind it makes the OS offer the
  // app as a share destination and then fail. Only declare it once it is served.
  for (const { name, json } of manifests) {
    expect(json.share_target, `${name} must not declare an unimplemented share target`).toBeUndefined();
  }
});