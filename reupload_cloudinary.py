#!/usr/bin/env python3
import os
import requests
import time
from pathlib import Path

CLOUD_NAME = "dxy9t8qur"
API_KEY = "257426573219784"
UPLOAD_PRESET = "cube_gallery"

BASE_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
DELETE_URL = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/resources/image/upload"

images_dir = Path(".")
image_files = sorted([f for f in images_dir.glob("face-*.webp")])

print(f"Uploading {len(image_files)} images with cache bust...\n")

# Add timestamp to force fresh upload
timestamp = int(time.time())

for img_path in image_files:
    filename = img_path.name
    public_id = f"cube-gallery/{filename.replace('.webp', '')}"

    with open(img_path, 'rb') as f:
        files = {'file': f}
        data = {
            'api_key': API_KEY,
            'public_id': public_id,
            'upload_preset': UPLOAD_PRESET
        }

        response = requests.post(BASE_URL, files=files, data=data)

        if response.status_code in [200, 201]:
            result = response.json()
            url = result['secure_url']
            print(f"[OK] {filename}")
            print(f"     {url}\n")
        else:
            print(f"[FAIL] {filename}: {response.text}\n")
