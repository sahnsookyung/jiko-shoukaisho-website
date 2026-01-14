#!/usr/bin/env python3
"""
Generate multiple SVG files using vtracer with different parameter combinations
to visualize the differences between various settings.
"""

import subprocess
import os
from pathlib import Path

# Input image
INPUT_IMAGE = "main.jpeg"
OUTPUT_DIR = "output_svgs"

# Create output directory
Path(OUTPUT_DIR).mkdir(exist_ok=True)

def run_vtracer(input_file, output_file, **kwargs):
    """Run vtracer with specified parameters."""
    cmd = ["vtracer", "--input", input_file, "--output", output_file]
    
    for key, value in kwargs.items():
        if value is not None:
            # Keep underscores in argument names (vtracer uses snake_case)
            arg_name = f"--{key}"
            cmd.extend([arg_name, str(value)])
    
    print(f"Running: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✓ Generated: {output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Error generating {output_file}: {e.stderr}")
        return False
    except FileNotFoundError:
        print("✗ Error: vtracer not found. Please install it first.")
        print("  You can install it with: cargo install vtracer")
        return False

def generate_variants():
    """Generate SVG files with different parameter combinations."""
    
    print("=" * 60)
    print("Generating SVG variants using vtracer")
    print("=" * 60)
    print()
    
    # Test 1: Different presets
    print("1. Testing presets...")
    presets = ["bw", "poster", "photo"]
    for preset in presets:
        output = f"{OUTPUT_DIR}/preset_{preset}.svg"
        run_vtracer(INPUT_IMAGE, output, preset=preset)
    print()
    
    # Test 2: Different modes with photo preset
    print("2. Testing modes (with photo preset)...")
    modes = ["pixel", "polygon", "spline"]
    for mode in modes:
        output = f"{OUTPUT_DIR}/mode_{mode}.svg"
        run_vtracer(INPUT_IMAGE, output, preset="photo", mode=mode)
    print()
    
    # Test 3: Different color modes
    print("3. Testing color modes...")
    run_vtracer(INPUT_IMAGE, f"{OUTPUT_DIR}/colormode_color.svg", 
                colormode="color", preset="photo")
    run_vtracer(INPUT_IMAGE, f"{OUTPUT_DIR}/colormode_bw.svg", 
                colormode="bw")
    print()
    
    # Test 4: Different hierarchical settings (color mode only)
    print("4. Testing hierarchical settings...")
    hierarchical_modes = ["stacked", "cutout"]
    for hier_mode in hierarchical_modes:
        output = f"{OUTPUT_DIR}/hierarchical_{hier_mode}.svg"
        run_vtracer(INPUT_IMAGE, output, 
                   preset="photo", hierarchical=hier_mode)
    print()
    
    # Test 5: Different filter_speckle values (valid range is 0-16)
    print("5. Testing filter_speckle (noise reduction)...")
    speckle_values = [0, 4, 8, 16]
    for speckle in speckle_values:
        output = f"{OUTPUT_DIR}/speckle_{speckle}.svg"
        run_vtracer(INPUT_IMAGE, output, 
                   preset="photo", filter_speckle=speckle)
    print()
    
    # Test 6: Different corner_threshold values
    print("6. Testing corner_threshold...")
    corner_values = [30, 60, 90, 120]
    for corner in corner_values:
        output = f"{OUTPUT_DIR}/corner_{corner}.svg"
        run_vtracer(INPUT_IMAGE, output, 
                   preset="photo", corner_threshold=corner)
    print()
    
    # Test 7: Different color_precision values
    print("7. Testing color_precision...")
    precision_values = [4, 6, 8]
    for precision in precision_values:
        output = f"{OUTPUT_DIR}/precision_{precision}.svg"
        run_vtracer(INPUT_IMAGE, output, 
                   preset="photo", color_precision=precision)
    print()
    
    # Test 8: Different gradient_step values
    print("8. Testing gradient_step...")
    gradient_values = [5, 10, 20, 40]
    for gradient in gradient_values:
        output = f"{OUTPUT_DIR}/gradient_{gradient}.svg"
        run_vtracer(INPUT_IMAGE, output, 
                   preset="photo", gradient_step=gradient)
    print()
    
    # Test 9: Combination tests - high detail vs low detail
    print("9. Testing detail level combinations...")
    run_vtracer(INPUT_IMAGE, f"{OUTPUT_DIR}/detail_high.svg",
               mode="spline",
               filter_speckle=2,
               corner_threshold=30,
               color_precision=8,
               gradient_step=5)
    
    run_vtracer(INPUT_IMAGE, f"{OUTPUT_DIR}/detail_low.svg",
               mode="polygon",
               filter_speckle=16,
               corner_threshold=120,
               color_precision=4,
               gradient_step=40)
    print()
    
    print("=" * 60)
    print(f"All variants saved to: {OUTPUT_DIR}/")
    print("=" * 60)

if __name__ == "__main__":
    # Check if input file exists
    if not os.path.exists(INPUT_IMAGE):
        print(f"Error: Input image '{INPUT_IMAGE}' not found!")
        print("Please ensure main.jpeg is in the current directory.")
        exit(1)
    
    # Run to compare effects of different parameters
    # generate_variants()

    # Final gen that I liked
    run_vtracer(INPUT_IMAGE, f"{OUTPUT_DIR}/main.svg",
               colormode="color",
               preset="photo",
               mode="spline",
               hierarchical="stacked",
               filter_speckle=2,
               color_precision=8,
               gradient_step=25,
               segment_length=4)

    # Minify the result
    print("\nMinifying SVG...")
    subprocess.run(["svgo", f"{OUTPUT_DIR}/main.svg", "-o", f"{OUTPUT_DIR}/main.min.svg"], check=True)

