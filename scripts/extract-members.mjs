/**
 * Extract class methods from SolarSystemModule.js into a submodule.
 *
 * Boundaries are found by brace-depth tracking rather than indentation: this
 * file mixes indentation levels and a naive regex picks up things like the
 * `resolve(` inside a Promise callback as if it were a class member.
 *
 * Extracted methods keep their exact source text. Class method syntax
 * `foo() { ... }` is also valid object-literal syntax, so the pieces are joined
 * with commas and re-attached via Object.assign(prototype, ...).
 *
 * Usage: node scripts/extract-members.mjs <outFile> <exportName> <name1,name2,...>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE = 'src/modules/SolarSystemModule.js';

/** Strip strings, template literals, regex literals and comments to a mask. */
function maskCode(src) {
    const out = new Array(src.length).fill(true); // true = real code
    let i = 0;
    const n = src.length;
    let prevMeaningful = '';

    while (i < n) {
        const c = src[i];
        const c2 = src[i + 1];

        if (c === '/' && c2 === '/') {
            while (i < n && src[i] !== '\n') { out[i] = false; i++; }
            continue;
        }
        if (c === '/' && c2 === '*') {
            out[i] = out[i + 1] = false; i += 2;
            while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { out[i] = false; i++; }
            if (i < n) { out[i] = out[i + 1] = false; i += 2; }
            continue;
        }
        if (c === '"' || c === "'" || c === '`') {
            const quote = c;
            out[i] = false; i++;
            while (i < n) {
                if (src[i] === '\\') { out[i] = false; out[i + 1] = false; i += 2; continue; }
                if (src[i] === quote) { out[i] = false; i++; break; }
                // Template placeholders contain real code, but treating them as
                // string keeps brace counting balanced because ${ } is matched.
                out[i] = false; i++;
            }
            continue;
        }
        // Regex literal: only where a value cannot precede it.
        if (c === '/' && !/[\w)\]]/.test(prevMeaningful)) {
            let j = i + 1, ok = false, inClass = false;
            while (j < n) {
                if (src[j] === '\\') { j += 2; continue; }
                if (src[j] === '[') inClass = true;
                else if (src[j] === ']') inClass = false;
                else if (src[j] === '/' && !inClass) { ok = true; break; }
                else if (src[j] === '\n') break;
                j++;
            }
            if (ok) {
                for (let k = i; k <= j; k++) out[k] = false;
                i = j + 1;
                prevMeaningful = '/';
                continue;
            }
        }
        if (!/\s/.test(c)) prevMeaningful = c;
        i++;
    }
    return out;
}

