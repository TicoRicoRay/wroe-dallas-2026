#!/usr/bin/env python3
"""Generate QR-code PNGs for sponsor URLs and EOSI profile URLs.

Outputs to assets/qr/*.png with a manifest at assets/qr/_manifest.json.
Uses medium error correction and a small quiet zone so the code stays
readable at ~60-90px in print.
"""
import json
import re
import os
import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M

HERE = Path(__file__).parent
QR_DIR = HERE / "assets" / "qr"
QR_DIR.mkdir(parents=True, exist_ok=True)

# 1) Sponsors from config.js
CONFIG_JS = (HERE.parent.parent / "config.js").read_text()
m = re.search(r"sponsors:\s*\[(.*?)\n\s*\]\s*,\s*\}", CONFIG_JS, re.DOTALL)
# Simpler: eval-lite via node
import subprocess
sponsors_json = subprocess.check_output(
    ["node", "-e",
     "const fs=require('fs');let SITE_CONFIG;eval(fs.readFileSync('"
     + str(HERE.parent.parent / 'config.js') + "','utf8').replace(/const SITE_CONFIG/,'SITE_CONFIG'));"
     "process.stdout.write(JSON.stringify(SITE_CONFIG.sponsors.sponsors.filter(s=>s.verified)))"]
).decode()
sponsors = json.loads(sponsors_json)

# 2) EOSI roster
ROSTER = json.loads(Path("/home/user/workspace/eosi-directory-work/final_roster.json").read_text())


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def make_qr(url: str, out_path: Path) -> None:
    q = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    q.add_data(url)
    q.make(fit=True)
    img = q.make_image(fill_color="black", back_color="white")
    # normalize to ~300px so downstream sizing is predictable
    img = img.resize((300, 300))
    img.save(out_path)


manifest = {"sponsors": {}, "eosi": {}}

# Sponsors
for s in sponsors:
    if not s.get("url"):
        continue
    slug = slugify(s["name"])
    out = QR_DIR / f"sponsor-{slug}.png"
    make_qr(s["url"], out)
    manifest["sponsors"][s["name"]] = {"path": str(out.relative_to(HERE)), "url": s["url"]}

# EOSI (prefer profile_url; fall back to mailto:email)
for r in ROSTER:
    url = r.get("profile_url") or (f"mailto:{r['email']}" if r.get("email") else None)
    if not url:
        continue
    slug = slugify(r["name"])
    out = QR_DIR / f"eosi-{slug}.png"
    make_qr(url, out)
    manifest["eosi"][r["name"]] = {"path": str(out.relative_to(HERE)), "url": url}

(QR_DIR / "_manifest.json").write_text(json.dumps(manifest, indent=2))
print(f"OK -> {len(manifest['sponsors'])} sponsor QRs, {len(manifest['eosi'])} EOSI QRs")
