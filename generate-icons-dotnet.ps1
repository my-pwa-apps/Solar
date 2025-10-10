# PWA Icon Generator - Pure PowerShell (No Dependencies)
# Generates placeholder PNG icons from scratch using .NET

param(
    [string]$OutputDir = "icons"
)

Write-Host "PWA Icon Generator (Pure PowerShell)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Load required assemblies
Add-Type -AssemblyName System.Drawing

# Icon sizes
$iconSizes = @(72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "Generating PNG icons using .NET Graphics..." -ForegroundColor Yellow
Write-Host ""

function Create-Icon {
    param(
        [int]$Size,
        [string]$OutputPath,
        [bool]$IsMaskable = $false
    )
    
    try {
        # Create bitmap
        $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        
        # Background gradient (space theme)
        $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
        
        if ($IsMaskable) {
            # Solid background for maskable icons
            $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 120, 212))
            $graphics.FillRectangle($bgBrush, $rect)
            $bgBrush.Dispose()
        } else {
            # Gradient background for regular icons
            $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
                $rect,
                [System.Drawing.Color]::FromArgb(0, 0, 51),
                [System.Drawing.Color]::FromArgb(0, 120, 212),
                45
            )
            $graphics.FillRectangle($gradBrush, $rect)
            $gradBrush.Dispose()
        }
        
        # Calculate scaling factor
        $scale = $Size / 512.0
        $padding = if ($IsMaskable) { $Size * 0.1 } else { 0 }
        
        # Draw Sun
        $sunSize = [Math]::Max(1, [int]($65 * $scale))
        $sunX = [int](($Size / 2) - ($sunSize / 2))
        $sunY = [int]((180 * $scale) - ($sunSize / 2) + $padding)
        $sunRect = New-Object System.Drawing.Rectangle($sunX, $sunY, [Math]::Max(1, $sunSize), [Math]::Max(1, $sunSize))
        $sunBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $sunRect,
            [System.Drawing.Color]::FromArgb(255, 248, 220),
            [System.Drawing.Color]::FromArgb(255, 165, 0),
            [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
        )
        $graphics.FillEllipse($sunBrush, $sunX, $sunY, $sunSize, $sunSize)
        $sunBrush.Dispose()
        
        # Draw Saturn-like planet
        $planetSize = [int]($32 * $scale)
        $planetX = [int]((200 * $scale) - ($planetSize / 2))
        $planetY = [int]((300 * $scale) - ($planetSize / 2) + $padding)
        $planetBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(74, 158, 255))
        $graphics.FillEllipse($planetBrush, $planetX, $planetY, $planetSize, $planetSize)
        $planetBrush.Dispose()
        
        # Draw planet rings
        $ringWidth = [int]($140 * $scale)
        $ringHeight = [int]($18 * $scale)
        $ringX = [int](($Size / 2) - ($ringWidth / 2))
        $ringY = [int]((320 * $scale) - ($ringHeight / 2) + $padding)
        $ringBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 0, 120, 212))
        $graphics.FillEllipse($ringBrush, $ringX, $ringY, $ringWidth, $ringHeight)
        $ringBrush.Dispose()
        
        # Draw Earth-like planet
        $earthSize = [int]($38 * $scale)
        $earthX = [int]((340 * $scale) - ($earthSize / 2))
        $earthY = [int]((340 * $scale) - ($earthSize / 2) + $padding)
        $earthBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(46, 204, 113))
        $graphics.FillEllipse($earthBrush, $earthX, $earthY, $earthSize, $earthSize)
        $earthBrush.Dispose()
        
        # Draw blue ocean spot
        $oceanSize = [int]($12 * $scale)
        $oceanX = $earthX + [int]($7 * $scale)
        $oceanY = $earthY + [int]($5 * $scale)
        $oceanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(52, 152, 219))
        $graphics.FillEllipse($oceanBrush, $oceanX, $oceanY, $oceanSize, $oceanSize)
        $oceanBrush.Dispose()
        
        # Draw stars
        $starBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 255, 255, 255))
        $starPositions = @(
            @(80, 80, 2),
            @(450, 100, 2),
            @(120, 450, 2),
            @(400, 400, 2),
            @(200, 90, 1.5),
            @(350, 480, 1.5)
        )
        foreach ($star in $starPositions) {
            $starX = [int](($star[0] * $scale) - ($star[2] * $scale / 2))
            $starY = [int](($star[1] * $scale) - ($star[2] * $scale / 2) + $padding)
            $starSize = [int]($star[2] * $scale)
            $graphics.FillEllipse($starBrush, $starX, $starY, $starSize, $starSize)
        }
        $starBrush.Dispose()
        
        # Rocket drawing skipped - simplified version for compatibility
        
        # Save PNG
        $graphics.Dispose()
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bitmap.Dispose()
        
        return $true
    }
    catch {
        Write-Host "Error creating icon: $_" -ForegroundColor Red
        return $false
    }
}

# Generate regular icons
foreach ($size in $iconSizes) {
    $outputFile = Join-Path $OutputDir "icon-${size}x${size}.png"
    Write-Host "Generating ${size}x${size}..." -NoNewline
    
    $success = Create-Icon -Size $size -OutputPath $outputFile -IsMaskable $false
    
    if ($success) {
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
    
    $success = Create-Icon -Size $size -OutputPath $outputFile -IsMaskable $true
    
    if ($success) {
        Write-Host " Done" -ForegroundColor Green
    } else {
        Write-Host " Failed" -ForegroundColor Red
    }
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
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Refresh your browser (Ctrl + Shift + R)" -ForegroundColor Cyan
    Write-Host "  2. Open DevTools > Application > Manifest" -ForegroundColor Cyan
    Write-Host "  3. Look for install prompt in browser address bar" -ForegroundColor Cyan
    Write-Host "  4. Deploy to GitHub Pages, Netlify, or Vercel" -ForegroundColor Cyan
} elseif ($generatedCount -gt 0) {
    Write-Host ""
    Write-Host "PARTIAL SUCCESS: Some icons generated." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "FAILED: No icons were generated." -ForegroundColor Red
}

Write-Host ""