export function parseMembers(src) {
    const mask = maskCode(src);
    const classIdx = src.indexOf('export class SolarSystemModule');
    if (classIdx < 0) throw new Error('class not found');

    // Opening brace of the class body.
    let i = src.indexOf('{', classIdx);
    let depth = 1;
    i++;

    const members = [];
    let memberStart = -1;
    // Braces inside parentheses belong to destructured parameter defaults or
    // call arguments, never to a class-body block, and counting them desyncs
    // the depth (e.g. `foo(a, { b = null } = {})`).
    let parenDepth = 0;

    while (i < src.length && depth > 0) {
        if (!mask[i]) { i++; continue; }
        const c = src[i];

        if (depth === 1 && parenDepth === 0 && memberStart < 0 && /\S/.test(c) && c !== '}') {
            memberStart = i;
        }

        if (c === '(') parenDepth++;
        else if (c === ')') parenDepth = Math.max(0, parenDepth - 1);
        else if (parenDepth === 0) {
            if (c === '{') depth++;
            else if (c === '}') {
                depth--;
                if (depth === 1 && memberStart >= 0) {
                    const text = src.slice(memberStart, i + 1);
                    const nameMatch = text.match(/^(?:async\s+|static\s+|get\s+|set\s+|\*\s*)*([A-Za-z_$#][\w$]*)\s*\(/);
                    members.push({
                        name: nameMatch ? nameMatch[1] : null,
                        start: memberStart,
                        end: i + 1,
                        text
                    });
                    memberStart = -1;
                }
            }
        }
        i++;
    }
    return { members, classEnd: i };
}

/** Import lines available in SolarSystemModule.js, keyed by the binding they provide. */
const AVAILABLE_IMPORTS = {
    THREE: "import * as THREE from 'three';",
    TEXTURE_CACHE: "import { TEXTURE_CACHE } from '../TextureCache.js';",
    __utils: {
        module: '../utils.js',
        names: ['CONFIG', 'DEBUG', 'IS_MOBILE', 'prefersReducedMotion', 'TextureGeneratorUtils',
            'MaterialFactory', 'CoordinateUtils', 'ConstellationFactory', 'GeometryFactory']
    },
    __astro: {
        module: '../astro/Ephemeris.js',
        names: ['sunMoonVectors', 'astroGmst', 'astroSubPoint']
    }
};

const ASTRO_ALIASES = { astroGmst: 'gmst as astroGmst', astroSubPoint: 'subPoint as astroSubPoint' };

function buildHeader(body, exportName) {
    const uses = (name) => new RegExp(`\\b${name}\\b`).test(body);
    const lines = [];

    if (uses('THREE')) lines.push(AVAILABLE_IMPORTS.THREE);
    if (uses('TEXTURE_CACHE')) lines.push(AVAILABLE_IMPORTS.TEXTURE_CACHE);

    const utils = AVAILABLE_IMPORTS.__utils.names.filter(uses);
    if (utils.length) lines.push(`import { ${utils.join(', ')} } from '${AVAILABLE_IMPORTS.__utils.module}';`);

    const astro = AVAILABLE_IMPORTS.__astro.names.filter(uses);
    if (astro.length) {
        const spec = astro.map((n) => ASTRO_ALIASES[n] || n).join(', ');
        lines.push(`import { ${spec} } from '${AVAILABLE_IMPORTS.__astro.module}';`);
    }

    // The module reads translations through the global set up by src/i18n.js.
    if (/[^\w.]t\(/.test(body)) lines.push("\nconst t = (key) => (window.t || ((k) => k))(key);");

    return `// Extracted from SolarSystemModule.js — methods are mixed into its prototype.\n`
        + `${lines.join('\n')}\n\nexport const ${exportName} = {\n`;
}

function main() {
    const [outFile, exportName, nameList] = process.argv.slice(2);
    if (!outFile || !exportName || !nameList) {
        console.error('usage: node scripts/extract-members.mjs <outFile> <exportName> <names>');
        process.exit(1);
    }
    const wanted = nameList.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);

    const src = readFileSync(SOURCE, 'utf8');
    const { members } = parseMembers(src);

    const found = members.filter((m) => wanted.includes(m.name));
    const missing = wanted.filter((w) => !found.some((f) => f.name === w));
    if (missing.length) {
        console.error(`not found in ${SOURCE}: ${missing.join(', ')}`);
        process.exit(1);
    }

    // Remove from the end backwards so earlier offsets stay valid.
    let out = src;
    const sorted = [...found].sort((a, b) => b.start - a.start);
    for (const m of sorted) {
        out = out.slice(0, m.start) + out.slice(m.end);
    }

    const body = found
        .sort((a, b) => a.start - b.start)
        .map((m) => m.text)
        .join(',\n\n');

    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, `${buildHeader(body, exportName)}${body}\n};\n`, 'utf8');
    writeFileSync(SOURCE, out, 'utf8');

    const movedLines = found.reduce((s, m) => s + m.text.split('\n').length, 0);
    console.log(`extracted ${found.length} members (~${movedLines} lines) -> ${outFile}`);
}

// pathToFileURL handles Windows drive letters and percent-encoded spaces, which
// a hand-built `file://${argv[1]}` string does not.
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
