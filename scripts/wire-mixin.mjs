// Appends the Object.assign mixin wiring after the class closes.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/modules/SolarSystemModule.js';
const name = process.argv[2];
if (!name) { console.error('usage: node scripts/wire-mixin.mjs <exportName>'); process.exit(1); }

let src = readFileSync(FILE, 'utf8');
const marker = '// ---- prototype mixins ----';

if (src.includes(`${name});`)) {
    console.log(`${name} already wired`);
    process.exit(0);
}

if (!src.includes(marker)) {
    src = src.replace(/\s*$/, `\n\n${marker}\n// Method groups live in ./solar-system/* to keep this coordinator readable.\n`);
}
src = src.replace(/\s*$/, `\nObject.assign(SolarSystemModule.prototype, ${name});\n`);
writeFileSync(FILE, src, 'utf8');
console.log(`wired ${name}`);
