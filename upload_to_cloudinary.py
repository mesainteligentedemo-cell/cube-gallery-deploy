#!/usr/bin/env python3
import os
import requests
from pathlib import Path

# Cloudinary credentials
CLOUD_NAME = "dxy9t8qur"
API_KEY = "257426573219784"
UPLOAD_PRESET = "cube_gallery"  # Already created

# First, let's try uploading with API Key directly
BASE_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"

images_dir = Path(".")
image_files = sorted([f for f in images_dir.glob("face-*.webp")])

print(f"Uploading {len(image_files)} images to Cloudinary...")
print(f"Cloud Name: {CLOUD_NAME}\n")

uploaded = []

for img_path in image_files:
    filename = img_path.name

    # Upload to Cloudinary
    with open(img_path, 'rb') as f:
        files = {'file': f}
        data = {
            'api_key': API_KEY,
            'public_id': filename.replace('.webp', ''),
            'folder': 'cube-gallery'
        }

        # Use upload preset for unsigned upload
        data['upload_preset'] = UPLOAD_PRESET
        response = requests.post(BASE_URL, files=files, data=data)

        if response.status_code in [200, 201]:
            result = response.json()
            url = result['secure_url']
            uploaded.append((filename, url))
            print(f"[OK] {filename}")
            print(f"     URL: {url}\n")
        else:
            print(f"[FAIL] {filename}")
            print(f"       Error: {response.text}\n")

print("\n" + "="*60)
print("Generated URLs for index.html:")
print("="*60 + "\n")

for filename, url in uploaded:
    print(f'      "{url}",')

print("\n" + "="*60)
print(f"Total: {len(uploaded)}/{len(image_files)} uploaded successfully")
print("="*60)
