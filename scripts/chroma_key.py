#!/usr/bin/env python3
"""
High-Precision Multi-Color Chroma Key Studio Engine
Extracts subjects on solid backgrounds (Hot Pink/Magenta, Chroma Green, Blue, Cyan, or auto-detected)
to pristine transparent PNGs with soft alpha anti-aliasing, Hollywood Keylight de-mixing, and despill suppression.
"""

import sys
import os
import argparse
import math
import numpy as np
from PIL import Image

COLOR_MAP = {
    "pink": (255, 0, 255),
    "magenta": (255, 0, 255),
    "fuchsia": (255, 0, 255),
    "hotpink": (255, 105, 180),
    "green": (0, 255, 0),
    "lime": (0, 255, 0),
    "blue": (0, 0, 255),
    "cyan": (0, 255, 255),
    "yellow": (255, 255, 0),
    "red": (255, 0, 0),
    "white": (255, 255, 255),
    "black": (0, 0, 0),
}

def parse_color(color_str: str) -> tuple:
    """Parse color string into RGB tuple (0-255)."""
    if not color_str:
        return None
    s = color_str.strip().lower()
    if s == "auto":
        return None
    if s in COLOR_MAP:
        return COLOR_MAP[s]
    if s.startswith("#"):
        s = s[1:]
    if len(s) == 6:
        try:
            return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))
        except ValueError:
            pass
    if "," in s:
        parts = [int(p.strip()) for p in s.split(",") if p.strip().isdigit()]
        if len(parts) == 3:
            return tuple(parts)
    raise ValueError(f"Unrecognized color specification: '{color_str}'")

