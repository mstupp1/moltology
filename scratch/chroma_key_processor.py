import sys
import os
import math
from PIL import Image

def chroma_key(input_path, output_path, key_color=(0, 255, 0), similarity_threshold=60, smoothness=35):
    if not os.path.exists(input_path):
        print(f"Error: Input file {input_path} does not exist.")
        return False

    print(f"Processing chroma key (pure PIL) for {input_path} -> {output_path}...")
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    kr, kg, kb = key_color

    thresh_sq = similarity_threshold ** 2
    smooth_sq = (similarity_threshold + smoothness) ** 2

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            dist_sq = (r - kr)**2 + (g - kg)**2 + (b - kb)**2

            if dist_sq < thresh_sq:
                pixels[x, y] = (r, g, b, 0)
            elif dist_sq < smooth_sq:
                dist = math.sqrt(dist_sq)
                alpha = int(((dist - similarity_threshold) / smoothness) * 255)
                new_g = g
                if kg > kr and kg > kb and g > (r + b) / 2:
                    new_g = int((r + b) / 2)
                pixels[x, y] = (r, new_g, b, max(0, min(255, alpha)))
            else:
                new_g = g
                if kg > kr and kg > kb and g > r + 20 and g > b + 20 and dist_sq < smooth_sq * 2.5:
                    new_g = int((r + b) / 2)
                pixels[x, y] = (r, new_g, b, a)

    img.save(output_path, "PNG")
    print(f"Successfully saved transparent PNG: {output_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 chroma_key_processor.py <input_file> <output_file> [key_r key_g key_b]")
        sys.exit(1)

    inp = sys.argv[1]
    outp = sys.argv[2]
    key_col = (0, 255, 0)
    if len(sys.argv) >= 6:
        key_col = (int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]))

    chroma_key(inp, outp, key_color=key_col)
