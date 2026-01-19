# VTracer SVG Variants Guide

This guide explains all 27 SVG variants generated from `main.jpeg` using different vtracer parameters.

## Quick Summary

**Total variants generated**: 27 SVG files  
**Output directory**: `output_svgs/`  
**Source image**: `main.jpeg`  
**Generation script**: `generate-svgs.py`

---

## Variants by Category

### 1. Preset Comparisons (3 files)
Presets are pre-configured parameter sets optimized for different image types:

- **preset_bw.svg** (351K) - Black & white preset, best for line art
- **preset_poster.svg** (5.5M) - Poster preset, high detail with bold colors
- **preset_photo.svg** (2.0M) - Photo preset, balanced detail and file size

### 2. Mode Comparisons (3 files)
Mode controls how paths are fitted to the image:

- **mode_pixel.svg** (1.4M) - Pixel mode: blocky, pixelated look
- **mode_polygon.svg** (414K) - Polygon mode: straight lines and angles
- **mode_spline.svg** (2.0M) - Spline mode: smooth curves (most natural)

### 3. Color Mode (2 files)

- **colormode_color.svg** (2.0M) - Full color image
- **colormode_bw.svg** (351K) - Black and white conversion

### 4. Hierarchical Clustering (2 files)
Controls how color layers are arranged:

- **hierarchical_stacked.svg** (2.0M) - Layers stacked on top of each other
- **hierarchical_cutout.svg** (1.7M) - Layers cut out from each other

### 5. Filter Speckle / Noise Reduction (4 files)
Removes small patches (higher = more aggressive filtering):

- **speckle_0.svg** (5.4M) - No filtering, maximum detail
- **speckle_4.svg** (2.5M) - Light filtering
- **speckle_8.svg** (2.1M) - Medium filtering
- **speckle_16.svg** (1.7M) - Heavy filtering, cleanest result

### 6. Corner Threshold (4 files)
Minimum angle to detect corners (higher = smoother curves):

- **corner_30.svg** (1.5M) - Sharp corners, more angular
- **corner_60.svg** (1.7M) - Moderate
- **corner_90.svg** (1.8M) - Smoother
- **corner_120.svg** (2.0M) - Very smooth, fewer corners

### 7. Color Precision (3 files)
Number of bits per RGB channel (higher = more colors):

- **precision_4.svg** (427K) - 16 colors per channel, posterized look
- **precision_6.svg** (1.8M) - 64 colors per channel
- **precision_8.svg** (2.0M) - 256 colors per channel, full color depth

### 8. Gradient Step (4 files)
Color difference between layers (lower = more gradual transitions):

- **gradient_5.svg** (5.9M) - Very gradual, many color layers
- **gradient_10.svg** (4.9M) - Smooth gradients
- **gradient_20.svg** (3.7M) - Moderate steps
- **gradient_40.svg** (2.4M) - Bold color steps, fewer layers

### 9. Detail Level Combinations (2 files)

- **detail_high.svg** (10M) - Maximum detail combination:
  - Mode: spline
  - Filter speckle: 2
  - Corner threshold: 30
  - Color precision: 8
  - Gradient step: 5

- **detail_low.svg** (70K) - Simplified/stylized combination:
  - Mode: polygon
  - Filter speckle: 16
  - Corner threshold: 120
  - Color precision: 4
  - Gradient step: 40

---

## Key Observations

### File Size Trends
- **Smallest**: detail_low.svg (70K) - highly simplified
- **Largest**: detail_high.svg (10M) - maximum detail preserved
- Lower speckle filtering = larger files
- Lower gradient steps = larger files
- Higher color precision = larger files

### Visual Quality Considerations
- **For photos**: Use `photo` preset with `spline` mode
- **For logos/graphics**: Use `polygon` mode with higher speckle filtering
- **For artistic effect**: Try `poster` preset or low color precision
- **For file size**: Increase gradient_step, filter_speckle, and corner_threshold

---

## Regenerating Variants

To regenerate all variants:

```bash
cd /Users/sookyungahn/repos/jiko-shoukaisho-website/public/images
python3 generate-svgs.py
```

To generate custom variants, modify the parameters in `generate-svgs.py` or run vtracer manually:

```bash
vtracer --input main.jpeg --output custom.svg --preset photo --mode spline
```

---

## VTracer Parameter Reference

### Available Presets
- `bw` - Black and white
- `poster` - Poster style
- `photo` - Photorealistic

### Available Modes
- `pixel` - Blocky, pixelated
- `polygon` - Angular, geometric
- `spline` - Smooth curves

### Valid Ranges
- **filter_speckle**: 0-16 (pixels)
- **corner_threshold**: Degrees
- **color_precision**: Bits per channel (typically 4-8)
- **gradient_step**: Color difference threshold

### Color Mode
- `color` - Full RGB color
- `bw` - Black and white binary

### Hierarchical Mode (color only)
- `stacked` - Layered
- `cutout` - Cut-out style
