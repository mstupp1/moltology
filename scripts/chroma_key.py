#!/usr/bin/env python3
"""
High-Precision Chroma Keying (Green Screen to Transparent PNG)
Extracts subjects on pure green backgrounds with soft alpha edges and despill.
"""

import sys
import os
import math
from PIL import Image

def rgb_to_hsv(r, g, b):
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx - mn
    if mx == mn:
        h = 0
    elif mx == r:
        h = (60 * ((g - b) / df) + 360) % 360
    elif mx == g:
        h = (60 * ((b - r) / df) + 120) % 360
    elif mx == b:
        h = (60 * ((r - g) / df) + 240) % 360
    s = 0 if mx == 0 else (df / mx)
    v = mx
    return h, s, v

def chroma_key(image_path, output_path, green_hue_min=75, green_hue_max=165, sat_min=0.25, val_min=0.20, softness=0.15):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            h, s, v = rgb_to_hsv(r, g, b)
            
            # Check if within green spectrum
            if green_hue_min <= h <= green_hue_max and s >= sat_min and v >= val_min:
                # Calculate distance from center of green hue (~120 deg)
                hue_dist = abs(h - 120) / 45.0  # 0 at pure green (120), ~1 at boundary
                
                # Check how dominant green is compared to red & blue
                green_dominance = g - max(r, b)
                
                if green_dominance > 30 and hue_dist < 0.85:
                    # Definite green background
                    pixels[x, y] = (r, g, b, 0)
                elif green_dominance > 0:
                    # Semi-transparent edge falloff
                    alpha_factor = max(0.0, min(1.0, 1.0 - (green_dominance / 60.0)))
                    new_a = int(255 * alpha_factor)
                    # Despill: clamp green channel to prevent green halo
                    new_g = min(g, max(r, b))
                    pixels[x, y] = (r, new_g, b, new_a)
                else:
                    # Edge despill
                    new_g = min(g, max(r, b))
                    pixels[x, y] = (r, new_g, b, 255)
            else:
                # Also do subtle despill if green is significantly higher than red/blue
                if g > max(r, b) + 15:
                    new_g = int((r + b) / 2)
                    pixels[x, y] = (r, new_g, b, a)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"Successfully saved transparent PNG: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 chroma_key.py <input_image> <output_image>")
        sys.exit(1)
    chroma_key(sys.argv[1], sys.argv[2])
