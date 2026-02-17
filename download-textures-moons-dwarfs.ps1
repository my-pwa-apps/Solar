# Download Textures - Moons & Dwarf Planets
# Sources:
#   - Solar System Scope (CC BY 4.0): Dwarf planets
#   - NASA/USGS Public Domain: Pluto, Charon (via stevealbers.net processed NASA data)
#   - Solar System Scope / three.js: Moons
#
# Attribution: Solar System Scope textures by INOVE (solarsystemscope.com) under CC BY 4.0

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Texture Download - Moons & Dwarf Planets" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Ensure directories exist
$moonsDir = "textures/moons"
$dwarfDir = "textures/dwarf-planets"

foreach ($dir in @($moonsDir, $dwarfDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created $dir" -ForegroundColor Green
    }
}

Write-Host ""

# Each entry: Name, Destination, list of URLs to try (first success wins)
$textures = @(
    # ===== DWARF PLANETS (Solar System Scope CC BY 4.0) =====
    @{
        Name = "Pluto"
        Destination = "$dwarfDir/pluto_2k.jpg"
        URLs = @(
            "https://www.solarsystemscope.com/textures/download/2k_pluto.jpg",
            "https://stevealbers.net/albers/sos/pluto/pluto_rgb_cyl_8k.png"
        )
        License = "CC BY 4.0 / NASA Public Domain"
    },
    @{
        Name = "Ceres"
        Destination = "$dwarfDir/ceres_2k.jpg"
        URLs = @(
            "https://www.solarsystemscope.com/textures/download/2k_ceres_fictional.jpg"
        )
        License = "CC BY 4.0 (Solar System Scope)"
    },
    @{
        Name = "Haumea"
        Destination = "$dwarfDir/haumea_2k.jpg"
        URLs = @(
            "https://www.solarsystemscope.com/textures/download/2k_haumea_fictional.jpg"
        )
        License = "CC BY 4.0 (Solar System Scope)"
    },
    @{
        Name = "Makemake"
        Destination = "$dwarfDir/makemake_2k.jpg"
        URLs = @(
            "https://www.solarsystemscope.com/textures/download/2k_makemake_fictional.jpg"
        )
        License = "CC BY 4.0 (Solar System Scope)"
    },
    @{
        Name = "Eris"
        Destination = "$dwarfDir/eris_2k.jpg"
        URLs = @(
            "https://www.solarsystemscope.com/textures/download/2k_eris_fictional.jpg"
        )
        License = "CC BY 4.0 (Solar System Scope)"
    },

    # ===== PLUTO SYSTEM =====
    @{
        Name = "Charon"
        Destination = "$moonsDir/charon_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/pluto/charon/charon_rgb_cyl.jpg"
        )
        License = "NASA Public Domain (processed by Steve Albers)"
    },

    # ===== JUPITER MOONS (Galilean) =====
    @{
        Name = "Io"
        Destination = "$moonsDir/io_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/jupiter/io/io_rgb_cyl.jpg"
        )
        License = "NASA/Voyager/Galileo Public Domain (processed by Steve Albers)"
    },
    @{
        Name = "Europa"
        Destination = "$moonsDir/europa_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/jupiter/europa/europa_rgb_cyl_juno.png"
        )
        License = "NASA/Galileo/Juno Public Domain (processed by Steve Albers / Bjorn Jonsson)"
    },
    @{
        Name = "Ganymede"
        Destination = "$moonsDir/ganymede_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/jupiter/ganymede/ganymede_4k.jpg"
        )
        License = "NASA/Voyager/Galileo Public Domain (processed by Steve Albers / Bjorn Jonsson)"
    },
    @{
        Name = "Callisto"
        Destination = "$moonsDir/callisto_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/jupiter/callisto/callisto_rgb_cyl_www.jpg"
        )
        License = "NASA/Voyager/Galileo Public Domain (processed by Bjorn Jonsson)"
    },

    # ===== SATURN MOONS =====
    @{
        Name = "Titan"
        Destination = "$moonsDir/titan_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/saturn/titan/titan_rgb_cyl_www.jpg"
        )
        License = "NASA/Cassini Public Domain (processed by Ian Regan / USGS)"
    },
    @{
        Name = "Enceladus"
        Destination = "$moonsDir/enceladus_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/saturn/enceladus/enceladus_rgb_cyl_www.jpg"
        )
        License = "NASA/Cassini Public Domain (processed by Steve Albers)"
    },
    @{
        Name = "Rhea"
        Destination = "$moonsDir/rhea_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/saturn/rhea/rhea_rgb_cyl_www.jpg"
        )
        License = "NASA/Cassini Public Domain (processed by Steve Albers)"
    },

    # ===== MARS MOONS =====
    @{
        Name = "Phobos"
        Destination = "$moonsDir/phobos_1k.jpg"
        URLs = @(
            "https://www.solarsystemscope.com/textures/download/2k_phobos.jpg",
            "https://stevealbers.net/albers/sos/mars/phobos/phobos_rgb_cyl_www.jpg"
        )
        License = "NASA/Voyager/USGS Public Domain"
    },
    @{
        Name = "Deimos"
        Destination = "$moonsDir/deimos_1k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/mars/deimos/deimos_rgb_cyl_www.jpg"
        )
        License = "NASA/Voyager Public Domain (processed by Phil Stooke)"
    },

    # ===== URANUS MOONS =====
    @{
        Name = "Titania"
        Destination = "$moonsDir/titania_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/uranus/titania/titania_rgb_cyl_www.jpg"
        )
        License = "NASA/Voyager Public Domain (processed by Steve Albers / Ted Stryk)"
    },
    @{
        Name = "Miranda"
        Destination = "$moonsDir/miranda_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/uranus/miranda/miranda_rgb_cyl_www.jpg"
        )
        License = "NASA/Voyager/USGS Public Domain"
    },

    # ===== NEPTUNE MOONS =====
    @{
        Name = "Triton"
        Destination = "$moonsDir/triton_2k.jpg"
        URLs = @(
            "https://stevealbers.net/albers/sos/neptune/triton/triton_rgb_cyl_www.jpg"
        )
        License = "NASA/Voyager Public Domain (processed by Steve Albers)"
    }
)

