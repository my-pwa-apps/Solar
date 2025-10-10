# PWA Icon Generator Script
# Generates PNG icons from SVG

param(
    [string]$SourceSvg = "icons\icon-base.svg",
    [string]$OutputDir = "icons"
)

Write-Host "PWA Icon Generator" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Check if source SVG exists
if (-not (Test-Path $SourceSvg)) {
    Write-Host "Error: Source SVG not found at: $SourceSvg" -ForegroundColor Red
    exit 1
}

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Icon sizes
$iconSizes = @(72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "Checking for ImageMagick..." -ForegroundColor Yellow
Write-Host ""

# Check for ImageMagick
$magickPath = Get-Command "magick" -ErrorAction SilentlyContinue
if ($null -eq $magickPath) {
    $magickPath = Get-Command "convert" -ErrorAction SilentlyContinue
}

if ($null -ne $magickPath) {
    Write-Host "ImageMagick found!" -ForegroundColor Green
    Write-Host "Path: $($magickPath.Source)" -ForegroundColor Gray
    Write-Host ""
    
    # Generate regular icons
    foreach ($size in $iconSizes) {
        $outputFile = Join-Path $OutputDir "icon-${size}x${size}.png"
        Write-Host "Generating ${size}x${size}..." -NoNewline
        
        if ($magickPath.Name -eq "magick") {
            & magick convert -background none -density 300 -resize "${size}x${size}" $SourceSvg $outputFile 2>$null
        } else {
            & convert -background none -density 300 -resize "${size}x${size}" $SourceSvg $outputFile 2>$null
        }
        
        if (Test-Path $outputFile) {
            Write-Host " Done" -ForegroundColor Green
        } else {
            Write-Host " Failed" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Generating maskable icons..." -ForegroundColor Yellow
    
    # Generate maskable icons
    $maskableSizes = @(192, 512)
    foreach ($size in $maskableSizes) {
        $outputFile = Join-Path $OutputDir "icon-${size}x${size}-maskable.png"
        Write-Host "Generating ${size}x${size}-maskable..." -NoNewline
        
        $innerSize = [math]::Round($size * 0.8)
        
        if ($magickPath.Name -eq "magick") {
            & magick convert -background "#0078D4" -density 300 $SourceSvg -resize "${innerSize}x${innerSize}" -gravity center -extent "${size}x${size}" $outputFile 2>$null
        } else {
            & convert -background "#0078D4" -density 300 $SourceSvg -resize "${innerSize}x${innerSize}" -gravity center -extent "${size}x${size}" $outputFile 2>$null
        }
        
        if (Test-Path $outputFile) {
            Write-Host " Done" -ForegroundColor Green
        } else {
            Write-Host " Failed" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "ImageMagick not found." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install ImageMagick:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://imagemagick.org/script/download.php" -ForegroundColor Cyan
    Write-Host "  2. Or use Chocolatey: choco install imagemagick" -ForegroundColor Cyan
    Write-Host "  3. Or use Scoop: scoop install imagemagick" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternative: Use online generator:" -ForegroundColor Yellow
    Write-Host "  https://www.pwabuilder.com/imageGenerator" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan

# Verify files
$generatedCount = 0
$expectedFiles = @()
foreach ($size in $iconSizes) {
    $expectedFiles += "icon-${size}x${size}.png"
}
$expectedFiles += "icon-192x192-maskable.png"
$expectedFiles += "icon-512x512-maskable.png"

foreach ($file in $expectedFiles) {
    $fullPath = Join-Path $OutputDir $file
    if (Test-Path $fullPath) {
        $generatedCount++
        $fileInfo = Get-Item $fullPath
        $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        Write-Host "  OK: $file ($sizeKB KB)" -ForegroundColor Green
    } else {
        Write-Host "  Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Generated: $generatedCount / $($expectedFiles.Count) icons"

if ($generatedCount -eq $expectedFiles.Count) {
    Write-Host ""
    Write-Host "SUCCESS! All PWA icons generated!" -ForegroundColor Green
    Write-Host "Your app should now be installable." -ForegroundColor Green
} elseif ($generatedCount -gt 0) {
    Write-Host ""
    Write-Host "PARTIAL SUCCESS: Some icons generated." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "FAILED: No icons were generated." -ForegroundColor Red
}

Write-Host ""
