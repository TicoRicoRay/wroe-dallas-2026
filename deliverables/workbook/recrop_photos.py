#!/usr/bin/env python3
"""Re-crop existing EOSI photos using face detection so faces are centered
and correctly framed. Falls back to top-biased square crop if no face found.
Reads the ORIGINAL URLs from the roster and refetches at full resolution so
we can re-crop from source rather than an already-400x400-square version."""

import json
import os
import re
import urllib.request
import io
from PIL import Image
import cv2
import numpy as np

ROSTER = json.load(open('/home/user/workspace/eosi-directory-work/final_roster.json'))
OUT = '/home/user/workspace/wroe-dallas-2026/deliverables/workbook/assets/eosi'
os.makedirs(OUT, exist_ok=True)

CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def detect_face(pil_img):
    """Return (cx, cy, face_w, face_h) of the largest detected face, or None."""
    cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    faces = CASCADE.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
    )
    if len(faces) == 0:
        return None
    # Largest face
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return (x + w // 2, y + h // 2, w, h)

def smart_crop_square(pil_img):
    """Crop to a square that centers on the face if detectable.
    The face occupies roughly the top-third of the square (standard headshot
    composition), and the square is 3.5x the face height."""
    W, H = pil_img.size
    face = detect_face(pil_img)
    if face is None:
        # Fallback: top-biased square (faces are usually in top 40% of the image)
        s = min(W, H)
        left = (W - s) // 2
        top = int((H - s) * 0.15)  # bias upward
        return pil_img.crop((left, top, left + s, top + s)), 'fallback'

    fx, fy, fw, fh = face
    # Target square side = face height * 3.5 (frames head + shoulders)
    target = int(fh * 3.5)
    # Constrain to fit within image
    target = min(target, W, H)
    # Center square on face horizontally; place face at ~30% from top
    left = fx - target // 2
    top = fy - int(target * 0.30)
    # Snap into bounds
    left = max(0, min(left, W - target))
    top = max(0, min(top, H - target))
    return pil_img.crop((left, top, left + target, top + target)), 'face'

def process(rec):
    photo_url = rec.get('photo_url', '') or ''
    fn_base = slug(rec['name'])
    out_path = os.path.join(OUT, fn_base + '.jpg')
    if not photo_url:
        return (rec['name'], 'no_url', None)
    try:
        req = urllib.request.Request(photo_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read()
        img = Image.open(io.BytesIO(data)).convert('RGB')
        cropped, method = smart_crop_square(img)
        cropped = cropped.resize((400, 400), Image.LANCZOS)
        cropped.save(out_path, 'JPEG', quality=85, optimize=True)
        return (rec['name'], f'ok:{method}', out_path)
    except Exception as e:
        return (rec['name'], f'error: {e}', None)

results = []
for rec in ROSTER:
    r = process(rec)
    results.append(r)
    print(f'  {r[0]:35} {r[1]}')

ok = [r for r in results if r[1].startswith('ok')]
fail = [r for r in results if not r[1].startswith('ok')]
face_count = sum(1 for r in results if r[1] == 'ok:face')
print(f'OK: {len(ok)}/{len(ROSTER)}  (face-detected: {face_count}, fallback: {len(ok)-face_count})')
for name, status, _ in fail:
    print(f'  FAIL: {name} — {status}')

manifest = {name: {'status': status, 'path': path} for (name, status, path) in results}
json.dump(manifest, open(os.path.join(OUT, '_manifest.json'), 'w'), indent=2)
