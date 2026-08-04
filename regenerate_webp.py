#!/usr/bin/env python3
from PIL import Image
from pathlib import Path

images_dir = Path(".")

# Find all jpg files
jpg_files = sorted([f for f in images_dir.glob("face-*.jpg") if not f.name.endswith("-dark.jpg")])

print(f"Regenerating {len(jpg_files)} webp images from JPG originals...\n")

for jpg_path in jpg_files:
    webp_path = jpg_path.with_suffix(".webp")

    # Open JPG with exact color profile
    img = Image.open(jpg_path)

    # Convert to RGB if needed (preserve colors exactly)
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Save as webp with maximum quality (100) to preserve colors
    img.save(webp_path, "webp", quality=100, method=6)

    jpg_size = jpg_path.stat().st_size / 1024
    webp_size = webp_path.stat().st_size / 1024

    print(f"[OK] {jpg_path.name} ({jpg_size:.0f}K) -> {webp_path.name} ({webp_size:.0f}K)")

print("\n[Done] All webp files regenerated with original colors!")
