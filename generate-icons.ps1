# Icon Generator for Space Explorer PWA
# This script creates placeholder icons. Replace with actual icons later.

Write-Host "🎨 Generating PWA Icons..." -ForegroundColor Cyan

# Create icons directory
$iconsDir = "icons"
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir | Out-Null
    Write-Host "✅ Created icons directory" -ForegroundColor Green
}

# Icon sizes required for PWA
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "📝 Icon Requirements:" -ForegroundColor Yellow
Write-Host "   The following icon files are needed in the /icons directory:"
Write-Host ""

foreach ($size in $sizes) {
    $filename = "icon-${size}x${size}.png"
    Write-Host "   • $filename (${size}x${size} pixels)" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Recommended Tools:" -ForegroundColor Cyan
Write-Host "   1. PWA Builder Image Generator: https://www.pwabuilder.com/imageGenerator"
Write-Host "   2. RealFaviconGenerator: https://realfavicongenerator.net/"
Write-Host "   3. Favicon.io: https://favicon.io/"
Write-Host ""
Write-Host "💡 Quick Option:" -ForegroundColor Yellow
Write-Host "   Upload a single 512x512 PNG logo to PWA Builder's Image Generator"
Write-Host "   It will automatically create all required sizes for you!"
Write-Host ""
Write-Host "🚀 For now, I'll create SVG placeholder icons..." -ForegroundColor Cyan

# Create a simple SVG placeholder icon
$svgContent = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="spaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000033;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0078D4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#spaceGrad)"/>
  <circle cx="256" cy="180" r="60" fill="#FDB813"/>
  <ellipse cx="256" cy="300" rx="120" ry="15" fill="#0078D4" opacity="0.6"/>
  <circle cx="180" cy="280" r="25" fill="#4A9EFF"/>
  <circle cx="330" cy="320" r="30" fill="#FF6B6B"/>
  <text x="256" y="450" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">🚀</text>
</svg>
"@

$svgPath = Join-Path $iconsDir "icon.svg"
$svgContent | Out-File -FilePath $svgPath -Encoding utf8
Write-Host "✅ Created SVG placeholder: $svgPath" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  IMPORTANT: Replace placeholder SVG with actual PNG icons!" -ForegroundColor Red
Write-Host "   Use one of the recommended tools above to generate proper icons." -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
