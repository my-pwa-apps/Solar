"""
Generate a high-quality 2048x2048 sun texture for Space Voyage.
Uses numpy + PIL for fast pixel operations.

Features:
- Photorealistic color gradient (white-hot core → golden photosphere → dark red limb)
- Physics-accurate limb darkening (u ≈ 0.6)
- Multi-scale solar granulation (supergranulation + granules + intergranular lanes)
- Realistic sunspots with umbra/penumbra
- Solar faculae (bright patches near active regions)
- Seeded random for reproducibility
"""

import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import math, random, os

random.seed(42)
np.random.seed(42)

SIZE = 2048
OUTPUT = r'textures/planets/sun.jpg'

print(f"Generating {SIZE}x{SIZE} sun texture …")

# ────────────────────────────────────────────────────────────────────────────
# 1. Coordinate grids
# ────────────────────────────────────────────────────────────────────────────
Y, X = np.mgrid[0:SIZE, 0:SIZE]
cx = cy = SIZE / 2.0
# Normalised radius from centre (0 = centre, 1 = edge)
dx = (X - cx) / cx
dy = (Y - cy) / cy
r  = np.sqrt(dx**2 + dy**2)
r  = np.clip(r, 0.0, 1.0)

# ────────────────────────────────────────────────────────────────────────────
# 2. Base photosphere colour gradient (temperature → RGB)
# ────────────────────────────────────────────────────────────────────────────
# Stops: (radius, R, G, B)  – values 0-1
colour_stops = [
    (0.00, 1.00, 0.98, 0.92),   # white-hot core
    (0.15, 1.00, 0.96, 0.78),   # pale yellow
    (0.38, 1.00, 0.88, 0.38),   # bright golden
    (0.60, 1.00, 0.68, 0.08),   # warm orange
    (0.78, 0.95, 0.44, 0.02),   # deep orange
    (0.88, 0.78, 0.24, 0.01),   # orange-red
    (0.95, 0.55, 0.10, 0.00),   # dark red
    (1.00, 0.25, 0.03, 0.00),   # near-black limb
]

def interp_colour(r_val, stops):
    for i in range(len(stops) - 1):
        r0, *c0 = stops[i]
        r1, *c1 = stops[i + 1]
        if r0 <= r_val <= r1:
            t = (r_val - r0) / (r1 - r0)
            return tuple(c0[j] * (1 - t) + c1[j] * t for j in range(3))
    return tuple(stops[-1][1:])

# Build gradient image with vectorised interpolation
base_R = np.zeros((SIZE, SIZE), dtype=np.float32)
base_G = np.zeros((SIZE, SIZE), dtype=np.float32)
base_B = np.zeros((SIZE, SIZE), dtype=np.float32)

for i in range(len(colour_stops) - 1):
    r0, R0, G0, B0 = colour_stops[i]
    r1, R1, G1, B1 = colour_stops[i + 1]
    mask = (r >= r0) & (r < r1)
    t = np.where(mask, (r - r0) / (r1 - r0), 0.0)
    base_R = np.where(mask, R0 + t * (R1 - R0), base_R)
    base_G = np.where(mask, G0 + t * (G1 - G0), base_G)
    base_B = np.where(mask, B0 + t * (B1 - B0), base_B)
# Handle exactly r==1.0
mask_last = r >= colour_stops[-1][0]
base_R = np.where(mask_last, colour_stops[-1][1], base_R)
base_G = np.where(mask_last, colour_stops[-1][2], base_G)
base_B = np.where(mask_last, colour_stops[-1][3], base_B)
print("  ✔ base gradient")

# ────────────────────────────────────────────────────────────────────────────
# 3. Limb darkening  I(r) = 1 - u(1 - sqrt(1-r²))  where u=0.6
# ────────────────────────────────────────────────────────────────────────────
r_safe  = np.clip(r, 0.0, 0.9999)
cos_th  = np.sqrt(1.0 - r_safe**2)
limb_u  = 0.62
limb    = 1.0 - limb_u * (1.0 - cos_th)
limb    = np.clip(limb, 0.0, 1.0)
base_R *= limb
base_G *= limb
base_B *= limb
print("  ✔ limb darkening")

