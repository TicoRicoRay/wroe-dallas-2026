#!/usr/bin/env python3
"""Verify aggregated speaker decks against the Sept 9 status list."""
import os, zipfile, sys
from pathlib import Path

HERE = Path(__file__).parent

# Expected set: speaker -> (filename glob, expected talk, expected source email date, notes)
EXPECTED = [
    ("Shane Spillers",    "Shane_Spillers_*.pptx",  "Opener / We Run on EOS 2026",          None,          "opener"),
    ("Ann Sheu",          "Ann_Sheu_*.pptx",        "Get a Grip on Your Business with EOS", "2026-09-09",  "Google Slides link; expect PPTX export"),
    ("Brian Dosal",       "Brian_Dosal_*.pptx",     "Journey with an EOS Implementer (Strety)", "2026-09-04", "FINAL"),
    ("Mark Stanley",      "Mark_Stanley_*.pptx",    "Profit Power (Animated v1)",           "2026-09-08",  "grayed lower-third for LED backwall"),
    ("Mark C. Winters",   "Mark_Winters_*.pptx",    "10 Pillars of Visionary Greatness",    "2026-09-01",  "forwarded by Shane"),
    ("Beth Fahey",        "Beth_Fahey_*.pptx",      "Rollout, Reworked",                    None,          "Slides link only, no PPTX yet"),
    ("Steve Heroux",      "Steve_Heroux_*.pptx",    "Sponsor slide deck (The Sales Collective)", None,     "promised Sept 4, not delivered"),
    ("Walt Brown",        "Walt_Brown_*.pptx",      "Lunch keynote: Healthy Matters",       None,          "PDFs only, no deck"),
    ("Max Reich",         "Max_Reich_*.pptx",       "The System of Selling",                None,          "no deck received"),
]

def core_modified(path: Path) -> str | None:
    try:
        with zipfile.ZipFile(path) as z:
            core = z.read("docProps/core.xml").decode(errors="ignore")
        import re
        m = re.search(r"<dcterms:modified[^>]*>([^<]+)</dcterms:modified>", core)
        return m.group(1) if m else None
    except Exception as e:
        return f"ERR: {e}"

def slide_count(path: Path) -> int | None:
    try:
        with zipfile.ZipFile(path) as z:
            return sum(1 for n in z.namelist() if n.startswith("ppt/slides/slide") and n.endswith(".xml"))
    except Exception:
        return None

print(f"Scanning {HERE}\n")
print(f"{'Speaker':<20} {'File':<45} {'Slides':<7} {'Modified (UTC)':<22} Note")
print("-" * 120)

for speaker, pattern, talk, expected_date, note in EXPECTED:
    matches = sorted(HERE.glob(pattern))
    if not matches:
        print(f"{speaker:<20} {'MISSING':<45} {'-':<7} {'-':<22} {note or ''}")
        continue
    for m in matches:
        mod = core_modified(m) or "?"
        cnt = slide_count(m)
        flag = ""
        if expected_date and mod and expected_date not in mod:
            flag = f"[mtime≠{expected_date}]"
        print(f"{speaker:<20} {m.name:<45} {str(cnt):<7} {mod:<22} {flag} {note or ''}")

print()
print("Full-day speakers whose decks are still open per Sept 9 status:")
print("  - Steve Heroux (sponsor)")
print("  - Walt Brown (lunch keynote)")
print("  - Max Reich (System of Selling)")
print("  - Beth Fahey (Rollout, Reworked) - Google Slides link only")
