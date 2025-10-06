# Cleanup and Optimization Script for main.js
# This script removes excessive debug logging while preserving errors and warnings

$file = ".\src\main.js"
$content = Get-Content $file -Raw

Write-Host "🧹 Starting cleanup..." -ForegroundColor Cyan

# Count original console.log statements
$originalCount = ([regex]::Matches($content, "console\.log")).Count
Write-Host "📊 Found $originalCount console.log statements" -ForegroundColor Yellow

# Remove specific debug log patterns (keep errors and important ones)
$patterns = @(
    # VR Debug Logs
    "        console\.log\('🎯 Controller.*?\);\r?\n",
    "        console\.log\(`🎯 Controller.*?\);\r?\n",
    "            console\.log\('🎨 VR UI Panel.*?\);\r?\n",
    "                console\.log\(`📍 VR UI clicked.*?\);\r?\n",
    "                        console\.log\(`✅ VR Button clicked.*?\);\r?\n",
    "                    console\.log\('⚠️ Click was on UI panel.*?\);\r?\n",
    "                console\.log\('❌ VR UI Panel visible.*?\);\r?\n",
    "            console\.log\(`ℹ️ VR UI Panel.*?\);\r?\n",
    "            console\.log\('🎯 VR Selected object.*?\);\r?\n",
    "                        console\.log\('🔍 ZOOMING CLOSE to.*?\);\r?\n",
    "                        console\.log\('✅ Focused on.*?\);\r?\n",
    "            console\.log\('❌ No object hit by raycast.*?\);\r?\n",
    "            console\.log\(`🎨 VR Menu toggled.*?\);\r?\n",
    "            console\.log\(`📍 Menu position.*?\);\r?\n",
    "            console\.log\(`📐 Menu parent.*?\);\r?\n",
    "            console\.log\('⚠️ Grip pressed but trigger.*?\);\r?\n",
    "            console\.log\('❌ Grip pressed but vrUIPanel.*?\);\r?\n",
    "        console\.log\(`📍 VR Zoomed to.*?\);\r?\n",
    "        console\.log\(`🎬 handleVRAction called.*?\);\r?\n",
    "        console\.log\('🎮 VR Status.*?\);\r?\n",
    "                    console\.log\(`🎮 \$\{handedness.*?\);\r?\n",
    
    # Earth Texture Debug Logs
    "                    console\.log\(`📊 Elevation:.*?\);\r?\n",
    "        console\.log\(`🌍 Earth texture generated:.*?\);\r?\n",
    "        console\.log\(`🌲 Greenest land pixel found:.*?\);\r?\n",
    "        console\.log\('🌍 Creating THREE\.js texture.*?\);\r?\n",
    "            console\.log\(`📊 Earth elevation stats:.*?\);\r?\n",
    "            console\.log\(`📊 🌍 REALISTIC CONTINENTS:.*?\);\r?\n",
    "            console\.log\(`📊 Land threshold:.*?\);\r?\n",
    "            console\.log\(`📊 Using Gaussian distributions.*?\);\r?\n",
    "            console\.log\(`📊 Elevation range:.*?\);\r?\n",
    "        console\.log\('🎨 Canvas verification:'\);\r?\n",
    "        console\.log\('   - Canvas size.*?\);\r?\n",
    "        console\.log\('   - Canvas context.*?\);\r?\n",
    "        console\.log\('   - Sample pixel colors:'\);\r?\n",
    "            console\.log\(`     \$\{locations\[i\]\}:.*?\);\r?\n",
    "            console\.log\('🖼️ TEXTURE PREVIEW:.*?\);\r?\n",
    "            console\.log\(dataURL\.substring.*?\);\r?\n",
    "            console\.log\('   Copy this and paste.*?\);\r?\n",
    "            console\.log\('   %c\[VIEW EARTH TEXTURE\].*?\);\r?\n",
    "            console\.log\('   Length.*?\);\r?\n",
    "            console\.log\('   Stored in:.*?\);\r?\n",
    
    # Material Creation Logs
    "        console\.log\(`🎨 Creating material for planet:.*?\);\r?\n",
    "                console\.log\('🌍 ✅ EARTH CASE MATCHED.*?\);\r?\n",
    "                console\.log\('🌍 Earth material created with texture.*?\);\r?\n",
    "                console\.log\('🌍 Earth texture size.*?\);\r?\n",
    "                console\.log\('🌍 Using MeshBasicMaterial.*?\);\r?\n",
    
    # Misc Debug Logs
    "        console\.log\('💡 Ambient light increased.*?\);\r?\n",
    "        console\.log\('✅ VR UI Panel created with.*?\);\r?\n"
)

foreach ($pattern in $patterns) {
    $content = $content -replace $pattern, ""
}

# Save cleaned content
$content | Set-Content $file -NoNewline

# Count remaining console.log statements
$newCount = ([regex]::Matches($content, "console\.log")).Count
$removed = $originalCount - $newCount

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "📊 Removed $removed console.log statements" -ForegroundColor Green
Write-Host "📊 Remaining $newCount statements (errors/warnings/important)" -ForegroundColor Yellow

if ($removed -gt 0) {
    Write-Host "💾 Backup saved as: main.js.backup" -ForegroundColor Cyan
}