# ────────────────────────────────────────────────────────────────────────────
# 4. Granulation: multi-scale pseudo-noise using sine planes
#    Uses 3 octaves of tilted sine waves, giving an organic cell-like pattern.
# ────────────────────────────────────────────────────────────────────────────
def sine_noise(size, scale, angle_deg, phase):
    """Single octave of directional sine 'noise'."""
    ang = math.radians(angle_deg)
    fx  = math.cos(ang) / scale
    fy  = math.sin(ang) / scale
    Y2, X2 = np.mgrid[0:size, 0:size]
    return np.sin(2 * math.pi * (X2 * fx + Y2 * fy) + phase)

def build_turbulence(size, base_scale, octaves=5):
    """Sum of sine planes at different scales/angles → Perlin-like turbulence."""
    result  = np.zeros((size, size), dtype=np.float32)
    amplitude = 1.0
    total_amp = 0.0
    for o in range(octaves):
        scale = base_scale / (2 ** o)
        # Use three crossing directions so we get 2D cells
        n  = sine_noise(size, scale, random.uniform(0, 180), random.uniform(0, 6.28))
        n += sine_noise(size, scale * 0.87, random.uniform(0, 180), random.uniform(0, 6.28))
        n += sine_noise(size, scale * 0.63, random.uniform(0, 180), random.uniform(0, 6.28))
        result    += amplitude * n / 3.0
        total_amp += amplitude
        amplitude *= 0.52
    result = result / total_amp    # normalise to [-1, 1]
    return result

# Large-scale supergranulation (cells ~3-4% of image)
gran_lg = build_turbulence(SIZE, SIZE / 28, octaves=4)
gran_lg = (gran_lg - gran_lg.min()) / (gran_lg.max() - gran_lg.min())

# Fine granulation
gran_sm = build_turbulence(SIZE, SIZE / 90, octaves=3)
gran_sm = (gran_sm - gran_sm.min()) / (gran_sm.max() - gran_sm.min())

# Blend: 60% large + 40% fine
gran = 0.6 * gran_lg + 0.4 * gran_sm
gran = (gran - gran.min()) / (gran.max() - gran.min())

# Modulate brightness: granule peaks +12%, intergranular lanes −8%
gran_mod = (gran - 0.5) * 0.20  # ±0.10
base_R = np.clip(base_R + gran_mod * 0.9, 0.0, 1.0)
base_G = np.clip(base_G + gran_mod * 0.7, 0.0, 1.0)
base_B = np.clip(base_B + gran_mod * 0.1, 0.0, 1.0)
print("  ✔ granulation")

# ────────────────────────────────────────────────────────────────────────────
# 5. Sunspots (umbra + penumbra, equatorial bias)
# ────────────────────────────────────────────────────────────────────────────
def add_sunspot(R, G, B, cx_sp, cy_sp, radius):
    """Paints a sunspot with proper penumbra/umbra using analytic formula."""
    Y2, X2 = np.mgrid[0:SIZE, 0:SIZE]
    dist = np.sqrt((X2 - cx_sp)**2 + (Y2 - cy_sp)**2)
    inner_r = radius * 0.42
    outer_r = radius

    # Penumbra: linear fade outer_r → inner_r
    pen = np.clip((dist - inner_r) / (outer_r - inner_r), 0.0, 1.0)
    # pen=0 inside umbra, pen=1 at outer edge of penumbra
    pen_dark = 1.0 - pen  # 1 = dark, 0 = no effect
    pen_mask  = dist < outer_r

    # Umbra: very dark
    umbra_mask = dist < inner_r
    umbra_dark = np.where(umbra_mask,
                          np.clip(1.0 - (dist / inner_r) * 0.15, 0.92, 1.0),
                          0.0)

    # Apply penumbra as darkening multiplier
    pen_factor   = 1.0 - pen_dark * 0.55  # max 55% penumbra dark
    umbra_factor = 1.0 - umbra_dark * 0.88 # max 88% dark at umbra centre

    final_factor = np.where(umbra_mask, umbra_factor, np.where(pen_mask, pen_factor, 1.0))

    R[:] = (R * final_factor).astype(np.float32)
    G[:] = (G * final_factor).astype(np.float32)
    B[:] = (B * final_factor).astype(np.float32)

