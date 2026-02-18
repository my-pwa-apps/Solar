# ============================================================
# Space Voyage – Deep Sky & Moon Texture Downloader
# Downloads: Phobos, Deimos, Saturn rings, Nebulae, Galaxies
# All sources: NASA/ESA/ESO (public domain / free)
# ============================================================

$ErrorActionPreference = "Continue"

# ---- Directories -------------------------------------------
$moonsDir      = "textures/moons"
$ringsDir      = "textures/rings"
$nebulaeDir    = "textures/nebulae"
$galaxiesDir   = "textures/galaxies"

foreach ($d in @($moonsDir, $ringsDir, $nebulaeDir, $galaxiesDir)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# ---- Helper ------------------------------------------------
function Download-Texture($url, $dest, $label) {
    if (Test-Path $dest) {
        Write-Host "  [SKIP] $label already exists" -ForegroundColor DarkGray
        return
    }
    Write-Host "  [GET]  $label" -ForegroundColor Cyan
    try {
        $wr = [System.Net.WebRequest]::Create($url)
        $wr.UserAgent = "Mozilla/5.0 SpaceVoyage-TextureDownloader"
        $wr.Timeout = 30000
        $resp = $wr.GetResponse()
        $stream = $resp.GetResponseStream()
        $fs = [System.IO.File]::Create($dest)
        $stream.CopyTo($fs)
        $fs.Close(); $stream.Close(); $resp.Close()
        $size = [math]::Round((Get-Item $dest).Length / 1KB)
        Write-Host "         -> saved $size KB" -ForegroundColor Green
    } catch {
        Write-Host "         -> FAILED: $_" -ForegroundColor Red
        if (Test-Path $dest) { Remove-Item $dest }
    }
}

# ============================================================
# 1. PHOBOS & DEIMOS  (NASA USGS/PDS — public domain)
# ============================================================
Write-Host "`n== Mars Moons ==" -ForegroundColor Yellow

# Phobos – USGS Astrogeology, Viking/Mars Global Surveyor composite
Download-Texture `
    "https://astropedia.astrogeology.usgs.gov/download/Mars/Phobos/Phobos_Viking_Mosaic_40ppd.cub/full.jpg" `
    "$moonsDir/phobos_2k.jpg" "Phobos (USGS Viking mosaic)"

# Alternative Phobos from Solar System Scope
Download-Texture `
    "https://www.solarsystemscope.com/textures/download/2k_phobos.jpg" `
    "$moonsDir/phobos_2k.jpg" "Phobos (Solar System Scope 2K)"

# Deimos – USGS
Download-Texture `
    "https://astropedia.astrogeology.usgs.gov/download/Mars/Deimos/Deimos_Viking_Mosaic_40ppd.cub/full.jpg" `
    "$moonsDir/deimos_2k.jpg" "Deimos (USGS Viking mosaic)"

# Alternative Deimos from Solar System Scope
Download-Texture `
    "https://www.solarsystemscope.com/textures/download/2k_deimos.jpg" `
    "$moonsDir/deimos_2k.jpg" "Deimos (Solar System Scope 2K)"

# ============================================================
# 2. SATURN RING TEXTURE  (Semi-transparent radial PNG)
# ============================================================
Write-Host "`n== Saturn Rings ==" -ForegroundColor Yellow

# Solar System Scope provides a dedicated ring alpha map
Download-Texture `
    "https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png" `
    "$ringsDir/saturn_ring_alpha.png" "Saturn ring alpha (Solar System Scope)"

# ============================================================
# 3. NEBULAE  (NASA/ESA Hubble — public domain)
# ============================================================
Write-Host "`n== Nebulae ==" -ForegroundColor Yellow

# Orion Nebula (M42) – NASA Hubble
Download-Texture `
    "https://stsci-opo.org/STScI-01EVT2R2BKPQME7EEDMHM6B7FT.png" `
    "$nebulaeDir/orion_nebula.png" "Orion Nebula M42 (Hubble/STScI)"

# Crab Nebula (M1) – NASA Hubble
Download-Texture `
    "https://stsci-opo.org/STScI-01EVSTAXZ5B1GJAPMPB6JPKMQS.png" `
    "$nebulaeDir/crab_nebula.png" "Crab Nebula M1 (Hubble/STScI)"

# Ring Nebula (M57) – NASA Hubble
Download-Texture `
    "https://stsci-opo.org/STScI-01EVT6VNJSC1N85B1WFPNK9JF0.png" `
    "$nebulaeDir/ring_nebula.png" "Ring Nebula M57 (Hubble/STScI)"

# ============================================================
# 4. GALAXIES  (NASA/ESA Hubble — public domain)
# ============================================================
Write-Host "`n== Galaxies ==" -ForegroundColor Yellow

# Andromeda Galaxy (M31) – NASA
Download-Texture `
    "https://stsci-opo.org/STScI-01EVVK4MJ1W9ZP1YWGD6QKKSGE.jpg" `
    "$galaxiesDir/andromeda_galaxy.jpg" "Andromeda Galaxy M31 (Hubble/STScI)"

# Whirlpool Galaxy (M51) – NASA Hubble
Download-Texture `
    "https://stsci-opo.org/STScI-01EVT1RZSQS0KP7NB45PRPZ6QG.jpg" `
    "$galaxiesDir/whirlpool_galaxy.jpg" "Whirlpool Galaxy M51 (Hubble/STScI)"

# Sombrero Galaxy (M104) – NASA Hubble
Download-Texture `
    "https://stsci-opo.org/STScI-01EVT1S7VKYJKB9BNFHPVFBJHZ.jpg" `
    "$galaxiesDir/sombrero_galaxy.jpg" "Sombrero Galaxy M104 (Hubble/STScI)"

# ============================================================
# Summary
# ============================================================
Write-Host "`n== Results ==" -ForegroundColor Yellow
$files = @(
    "$moonsDir/phobos_2k.jpg",
    "$moonsDir/deimos_2k.jpg",
    "$ringsDir/saturn_ring_alpha.png",
    "$nebulaeDir/orion_nebula.png",
    "$nebulaeDir/crab_nebula.png",
    "$nebulaeDir/ring_nebula.png",
    "$galaxiesDir/andromeda_galaxy.jpg",
    "$galaxiesDir/whirlpool_galaxy.jpg",
    "$galaxiesDir/sombrero_galaxy.jpg"
)
foreach ($f in $files) {
    if (Test-Path $f) {
        $kb = [math]::Round((Get-Item $f).Length / 1KB)
        Write-Host "  [OK] $f  ($kb KB)" -ForegroundColor Green
    } else {
        Write-Host "  [MISS] $f" -ForegroundColor Red
    }
}
Write-Host "`nDone. Run the app to verify textures loaded correctly.`n"
