#!/usr/bin/env python3
"""Fetch each implementer photo from the roster, detect the face, crop to a
square headshot (face at ~30% from top, side = face_h * 3.5), and save to
eosi-directory/photos/<slug>.jpg at 400x400. Fallback: top-biased square."""

import json, os, re, io, urllib.request, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import cv2
import numpy as np

ROSTER = json.load(open('/tmp/roster.json'))
OUT = '/home/user/workspace/wroe-dallas-2026/eosi-directory/photos'
os.makedirs(OUT, exist_ok=True)

CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def detect_face(pil_img):
    cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    faces = CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return (x + w // 2, y + h // 2, w, h)

def smart_crop_square(pil_img):
    W, H = pil_img.size
    face = detect_face(pil_img)
    if face is None:
        s = min(W, H)
        left = (W - s) // 2
        top = int((H - s) * 0.15)
        return pil_img.crop((left, top, left + s, top + s)), 'fallback'
    fx, fy, fw, fh = face
    target = int(fh * 3.5)
    target = min(target, W, H)
    left = fx - target // 2
    top = fy - int(target * 0.30)
    left = max(0, min(left, W - target))
    top = max(0, min(top, H - target))
    return pil_img.crop((left, top, left + target, top + target)), 'face'

def process(rec):
    name = rec['name']
    photo_url = rec.get('photo_url', '') or ''
    fn_base = slug(name)
    out_path = os.path.join(OUT, fn_base + '.jpg')
    # Skip Shane Spillers — already has a locally curated photo
    if photo_url.startswith('photos/'):
        return (name, 'skip_local', photo_url)
    if not photo_url:
        return (name, 'no_url', None)
    try:
        req = urllib.request.Request(photo_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=25) as r:
            data = r.read()
        img = Image.open(io.BytesIO(data)).convert('RGB')
        src_size = img.size
        cropped, method = smart_crop_square(img)
        cropped = cropped.resize((400, 400), Image.LANCZOS)
        cropped.save(out_path, 'JPEG', quality=85, optimize=True)
        return (name, f'ok:{method}', f'photos/{fn_base}.jpg', src_size)
    except Exception as e:
        return (name, f'error: {e}', None)

# Serial: cv2 detectMultiScale segfaults under threads in this sandbox
results = []
for rec in ROSTER:
    r = process(rec)
    print(f'  ~ {r[0]}: {r[1]}', flush=True)
    results.append(r)

ok = [r for r in results if r[1].startswith('ok')]
face_count = sum(1 for r in results if r[1] == 'ok:face')
fallback_count = sum(1 for r in results if r[1] == 'ok:fallback')
fail = [r for r in results if not (r[1].startswith('ok') or r[1] == 'skip_local' or r[1] == 'no_url')]
skip = [r for r in results if r[1] == 'skip_local' or r[1] == 'no_url']

print(f'OK: {len(ok)}/{len(ROSTER)}  (face: {face_count}, fallback: {fallback_count})')
print(f'Skip: {len(skip)}')
for name, status, *rest in skip:
    print(f'  SKIP: {name} — {status}')
print(f'Fail: {len(fail)}')
for name, status, *rest in fail:
    print(f'  FAIL: {name} — {status}')

# Save manifest so we know what got the fallback (for review)
manifest = {}
for r in results:
    name = r[0]; status = r[1]; path = r[2] if len(r) > 2 else None
    manifest[name] = {'status': status, 'local_path': path, 'slug': slug(name)}
json.dump(manifest, open('/tmp/crop_manifest.json', 'w'), indent=2)
print('Manifest -> /tmp/crop_manifest.json')
