#!/usr/bin/env python3
from PIL import Image, ImageEnhance
import os
from pathlib import Path

images_dir = Path(".")

for i in range(12):
    src = images_dir / f"face-{i}.webp"
    dst = images_dir / f"face-{i}-dark.webp"

    if not src.exists():
        print(f"[!] {src} not found, skipping")
        continue

    # Open image
    img = Image.open(src)

    # Increase contrast
    contrast = ImageEnhance.Contrast(img)
    img = contrast.enhance(1.15)

    # Increase saturation
    color = ImageEnhance.Color(img)
    img = color.enhance(1.1)

    # Slight brightness boost for dark backgrounds
    brightness = ImageEnhance.Brightness(img)
    img = brightness.enhance(1.05)

    # Save as webp with optimized quality
    img.save(dst, "webp", quality=85, method=6)

    # Get file sizes
    src_size = src.stat().st_size / 1024
    dst_size = dst.stat().st_size / 1024

    print(f"[OK] {src.name} -> {dst.name} ({src_size:.0f}K -> {dst_size:.0f}K)")

print("\n[Done] All dark versions generated successfully!")
