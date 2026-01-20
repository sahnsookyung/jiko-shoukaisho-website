#!/usr/bin/env python3
"""
Optimized SVG Generator & Minifier.
Orchestrates vtracer and svgo in parallel for maximum performance.
"""

import argparse
import subprocess
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- Configuration ---

INPUT_DIR = Path("input_svgs")
OUTPUT_DIR = Path("output_svgs")
MIN_DIR = OUTPUT_DIR / "min"

# Default settings applied to all images unless overridden
DEFAULT_PARAMS = {
    "colormode": "color",
    "preset": "photo",
    "mode": "spline",
    "hierarchical": "stacked",
    "filter_speckle": 2,
    "color_precision": 8,
    "gradient_step": 25,
    "segment_length": 4
}

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_command(cmd, task_name):
    """Helper to run a subprocess command safely."""
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return True, None
    except subprocess.CalledProcessError as e:
        return False, f"Error in {task_name}: {e.stderr.strip()}"
    except FileNotFoundError:
        return False, f"Tool not found for {task_name}. Is it installed?"

def process_single_image(job_config):
    """
    Handles the full pipeline for a single image:
    JPEG -> vtracer -> SVG -> svgo -> Minified SVG
    """
    name = job_config["name"]
    output_name = job_config.get("output_name", name)
    overrides = job_config.get("overrides", {}) or {}
    should_minify = job_config.get("minify", False)
    
    input_path = INPUT_DIR / f"{name}.jpeg"
    output_path = OUTPUT_DIR / f"{output_name}.svg"
    min_path = MIN_DIR / f"{output_name}.svg"

    # 1. Run vtracer (Skip if input doesn't exist)
    if not input_path.exists():
        return f"SKIP: Input {input_path} not found."

    # Merge defaults with overrides
    params = {**DEFAULT_PARAMS, **overrides}
    
    cmd = ["vtracer", "--input", str(input_path), "--output", str(output_path)]
    for key, value in params.items():
        if value is not None:
            cmd.extend([f"--{key}", str(value)])

    success, error = run_command(cmd, f"vtracer: {name}")
    if not success:
        return error

    msg = f"✓ Generated: {output_name}.svg"

    # 2. Run SVGO (if requested and vtracer succeeded)
    if should_minify:
        svgo_cmd = ["svgo", str(output_path), "-o", str(min_path)]
        success, error = run_command(svgo_cmd, f"svgo: {name}")
        if success:
            msg += f" -> Minified to {min_path.name}"
        else:
            msg += f" (Minification Failed: {error})"

    return msg

def minify_existing_file(filename):
    """Handles files that already exist and just need SVGO."""
    input_path = OUTPUT_DIR / f"{filename}.svg"
    output_path = MIN_DIR / f"{filename}.svg"
    
    if not input_path.exists():
        return f"SKIP: {filename}.svg not found in {OUTPUT_DIR}"
        
    cmd = ["svgo", str(input_path), "-o", str(output_path)]
    success, error = run_command(cmd, f"svgo-only: {filename}")
    
    if success:
        return f"✓ Minified: {filename}.svg"
    return error

def run_batch_parallel(minify=False, minify_only=False):
    """Execute all production jobs in parallel."""
    # Ensure directories exist
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if minify or minify_only:
        MIN_DIR.mkdir(parents=True, exist_ok=True)

    tasks = {} # Map future to job name for logging
    
    logger.info(f"Starting batch processing (Minify Only: {minify_only})...")

    with ThreadPoolExecutor() as executor:
        
        # 1. Process Production Jobs (Converted files)
        for name, overrides in PRODUCTION_JOBS:
            overrides = overrides or {}
            output_name = overrides.get("output_name", name)
            
            if minify_only:
                # Skip vtracer, just try to minify the output file
                future = executor.submit(minify_existing_file, output_name)
                tasks[future] = f"Minify {output_name}"
            else:
                # Full pipeline
                task_config = {
                    "name": name,
                    "output_name": output_name,
                    "overrides": overrides,
                    "minify": minify
                }
                future = executor.submit(process_single_image, task_config)
                tasks[future] = f"Process {name}"

        # 2. Process Static Minification Jobs (Always minified if minify/minify_only is on)
        if minify or minify_only:
            for static_file in MINIFY_ONLY_JOBS:
                future = executor.submit(minify_existing_file, static_file)
                tasks[future] = f"Minify Static {static_file}"

        # Gather results
        for future in as_completed(tasks):
            job_name = tasks[future]
            try:
                result = future.result()
                if "Error" in result or "✗" in result:
                    logger.error(result)
                elif "SKIP" in result:
                    logger.warning(result)
                else:
                    logger.info(result)
            except Exception as exc:
                logger.error(f"{job_name} generated an exception: {exc}")

def generate_variants_test():
    """Debug mode: Run variants on main.jpeg to test settings."""
    logger.info("Running Parameter Stress Test on main.jpeg...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    variants = [
        ("preset_bw", {"preset": "bw"}),
        ("preset_poster", {"preset": "poster"}),
        ("mode_pixel", {"mode": "pixel"}),
        ("mode_polygon", {"mode": "polygon"}),
        ("detail_low", {"mode": "polygon", "filter_speckle": 16, "color_precision": 4}),
        ("detail_high", {"mode": "spline", "filter_speckle": 0, "color_precision": 8}),
    ]
    
    with ThreadPoolExecutor() as executor:
        futures = []
        for name, params in variants:
            task = {
                "name": "main",
                "output_name": f"test_{name}",
                "overrides": params,
                "minify": False
            }
            futures.append(executor.submit(process_single_image, task))
            
        for future in as_completed(futures):
            try:
                result = future.result()
                logger.info(result)
            except Exception as exc:
                logger.error(f"Test variant generated an exception: {exc}")


# Define the production batch: (filename_without_extension, {overrides})
# If the second element is None, it uses defaults exactly.
PRODUCTION_JOBS = [
    # ("main", None),
    # ("book", None),
    ("camera-viewfinder", None),
    # ("laptop", {"output_name": "laptop-screen"}), # Example of changing output name
    # ("laptop-frame", None),
    # ("laptop-screen-cutout", None),
    # ("navigation-sprites", None),
    # ("scroll", {"preset": "poster"}), # Specific override for scroll
]

# Static files that only need minification (no vtracer step)
MINIFY_ONLY_JOBS = [
    "laptop-frame",
    "laptop-screen-cutout"
]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SVG Batch Processor")
    parser.add_argument("--mode", choices=["batch", "test"], default="batch", help="Run production batch or test variants")
    
    # Minification controls
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--no-minify", action="store_true", help="Skip the SVGO minification step completely")
    group.add_argument("--minify-only", action="store_true", help="Skip generation, only minify existing output files")
    
    args = parser.parse_args()

    if args.mode == "test":
        generate_variants_test()
    else:
        # If minify-only is True, we pass it.
        # If no-minify is True, minify=False. Otherwise defaults to True.
        do_minify = not args.no_minify
        run_batch_parallel(minify=do_minify, minify_only=args.minify_only)
