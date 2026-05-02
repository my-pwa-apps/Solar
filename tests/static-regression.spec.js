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

  const cacheFilesMatch = serviceWorker.match(/const STATIC_CACHE_FILES = \[([\s\S]*?)\];/);
  expect(cacheFilesMatch, 'STATIC_CACHE_FILES should be parseable').not.toBeNull();

  const cachedFiles = [...cacheFilesMatch[1].matchAll(/'([^']+)'/g)]
    .map((match) => match[1])
    .filter((entry) => entry.startsWith('./'));

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