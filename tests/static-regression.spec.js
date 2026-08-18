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

test('every three.js addon the app imports is pinned and precached at one version', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Static regression checks only need to run once.');

  const [indexHtml, serviceWorker] = await Promise.all([readText('index.html'), readText('sw.js')]);

  // The importmap is covered by a CSP hash, so a version bump there must be a
  // deliberate, reviewed change — and sw.js must be bumped in the same commit.
  const importmapVersions = new Set(
    [...indexHtml.matchAll(/cdn\.jsdelivr\.net\/npm\/three@([\d.]+)\//g)].map((m) => m[1])
  );
  expect(importmapVersions.size, 'index.html must pin exactly one three.js version').toBe(1);
  const [pinnedVersion] = [...importmapVersions];

  const cdnMatch = serviceWorker.match(/const CDN_CACHE_FILES = \[([\s\S]*?)\];/);
  expect(cdnMatch, 'CDN_CACHE_FILES should be parseable').not.toBeNull();
  const cdnFiles = [...cdnMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  for (const url of cdnFiles) {
    expect(url, `${url} must use the pinned three.js version`).toContain(`three@${pinnedVersion}/`);
  }

  // Collect the addon specifiers actually imported by application code. An addon
  // that is imported but not precached silently breaks the first offline launch;
  // one that is precached but not imported wastes install bandwidth forever.
  const sourceFiles = ['src/main.js', 'src/modules/SceneManager.js', 'src/modules/SolarSystemModule.js', 'src/modules/utils.js'];
  const importedAddons = new Set();
  for (const file of sourceFiles) {
    const source = await readText(file);
    for (const match of source.matchAll(/from 'three\/addons\/([^']+)'/g)) {
      importedAddons.add(match[1]);
    }
  }
  expect(importedAddons.size).toBeGreaterThan(0);

  const precachedAddons = new Set(
    cdnFiles
      .map((url) => url.split('/examples/jsm/')[1])
      .filter(Boolean)
  );

  expect([...importedAddons].sort(), 'every imported three.js addon must be precached in sw.js')
    .toEqual([...precachedAddons].sort());

  expect(cdnFiles.some((url) => url.endsWith('/build/three.module.js')), 'the three.js core build must be precached').toBe(true);
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