# Download with fallback
$successful = 0
$failed = 0
$skipped = 0
$totalSize = 0
$results = @()

foreach ($texture in $textures) {
    if (Test-Path $texture.Destination) {
        Write-Host "  SKIP  $($texture.Name) (already exists)" -ForegroundColor DarkGray
        $skipped++
        continue
    }
    
    Write-Host "  DOWN  $($texture.Name)..." -NoNewline
    $downloaded = $false
    
    foreach ($url in $texture.URLs) {
        try {
            Invoke-WebRequest -Uri $url -OutFile $texture.Destination -TimeoutSec 30 -ErrorAction Stop
            $fileInfo = Get-Item $texture.Destination
            $sizeKB = [math]::Round($fileInfo.Length / 1KB, 0)
            $totalSize += $fileInfo.Length

            # If the file is suspiciously small (< 1KB), it's probably an error page
            if ($fileInfo.Length -lt 1024) {
                Remove-Item $texture.Destination -Force
                Write-Host "" # newline
                Write-Host "         Skipping $url (too small: $sizeKB KB)" -ForegroundColor DarkYellow
                continue
            }

            Write-Host " OK (${sizeKB} KB)" -ForegroundColor Green
            $downloaded = $true
            $results += @{ Name = $texture.Name; Status = "OK"; Size = $sizeKB; License = $texture.License }
            break
        }
        catch {
            Write-Host "" # newline
            Write-Host "         Failed: $url" -ForegroundColor DarkYellow
            if (Test-Path $texture.Destination) { Remove-Item $texture.Destination -Force }
        }
    }
    
    if ($downloaded) {
        $successful++
    } else {
        Write-Host "  FAIL  $($texture.Name) - all sources failed" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Download Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Downloaded: $successful" -ForegroundColor Green
Write-Host "  Failed:     $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "  Skipped:    $skipped" -ForegroundColor Yellow
Write-Host "  Total size: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""

if ($results.Count -gt 0) {
    Write-Host "  Downloaded textures:" -ForegroundColor White
    foreach ($r in $results) {
        Write-Host "    $($r.Name) ($($r.Size) KB) - $($r.License)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
