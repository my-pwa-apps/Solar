const fs = require('fs');

// Read the file
const content = fs.readFileSync('src/main.js', 'utf-8');

// Find and replace the explorer content return statement
const pattern = /(title: '🧊 Kuiper Belt & Dwarf Planets',\s+items: \[[^\]]+\]\s+})\s+\];\s+}\s+}/;

const replacement = `$1,
            {
                title: '☄️ Comets',
                items: this.comets.map(comet => ({
                    name: \`☄️ \${comet.userData.name}\`,
                    onClick: () => focusCallback(comet)
                }))
            },
            {
                title: '⭐ Distant Stars',
                items: this.distantStars.map(star => ({
                    name: \`⭐ \${star.userData.name}\`,
                    onClick: () => focusCallback(star)
                }))
            },
            {
                title: '🌌 Nebulae',
                items: this.nebulae.map(nebula => ({
                    name: \`🌌 \${nebula.userData.name}\`,
                    onClick: () => focusCallback(nebula)
                }))
            },
            {
                title: '🌀 Galaxies',
                items: this.galaxies.map(galaxy => ({
                    name: \`🌀 \${galaxy.userData.name}\`,
                    onClick: () => focusCallback(galaxy)
                }))
            }
        ];
    }
}`;

// Perform replacement
const newContent = content.replace(pattern, replacement);

// Write back
fs.writeFileSync('src/main.js', newContent, 'utf-8');

console.log('✅ Explorer content updated successfully!');
