# NASA Texture Download Script - Complete Solar System
# Downloads all available NASA public domain textures

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NASA Solar System Texture Download" -ForegroundColor Cyan
Write-Host "  All planets, moons, and dwarf planets (2K resolution)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Create directory structure
$nasaDir = "textures/nasa"
$nasaPlanetsDir = "$nasaDir/planets"
$nasaMoonsDir = "$nasaDir/moons"
$nasaDwarfDir = "$nasaDir/dwarf-planets"

foreach ($dir in @($nasaDir, $nasaPlanetsDir, $nasaMoonsDir, $nasaDwarfDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created $dir directory" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Downloading NASA public domain textures..." -ForegroundColor Yellow
Write-Host "Source: solarsystem.nasa.gov and eoimages.gsfc.nasa.gov" -ForegroundColor Gray
Write-Host "License: Public Domain" -ForegroundColor Gray
Write-Host ""

# NASA texture catalog
$nasaTextures = @(
    # Planets
    @{
        Name = "Sun"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/922_sdo_1.jpg"
        Destination = "$nasaPlanetsDir/sun_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Mercury"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/682_mercury_2k.jpg"
        Destination = "$nasaPlanetsDir/mercury_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Venus"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/775_venus_2k.jpg"
        Destination = "$nasaPlanetsDir/venus_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Earth"
        URL = "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg"
        Destination = "$nasaPlanetsDir/earth_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Mars"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/683_mars_2k.jpg"
        Destination = "$nasaPlanetsDir/mars_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Jupiter"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/2375_jupiter_2k.jpg"
        Destination = "$nasaPlanetsDir/jupiter_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Saturn"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/2490_stsci-h-p1943a_1800.jpg"
        Destination = "$nasaPlanetsDir/saturn_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Uranus"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/599_PIA18182.jpg"
        Destination = "$nasaPlanetsDir/uranus_2k.jpg"
        Category = "Planet"
    },
    @{
        Name = "Neptune"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/611_PIA01492.jpg"
        Destination = "$nasaPlanetsDir/neptune_2k.jpg"
        Category = "Planet"
    },
    
    # Earth's Moon
    @{
        Name = "Moon"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/791_moon_2k.jpg"
        Destination = "$nasaMoonsDir/moon_2k.jpg"
        Category = "Moon"
    },
    
    # Mars Moons
    @{
        Name = "Phobos"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/793_phobos_2k.jpg"
        Destination = "$nasaMoonsDir/phobos_2k.jpg"
        Category = "Moon"
    },
    @{
        Name = "Deimos"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/794_deimos_2k.jpg"
        Destination = "$nasaMoonsDir/deimos_2k.jpg"
        Category = "Moon"
    },
    
    # Jupiter's Galilean Moons
    @{
        Name = "Io"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/790_io_2k.jpg"
        Destination = "$nasaMoonsDir/io_2k.jpg"
        Category = "Moon"
    },
    @{
        Name = "Europa"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/788_europa_2k.jpg"
        Destination = "$nasaMoonsDir/europa_2k.jpg"
        Category = "Moon"
    },
    @{
        Name = "Ganymede"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/789_ganymede_2k.jpg"
        Destination = "$nasaMoonsDir/ganymede_2k.jpg"
        Category = "Moon"
    },
    @{
        Name = "Callisto"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/787_callisto_2k.jpg"
        Destination = "$nasaMoonsDir/callisto_2k.jpg"
        Category = "Moon"
    },
    
    # Saturn Moons
    @{
        Name = "Titan"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/792_titan_2k.jpg"
        Destination = "$nasaMoonsDir/titan_2k.jpg"
        Category = "Moon"
    },
    @{
        Name = "Enceladus"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/683_enceladus_2k.jpg"
        Destination = "$nasaMoonsDir/enceladus_2k.jpg"
        Category = "Moon"
    },
    
    # Neptune Moon
    @{
        Name = "Triton"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/795_triton_2k.jpg"
        Destination = "$nasaMoonsDir/triton_2k.jpg"
        Category = "Moon"
    },
    
    # Pluto System (Dwarf Planets)
    @{
        Name = "Pluto"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/933_pluto_color_NewHorizons.jpg"
        Destination = "$nasaDwarfDir/pluto_2k.jpg"
        Category = "Dwarf Planet"
    },
    @{
        Name = "Charon"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/934_charon_NewHorizons.jpg"
        Destination = "$nasaMoonsDir/charon_2k.jpg"
        Category = "Moon"
    },
    
    # Other Dwarf Planets
    @{
        Name = "Ceres"
        URL = "https://solarsystem.nasa.gov/system/resources/detail_files/679_ceres_2k.jpg"
        Destination = "$nasaDwarfDir/ceres_2k.jpg"
        Category = "Dwarf Planet"
    }
)

# Download textures
$successful = 0
$failed = 0
$skipped = 0
$totalSize = 0
$failedList = @()

foreach ($texture in $nasaTextures) {
    # Check if file already exists
    if (Test-Path $texture.Destination) {
        Write-Host "[$($texture.Category)] $($texture.Name) - Already exists" -ForegroundColor DarkGray
        $skipped++
        
        # Add to total size if exists
        $fileInfo = Get-Item $texture.Destination
        $totalSize += $fileInfo.Length
        continue
    }
    
    Write-Host "[$($texture.Category)] $($texture.Name)..." -NoNewline
    
    try {
        # Download with timeout
        Invoke-WebRequest -Uri $texture.URL -OutFile $texture.Destination -TimeoutSec 30 -ErrorAction Stop | Out-Null
        
        # Get file size
        $fileInfo = Get-Item $texture.Destination
        $sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
        $totalSize += $fileInfo.Length
        
        Write-Host " Downloaded" -ForegroundColor Green -NoNewline
        Write-Host " ($sizeMB MB)" -ForegroundColor Gray
        
        $successful++
        Start-Sleep -Milliseconds 500  # Be respectful to NASA servers
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $failed++
        $failedList += $texture.Name
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Download Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Downloaded: " -NoNewline -ForegroundColor Green
Write-Host $successful
Write-Host "Failed: " -NoNewline -ForegroundColor Red
Write-Host $failed
Write-Host "Already exists: " -NoNewline -ForegroundColor Yellow
Write-Host $skipped
Write-Host "Total Size: " -NoNewline -ForegroundColor Cyan
Write-Host "$([math]::Round($totalSize / 1MB, 2)) MB"
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Failed downloads:" -ForegroundColor Red
    $failedList | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkRed }
    Write-Host ""
}

if ($successful -gt 0 -or $skipped -gt 0) {
    Write-Host "NASA Textures Available:" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Planets (9):" -ForegroundColor Yellow
    Write-Host "  Sun, Mercury, Venus, Earth, Mars," -ForegroundColor Gray
    Write-Host "  Jupiter, Saturn, Uranus, Neptune" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Moons (12):" -ForegroundColor Yellow
    Write-Host "  Moon (Earth)" -ForegroundColor Gray
    Write-Host "  Phobos, Deimos (Mars)" -ForegroundColor Gray
    Write-Host "  Io, Europa, Ganymede, Callisto (Jupiter)" -ForegroundColor Gray
    Write-Host "  Titan, Enceladus (Saturn)" -ForegroundColor Gray
    Write-Host "  Triton (Neptune)" -ForegroundColor Gray
    Write-Host "  Charon (Pluto)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Dwarf Planets (2):" -ForegroundColor Yellow
    Write-Host "  Pluto, Ceres" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Total: 23 celestial objects with NASA textures" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Attribution: NASA/JPL-Caltech (Public Domain)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Compare NASA vs current textures (quality check)" -ForegroundColor Gray
Write-Host "  2. Update SolarSystemModule.js to use NASA textures" -ForegroundColor Gray
Write-Host "  3. Update ATTRIBUTION.md with NASA credits" -ForegroundColor Gray
Write-Host "  4. Test all celestial bodies render correctly" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
