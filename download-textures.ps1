# Texture Download Script - Phase 1: Backup Current Sources
# Downloads all existing textures from external repositories

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Solar System Texture Download - Phase 1" -ForegroundColor Cyan
Write-Host "  Backing up existing external texture sources" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Create directories if they don't exist
$planetsDir = "textures/planets"
$moonsDir = "textures/moons"

if (-not (Test-Path $planetsDir)) {
    New-Item -ItemType Directory -Path $planetsDir -Force | Out-Null
    Write-Host "✓ Created $planetsDir directory" -ForegroundColor Green
}

if (-not (Test-Path $moonsDir)) {
    New-Item -ItemType Directory -Path $moonsDir -Force | Out-Null
    Write-Host "✓ Created $moonsDir directory" -ForegroundColor Green
}

Write-Host ""

# Define texture sources
$textures = @(
    @{
        Name = "Sun"
        File = "sunmap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/sunmap.jpg"
        Destination = "$planetsDir/sun.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Mercury"
        File = "mercurymap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg"
        Destination = "$planetsDir/mercury.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Venus"
        File = "venusmap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg"
        Destination = "$planetsDir/venus.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Earth (1K)"
        File = "earthmap1k.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthmap1k.jpg"
        Destination = "$planetsDir/earth_1k.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Earth Atmosphere (2K)"
        File = "earth_atmos_2048.jpg"
        URL = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg"
        Destination = "$planetsDir/earth_atmos_2k.jpg"
        Source = "three.js (Mr.doob)"
    },
    @{
        Name = "Mars (1K)"
        File = "marsmap1k.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg"
        Destination = "$planetsDir/mars_1k.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Jupiter"
        File = "jupitermap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg"
        Destination = "$planetsDir/jupiter.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Saturn"
        File = "saturnmap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg"
        Destination = "$planetsDir/saturn.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Uranus"
        File = "uranusmap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg"
        Destination = "$planetsDir/uranus.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Neptune"
        File = "neptunemap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg"
        Destination = "$planetsDir/neptune.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Moon (1K)"
        File = "moonmap1k.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg"
        Destination = "$moonsDir/moon_1k.jpg"
        Source = "threex.planets (Jerome Etienne)"
    },
    @{
        Name = "Moon (three.js)"
        File = "moon_1024.jpg"
        URL = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg"
        Destination = "$moonsDir/moon_threejs_1k.jpg"
        Source = "three.js (Mr.doob)"
    }
)

# Download textures
$successful = 0
$failed = 0
$totalSize = 0

foreach ($texture in $textures) {
    Write-Host "Downloading $($texture.Name)..." -NoNewline
    
    try {
        # Download with progress
        $response = Invoke-WebRequest -Uri $texture.URL -OutFile $texture.Destination -PassThru -ErrorAction Stop
        
        # Get file size
        $fileInfo = Get-Item $texture.Destination
        $sizeKB = [math]::Round($fileInfo.Length / 1KB, 2)
        $totalSize += $fileInfo.Length
        
        Write-Host " Done" -ForegroundColor Green -NoNewline
        Write-Host " ($sizeKB KB)" -ForegroundColor Gray -NoNewline
        Write-Host " [$($texture.Source)]" -ForegroundColor DarkGray
        
        $successful++
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $failed++
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Download Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Successful: " -NoNewline -ForegroundColor Green
Write-Host $successful
Write-Host "Failed: " -NoNewline -ForegroundColor Red
Write-Host $failed
Write-Host "Total Size: " -NoNewline -ForegroundColor Cyan
Write-Host "$([math]::Round($totalSize / 1MB, 2)) MB"
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All textures downloaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review textures in $planetsDir and $moonsDir" -ForegroundColor Gray
    Write-Host "  2. Research NASA alternatives (see TEXTURE_MIGRATION_PLAN.md)" -ForegroundColor Gray
    Write-Host "  3. Update SolarSystemModule.js texture paths" -ForegroundColor Gray
    Write-Host "  4. Test local texture loading" -ForegroundColor Gray
} else {
    Write-Host "Some textures failed to download." -ForegroundColor Yellow
    Write-Host "   Check external repos availability and retry." -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
