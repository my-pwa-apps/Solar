# =====================================================
# PWA Icon Generator Script
# Generates all required PNG icons from icon-base.svg
# =====================================================

param(
    [string]$SourceSvg = "icons\icon-base.svg",
    [string]$OutputDir = "icons"
)

Write-Host "🚀 PWA Icon Generator" -ForegroundColor Cyan
Write-Host "=====================`n" -ForegroundColor Cyan

# Check if source SVG exists
if (-not (Test-Path $SourceSvg)) {
    Write-Host "❌ Error: Source SVG not found at: $SourceSvg" -ForegroundColor Red
    exit 1
}

# Create output directory if it doesn't exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Define icon sizes needed
$iconSizes = @(72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "� Checking for available image conversion tools...`n" -ForegroundColor Yellow

# Try to use ImageMagick (best quality)
$magickPath = Get-Command "magick" -ErrorAction SilentlyContinue
if ($null -eq $magickPath) {
    $magickPath = Get-Command "convert" -ErrorAction SilentlyContinue
}

if ($null -ne $magickPath) {
    Write-Host "✅ ImageMagick found! Using high-quality conversion." -ForegroundColor Green
    Write-Host "   Path: $($magickPath.Source)`n" -ForegroundColor Gray
    
    foreach ($size in $iconSizes) {
        $outputFile = Join-Path $OutputDir "icon-${size}x${size}.png"
        Write-Host "   Generating ${size}x${size}..." -NoNewline
        
        try {
            if ($magickPath.Name -eq "magick") {
                & magick convert -background none -density 300 -resize "${size}x${size}" $SourceSvg $outputFile 2>$null
            } else {
                & convert -background none -density 300 -resize "${size}x${size}" $SourceSvg $outputFile 2>$null
            }
            
            if (Test-Path $outputFile) {
                Write-Host " ✓" -ForegroundColor Green
            } else {
                Write-Host " ✗ Failed" -ForegroundColor Red
            }
        } catch {
            Write-Host " ✗ Error: $_" -ForegroundColor Red
        }
    }
    
    # Generate maskable icons (with safe zone padding)
    Write-Host "`n📱 Generating maskable icons (with safe zone)..." -ForegroundColor Yellow
    
    $maskableSizes = @(192, 512)
    foreach ($size in $maskableSizes) {
        $outputFile = Join-Path $OutputDir "icon-${size}x${size}-maskable.png"
        Write-Host "   Generating ${size}x${size}-maskable..." -NoNewline
        
        try {
            # Create with padding for safe zone (20% padding = 80% of size)
            $innerSize = [math]::Round($size * 0.8)
            $padding = [math]::Round(($size - $innerSize) / 2)
            
            if ($magickPath.Name -eq "magick") {
                & magick convert -background "#0078D4" -density 300 $SourceSvg -resize "${innerSize}x${innerSize}" -gravity center -extent "${size}x${size}" $outputFile 2>$null
            } else {
                & convert -background "#0078D4" -density 300 $SourceSvg -resize "${innerSize}x${innerSize}" -gravity center -extent "${size}x${size}" $outputFile 2>$null
            }
            
            if (Test-Path $outputFile) {
                Write-Host " ✓" -ForegroundColor Green
            } else {
                Write-Host " ✗ Failed" -ForegroundColor Red
            }
        } catch {
            Write-Host " ✗ Error: $_" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "⚠️  ImageMagick not found." -ForegroundColor Yellow
    Write-Host "`n📥 Please install ImageMagick for automated icon generation:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://imagemagick.org/script/download.php" -ForegroundColor Cyan
    Write-Host "   2. Or use Chocolatey: choco install imagemagick" -ForegroundColor Cyan
    Write-Host "   3. Or use Scoop: scoop install imagemagick" -ForegroundColor Cyan
    Write-Host "`n🌐 Alternative: Use online generator:" -ForegroundColor Yellow
    Write-Host "   https://www.pwabuilder.com/imageGenerator" -ForegroundColor Cyan
}

Write-Host "`n" -NoNewline

# Verify generated files
$generatedCount = 0
$expectedFiles = @()
foreach ($size in $iconSizes) {
    $expectedFiles += "icon-${size}x${size}.png"
}
$expectedFiles += "icon-192x192-maskable.png"
$expectedFiles += "icon-512x512-maskable.png"

Write-Host "📋 Verification:" -ForegroundColor Cyan
Write-Host "   Expected: $($expectedFiles.Count) files" -ForegroundColor Gray

foreach ($file in $expectedFiles) {
    $fullPath = Join-Path $OutputDir $file
    if (Test-Path $fullPath) {
        $generatedCount++
        $fileInfo = Get-Item $fullPath
        $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        Write-Host "   ✓ $file ($sizeKB KB)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file (missing)" -ForegroundColor Red
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   Generated: $generatedCount / $($expectedFiles.Count) icons" -ForegroundColor $(if ($generatedCount -eq $expectedFiles.Count) { "Green" } else { "Yellow" })

if ($generatedCount -eq $expectedFiles.Count) {
    Write-Host "`n✅ SUCCESS! All PWA icons generated!" -ForegroundColor Green
    Write-Host "   Your app should now be installable." -ForegroundColor Green
    Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Test locally: Serve over HTTPS (or use localhost)" -ForegroundColor Cyan
    Write-Host "   2. Open DevTools > Application > Manifest (verify icons load)" -ForegroundColor Cyan
    Write-Host "   3. Look for install prompt in browser address bar" -ForegroundColor Cyan
    Write-Host "   4. Deploy to GitHub Pages, Netlify, or Vercel for public access" -ForegroundColor Cyan
} elseif ($generatedCount -gt 0) {
    Write-Host "`n⚠️  PARTIAL SUCCESS: Some icons generated, but some are missing." -ForegroundColor Yellow
    Write-Host "   The app may not be fully installable." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ FAILED: No icons were generated." -ForegroundColor Red
    Write-Host "   Please install ImageMagick or use the online generator." -ForegroundColor Red
}

Write-Host "`n"
