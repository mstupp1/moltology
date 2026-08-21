#!/usr/bin/env python3
"""
Unit tests for chroma_key.py engine
"""

import sys
import os
import tempfile
import unittest
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chroma_key import parse_color, auto_detect_key_color, chroma_key_process

class TestChromaKey(unittest.TestCase):
    def test_parse_color(self):
        self.assertEqual(parse_color("pink"), (255, 0, 255))
        self.assertEqual(parse_color("magenta"), (255, 0, 255))
        self.assertEqual(parse_color("green"), (0, 255, 0))
        self.assertEqual(parse_color("blue"), (0, 0, 255))
        self.assertEqual(parse_color("#FF00FF"), (255, 0, 255))
        self.assertEqual(parse_color("255, 105, 180"), (255, 105, 180))
        self.assertIsNone(parse_color("auto"))

    def test_auto_detect_key_color(self):
        # Create image with solid magenta border and blue box in center
        arr = np.zeros((100, 100, 3), dtype=np.uint8)
        arr[:, :] = [255, 0, 255] # Magenta bg
        arr[30:70, 30:70] = [0, 200, 255] # Cyan subject
        detected = auto_detect_key_color(arr)
        self.assertEqual(detected, (255, 0, 255))

    def test_chroma_key_process_synthetic(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            in_path = os.path.join(tmpdir, "test_input.png")
            out_path = os.path.join(tmpdir, "test_output.png")

            # Create test image: 100x100 magenta background with 40x40 cyan circle in middle
            arr = np.zeros((100, 100, 3), dtype=np.uint8)
            arr[:, :] = [255, 0, 255] # Magenta bg
            arr[30:70, 30:70] = [0, 220, 220] # Cyan subject

            Image.fromarray(arr).save(in_path)

            chroma_key_process(in_path, out_path, key_color=(255, 0, 255), tolerance=40, smoothness=20, trim=True)

            self.assertTrue(os.path.exists(out_path))
            res_img = Image.open(out_path)
            res_arr = np.array(res_img)

            # Check alpha: center should be opaque (alpha > 200), corners should be transparent
            self.assertEqual(res_img.mode, "RGBA")
            self.assertGreater(res_arr[res_arr.shape[0]//2, res_arr.shape[1]//2, 3], 200)

if __name__ == "__main__":
    unittest.main()
