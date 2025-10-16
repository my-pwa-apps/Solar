# Extended Texture Download Script - Moons & Dwarf Planets
# Downloads textures for additional celestial objects

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Extended Texture Download - Moons & Dwarf Planets" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Ensure directories exist
$planetsDir = "textures/planets"
$moonsDir = "textures/moons"
$dwarfDir = "textures/dwarf-planets"

if (-not (Test-Path $dwarfDir)) {
    New-Item -ItemType Directory -Path $dwarfDir -Force | Out-Null
    Write-Host "Created $dwarfDir directory" -ForegroundColor Green
}

Write-Host ""

# Additional textures for moons and dwarf planets
$additionalTextures = @(
    # Mars Moons
    @{
        Name = "Phobos"
        File = "phobos.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/phobosmap.jpg"
        Destination = "$moonsDir/phobos.jpg"
        Source = "threex.planets"
    },
    @{
        Name = "Deimos"
        File = "deimosmap.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/deimosmap.jpg"
        Destination = "$moonsDir/deimos.jpg"
        Source = "threex.planets"
    },
    # Jupiter Moons (Galilean)
    @{
        Name = "Io"
        File = "io.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/iomap.jpg"
        Destination = "$moonsDir/io.jpg"
        Source = "threex.planets"
    },
    @{
        Name = "Europa"
        File = "europa.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/europamap.jpg"
        Destination = "$moonsDir/europa.jpg"
        Source = "threex.planets"
    },
    @{
        Name = "Ganymede"
        File = "ganymede.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/ganymedemap.jpg"
        Destination = "$moonsDir/ganymede.jpg"
        Source = "threex.planets"
    },
    @{
        Name = "Callisto"
        File = "callisto.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/callistomap.jpg"
        Destination = "$moonsDir/callisto.jpg"
        Source = "threex.planets"
    },
    # Saturn Moons
    @{
        Name = "Titan"
        File = "titan.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/titanmap.jpg"
        Destination = "$moonsDir/titan.jpg"
        Source = "threex.planets"
    },
    @{
        Name = "Enceladus"
        File = "enceladus.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/enceladusmap.jpg"
        Destination = "$moonsDir/enceladus.jpg"
        Source = "threex.planets"
    },
    # Neptune Moons
    @{
        Name = "Triton"
        File = "triton.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/tritonmap.jpg"
        Destination = "$moonsDir/triton.jpg"
        Source = "threex.planets"
    },
    # Pluto System
    @{
        Name = "Pluto"
        File = "pluto.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/plutomap.jpg"
        Destination = "$planetsDir/pluto.jpg"
        Source = "threex.planets"
    },
    @{
        Name = "Charon"
        File = "charon.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/charonmap.jpg"
        Destination = "$moonsDir/charon.jpg"
        Source = "threex.planets"
    },
    # Dwarf Planets
    @{
        Name = "Ceres"
        File = "ceres.jpg"
        URL = "https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/ceresmap.jpg"
        Destination = "$dwarfDir/ceres.jpg"
        Source = "threex.planets"
    },
    # Alternative: Three.js has some moon textures
    @{
        Name = "Io (alt)"
        File = "io_alt.jpg"
        URL = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/io_1024.jpg"
        Destination = "$moonsDir/io_threejs.jpg"
        Source = "three.js"
    },
    @{
        Name = "Europa (alt)"
        File = "europa_alt.jpg"
        URL = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/europa_1024.jpg"
        Destination = "$moonsDir/europa_threejs.jpg"
        Source = "three.js"
    },
    @{
        Name = "Ganymede (alt)"
        File = "ganymede_alt.jpg"
        URL = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/ganymede_1024.jpg"
        Destination = "$moonsDir/ganymede_threejs.jpg"
        Source = "three.js"
    },
    @{
        Name = "Callisto (alt)"
        File = "callisto_alt.jpg"
        URL = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/callisto_1024.jpg"
        Destination = "$moonsDir/callisto_threejs.jpg"
        Source = "three.js"
    }
)

# Download textures
$successful = 0
$failed = 0
$skipped = 0
$totalSize = 0

foreach ($texture in $additionalTextures) {
    # Check if file already exists
    if (Test-Path $texture.Destination) {
        Write-Host "Skipping $($texture.Name) (already exists)" -ForegroundColor DarkGray
        $skipped++
        continue
    }
    
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
Write-Host "Skipped: " -NoNewline -ForegroundColor Yellow
Write-Host $skipped
Write-Host "Total Size: " -NoNewline -ForegroundColor Cyan
Write-Host "$([math]::Round($totalSize / 1MB, 2)) MB"
Write-Host ""

if ($failed -eq 0 -and $successful -gt 0) {
    Write-Host "All available textures downloaded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Moon textures downloaded:" -ForegroundColor Yellow
    Write-Host "  - Phobos, Deimos (Mars)" -ForegroundColor Gray
    Write-Host "  - Io, Europa, Ganymede, Callisto (Jupiter)" -ForegroundColor Gray
    Write-Host "  - Titan, Enceladus (Saturn)" -ForegroundColor Gray
    Write-Host "  - Triton (Neptune)" -ForegroundColor Gray
    Write-Host "  - Charon (Pluto)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Dwarf planet textures downloaded:" -ForegroundColor Yellow
    Write-Host "  - Pluto, Ceres" -ForegroundColor Gray
} elseif ($successful -gt 0) {
    Write-Host "Some textures downloaded, but $failed failed." -ForegroundColor Yellow
    Write-Host "These objects will use procedural textures as fallback." -ForegroundColor Gray
} elseif ($skipped -gt 0) {
    Write-Host "All textures already downloaded (skipped $skipped)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Update SolarSystemModule.js to use local texture paths" -ForegroundColor Gray
Write-Host "  2. Add moon texture loaders (createIoTextureReal, etc.)" -ForegroundColor Gray
Write-Host "  3. Test all moons render with textures" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
