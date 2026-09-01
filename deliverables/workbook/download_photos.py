#!/usr/bin/env python3
"""Download all EOSI photos for the workbook directory."""
import json
import os
import urllib.request
import re
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import io

ROSTER = json.load(open('/home/user/workspace/eosi-directory-work/final_roster.json'))
OUT = '/home/user/workspace/wroe-dallas-2026/deliverables/workbook/assets/eosi'
os.makedirs(OUT, exist_ok=True)

def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def fetch(rec):
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
        # Resize to a consistent 400x400 square (center crop)
        w, h = img.size
        s = min(w, h)
        left = (w - s) // 2
        top = (h - s) // 2
        img = img.crop((left, top, left + s, top + s))
        img = img.resize((400, 400), Image.LANCZOS)
        img.save(out_path, 'JPEG', quality=85, optimize=True)
        return (rec['name'], 'ok', out_path)
    except Exception as e:
        return (rec['name'], f'error: {e}', None)

with ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(fetch, ROSTER))

ok = [r for r in results if r[1] == 'ok']
fail = [r for r in results if r[1] != 'ok']
print(f'OK: {len(ok)}/{len(ROSTER)}')
for name, status, _ in fail:
    print(f'  FAIL: {name} — {status}')

# Save manifest
manifest = {rec['name']: {'status': status, 'path': path} for (name, status, path), rec in zip(results, ROSTER)}
json.dump(manifest, open(os.path.join(OUT, '_manifest.json'), 'w'), indent=2)