# Generate sunspot groups (clustered in equatorial band)
rng = random.Random(1337)
spot_count = rng.randint(8, 14)
for _ in range(spot_count):
    # x anywhere, y biased toward equator (centre vertically)
    sp_x = rng.uniform(SIZE * 0.07, SIZE * 0.93)
    sp_y = SIZE * 0.5 + rng.gauss(0, SIZE * 0.14)
    sp_r = SIZE / 512.0 * rng.uniform(16, 34)
    # Skip if too close to limb
    dx_sp = (sp_x - cx) / cx
    dy_sp = (sp_y - cy) / cy
    if math.sqrt(dx_sp**2 + dy_sp**2) > 0.82:
        continue
    add_sunspot(base_R, base_G, base_B, sp_x, sp_y, sp_r)

print("  ✔ sunspots")

# ────────────────────────────────────────────────────────────────────────────
# 6. Solar faculae: bright patches near active regions / equatorial band
# ────────────────────────────────────────────────────────────────────────────
fac_rng  = random.Random(9999)
fac_count = 60
Y2, X2   = np.mgrid[0:SIZE, 0:SIZE]
for _ in range(fac_count):
    fx = fac_rng.uniform(SIZE * 0.1, SIZE * 0.9)
    fy = SIZE * 0.5 + fac_rng.gauss(0, SIZE * 0.18)
    frad = SIZE / 512.0 * fac_rng.uniform(6, 18)
    fint = fac_rng.uniform(0.04, 0.12)
    dist = np.sqrt((X2 - fx)**2 + (Y2 - fy)**2)
    fade = np.clip(1.0 - dist / frad, 0.0, 1.0) ** 2
    dx_f = (fx - cx) / cx
    dy_f = (fy - cy) / cy
    if math.sqrt(dx_f**2 + dy_f**2) < 0.78:
        base_R = np.clip(base_R + fade * fint * 1.1, 0.0, 1.0)
        base_G = np.clip(base_G + fade * fint * 0.8, 0.0, 1.0)
        base_B = np.clip(base_B + fade * fint * 0.2, 0.0, 1.0)
print("  ✔ faculae")

# ────────────────────────────────────────────────────────────────────────────
# 7. Composite to PIL image and save
# ────────────────────────────────────────────────────────────────────────────
img_r = (np.clip(base_R, 0.0, 1.0) * 255).astype(np.uint8)
img_g = (np.clip(base_G, 0.0, 1.0) * 255).astype(np.uint8)
img_b = (np.clip(base_B, 0.0, 1.0) * 255).astype(np.uint8)

img_rgb = np.stack([img_r, img_g, img_b], axis=2)
img = Image.fromarray(img_rgb, mode='RGB')

# Apply a very gentle blur to smooth pixel-level jaggies
img = img.filter(ImageFilter.GaussianBlur(radius=0.6))

# Save with high quality
img.save(OUTPUT, 'JPEG', quality=92, optimize=True, subsampling=0)
file_size = os.path.getsize(OUTPUT)
print(f"\n✅ Saved: {OUTPUT}")
print(f"   Size:  {img.size[0]}×{img.size[1]} px")
print(f"   File:  {file_size:,} bytes ({file_size//1024} KB)")
