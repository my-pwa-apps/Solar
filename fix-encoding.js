const fs = require('fs');

// Read file
let content = fs.readFileSync('src/i18n.js', 'utf8');
const originalLength = content.length;

// Fix patterns - comprehensive list
const replacements = [
  // Spanish specific fixes - ORDER MATTERS (longer patterns first)
  ['á×o', '¡Ío'],       // "¡Ío" in Spanish descriptions (exclamation + moon name)
  ['×"rbitas', 'Órbitas'],  // Órbitas toggle button
  ['io: "×o"', 'io: "Ío"'],  // Io moon name in Spanish
  
  // Superscripts - the remaining patterns in GPS descriptions
  // The pattern is: 10 + superscript(-14) for atomic clock precision
  // â» = start of some encoding, ×¹ = corrupted superscript, â´ = corrupted 4
  // Looking at actual bytes might be needed
];

let totalFixed = 0;
replacements.forEach(([from, to]) => {
  const count = content.split(from).length - 1;
  if (count > 0) {
    console.log(`Fixing: "${from}" -> "${to}" (${count} times)`);
    content = content.split(from).join(to);
    totalFixed += count;
  }
});

// Write file
fs.writeFileSync('src/i18n.js', content, 'utf8');
console.log(`\nTotal fixes: ${totalFixed}`);
console.log(`File size: ${originalLength} -> ${content.length}`);