def auto_detect_key_color(img_arr: np.ndarray, border_sample_size: int = 25) -> tuple:
    """Auto-detect key color by sampling the image perimeter and corners."""
    h, w = img_arr.shape[:2]
    b = min(border_sample_size, h // 4, w // 4)
    
    top = img_arr[0:b, :, :3].reshape(-1, 3)
    bottom = img_arr[h-b:h, :, :3].reshape(-1, 3)
    left = img_arr[:, 0:b, :3].reshape(-1, 3)
    right = img_arr[:, w-b:w, :3].reshape(-1, 3)
    
    samples = np.vstack([top, bottom, left, right])
    median_color = np.median(samples, axis=0).astype(int)
    return tuple(int(c) for c in median_color)

def apply_advanced_despill(foreground: np.ndarray, alpha: np.ndarray, key_color: tuple, strength: float = 0.85) -> np.ndarray:
    """
    Remove color bleed and ambient bounce cast strictly from semi-transparent edge pixels.
    """
    out_rgb = foreground.astype(np.float32).copy()
    kr, kg, kb = key_color
    
    is_magenta = (kr > 160 and kb > 140 and kg < 120)
    is_green = (kg > 160 and kr < 130 and kb < 130)
    is_blue = (kb > 160 and kr < 130 and kg < 130)
    is_cyan = (kg > 140 and kb > 140 and kr < 120)
    is_red = (kr > 160 and kg < 120 and kb < 120)
    is_yellow = (kr > 140 and kg > 140 and kb < 120)

    # Edge weight: 1.0 at outer boundary, 0.0 inside opaque subject
    edge_weight = np.clip((1.0 - alpha) * 1.5, 0.0, 1.0) * strength

    r = out_rgb[:, :, 0]
    g = out_rgb[:, :, 1]
    b = out_rgb[:, :, 2]

    if is_magenta:
        # Neutralize excess magenta on edge pixels
        excess_magenta = np.maximum(0.0, np.minimum(r - g, b - g))
        out_rgb[:, :, 0] -= excess_magenta * edge_weight
        out_rgb[:, :, 2] -= excess_magenta * edge_weight * 0.6
    elif is_green:
        # Green despill: clamp G to max(R, B) on edges
        max_rb = np.maximum(r, b)
        excess_green = np.maximum(0.0, g - max_rb)
        out_rgb[:, :, 1] -= excess_green * edge_weight
    elif is_blue:
        # Blue despill: clamp B to max(R, G) on edges
        max_rg = np.maximum(r, g)
        excess_blue = np.maximum(0.0, b - max_rg)
        out_rgb[:, :, 2] -= excess_blue * edge_weight
    elif is_cyan:
        # Cyan despill: clamp G and B to R on edges
        excess_cyan = np.maximum(0.0, ((g + b) / 2.0) - r)
        out_rgb[:, :, 1] -= excess_cyan * edge_weight * 0.7
        out_rgb[:, :, 2] -= excess_cyan * edge_weight * 0.7
    elif is_yellow:
        # Yellow despill: clamp R and G to B on edges
        excess_yellow = np.maximum(0.0, ((r + g) / 2.0) - b)
        out_rgb[:, :, 0] -= excess_yellow * edge_weight * 0.7
        out_rgb[:, :, 1] -= excess_yellow * edge_weight * 0.7

    return np.clip(out_rgb, 0.0, 255.0).astype(np.uint8)

def chroma_key_process(
    image_path: str,
    output_path: str,
    key_color: tuple = None,
    tolerance: float = 48.0,
    smoothness: float = 28.0,
    despill: bool = True,
    despill_strength: float = 0.85,
    trim: bool = False,
    margin: int = 20,
    export_webp: bool = False,
    webp_quality: int = 90,
) -> str:
    """
    Core chroma key extraction algorithm with Hollywood Keylight de-mixing.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Input image does not exist: {image_path}")

    pil_img = Image.open(image_path).convert("RGBA")
    img_arr = np.array(pil_img)
    rgb = img_arr[:, :, :3].astype(np.float32)

    # 1. Determine key color
    if key_color is None:
        key_color = auto_detect_key_color(img_arr)
        print(f"Auto-detected key color: RGB {key_color}")
    else:
        print(f"Using key color: RGB {key_color}")

    k_arr = np.array(key_color, dtype=np.float32)

    # 2. Compute Euclidean color distance
    diff = rgb - k_arr
    dist = np.sqrt(np.sum(diff ** 2, axis=2))

    # 3. Soft alpha ramp calculation
    t_min = float(tolerance)
    t_max = float(tolerance + smoothness)
    
    # 0 = transparent, 1 = opaque
    alpha = np.clip((dist - t_min) / max(1.0, (t_max - t_min)), 0.0, 1.0)

    # 4. Hollywood Keylight un-multiplication / de-mixing
    # I = A * F + (1 - A) * K  ==>  F = (I - (1 - A) * K) / A
    foreground = rgb.copy()
    mask = alpha > 0.01

    for c in range(3):
        foreground[:, :, c] = np.where(
            mask,
            np.clip((rgb[:, :, c] - (1.0 - alpha) * k_arr[c]) / np.maximum(alpha, 0.08), 0.0, 255.0),
            0.0
        )

    # 5. Advanced Despill
    if despill:
        cleaned_rgb = apply_advanced_despill(foreground, alpha, key_color, strength=despill_strength)
    else:
        cleaned_rgb = np.clip(foreground, 0.0, 255.0).astype(np.uint8)

    # 6. Compose RGBA
    alpha_uint8 = (alpha * 255.0).astype(np.uint8)
    result_arr = np.dstack([cleaned_rgb, alpha_uint8])
    result_img = Image.fromarray(result_arr, "RGBA")

    # 7. Optional auto-trim / bounding box crop
    if trim:
        bbox = result_img.getbbox()
        if bbox:
            left, top, right, bottom = bbox
            w, h = result_img.size
            crop_left = max(0, left - margin)
            crop_top = max(0, top - margin)
            crop_right = min(w, right + margin)
            crop_bottom = min(h, bottom + margin)
            result_img = result_img.crop((crop_left, crop_top, crop_right, crop_bottom))
            print(f"Trimmed image to bbox: ({crop_left}, {crop_top}, {crop_right}, {crop_bottom})")

    # 8. Save output
    out_dir = os.path.dirname(os.path.abspath(output_path))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    
    ext = os.path.splitext(output_path)[1].lower()
    if ext == ".webp":
        result_img.save(output_path, "WEBP", quality=webp_quality, method=6)
        print(f"Successfully exported transparent WebP cutout: {output_path} ({result_img.width}x{result_img.height}, q={webp_quality})")
    else:
        result_img.save(output_path, "PNG")
        print(f"Successfully exported transparent PNG cutout: {output_path} ({result_img.width}x{result_img.height})")
    
    if export_webp and ext != ".webp":
        webp_path = f"{os.path.splitext(output_path)[0]}.webp"
        result_img.save(webp_path, "WEBP", quality=webp_quality, method=6)
        print(f"Successfully exported companion WebP cutout: {webp_path} ({result_img.width}x{result_img.height}, q={webp_quality})")

    return output_path

# Alias for backwards compatibility
chroma_key = chroma_key_process

def main():
    parser = argparse.ArgumentParser(
        description="High-Precision Multi-Color Chroma Key Studio Engine for Transparent PNG and WebP Extraction"
    )
    parser.add_argument("input", help="Path to input image file (JPEG, PNG, WEBP)")
    parser.add_argument("output", nargs="?", default=None, help="Path to output transparent file (.png or .webp)")
    parser.add_argument(
        "-c", "--color",
        default="auto",
        help="Key color name ('pink', 'magenta', 'green', 'blue', 'cyan', 'yellow', 'white'), hex ('#FF00FF'), or 'auto' (default: auto)",
    )
    parser.add_argument("-t", "--tolerance", type=float, default=48.0, help="Inner distance threshold (default: 48.0)")
    parser.add_argument("-s", "--smoothness", type=float, default=28.0, help="Smooth transition band width (default: 28.0)")
    parser.add_argument("--no-despill", action="store_true", help="Disable edge despill correction")
    parser.add_argument("--despill-strength", type=float, default=0.85, help="Despill strength from 0.0 to 1.0 (default: 0.85)")
    parser.add_argument("--trim", action="store_true", help="Auto-crop transparent margins around subject")
    parser.add_argument("--margin", type=int, default=20, help="Margin padding in pixels when trimming (default: 20)")
    parser.add_argument("--webp", action="store_true", help="Also generate a companion .webp file alongside PNG")
    parser.add_argument("--quality", type=int, default=90, help="WebP compression quality from 1 to 100 (default: 90)")

    args = parser.parse_args()

    input_path = args.input
    output_path = args.output
    if not output_path:
        base, _ = os.path.splitext(input_path)
        output_path = f"{base}_transparent.png"

    key_color = parse_color(args.color)

    chroma_key_process(
        image_path=input_path,
        output_path=output_path,
        key_color=key_color,
        tolerance=args.tolerance,
        smoothness=args.smoothness,
        despill=not args.no_despill,
        despill_strength=args.despill_strength,
        trim=args.trim,
        margin=args.margin,
        export_webp=args.webp,
        webp_quality=args.quality,
    )

if __name__ == "__main__":
    main()


