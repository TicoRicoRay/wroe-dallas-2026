#!/usr/bin/env python3
"""Post-build: inject 15-second auto-advance timing into slides 1-5 of Deck.pptx.

pptxgenjs 4.0.1 has no API for per-slide advance timings, so we edit the OOXML directly.

We add <p:transition spd="med" advTm="15000"><p:fade/></p:transition> between
</p:cSld> and <p:clrMapOvr/> in slides 1-5. The advTm attribute is milliseconds
until auto-advance. We keep click-advance enabled by NOT setting advClick="0",
so an emcee can also click through if needed.
"""
import shutil
import sys
import zipfile
from pathlib import Path

DECK = Path(__file__).parent / "Deck.pptx"
AUTO_ADVANCE_SLIDES = [1, 2, 3, 4, 5]  # pre-event loop
ADVANCE_MS = 15000

TRANSITION = (
    '<p:transition spd="med" advTm="{ms}">'
    '<p:fade/>'
    '</p:transition>'
).format(ms=ADVANCE_MS)


def patch_slide_xml(xml: str) -> str:
    if "<p:transition" in xml:
        return xml  # already has transition; leave alone
    marker = "</p:cSld>"
    idx = xml.find(marker)
    if idx == -1:
        raise ValueError("no </p:cSld> found")
    insert_at = idx + len(marker)
    return xml[:insert_at] + TRANSITION + xml[insert_at:]


def main():
    if not DECK.exists():
        sys.exit(f"missing {DECK}")

    tmp = DECK.with_suffix(".pptx.tmp")
    with zipfile.ZipFile(DECK, "r") as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            slide_num = None
            if item.filename.startswith("ppt/slides/slide") and item.filename.endswith(".xml"):
                try:
                    slide_num = int(item.filename[len("ppt/slides/slide"):-len(".xml")])
                except ValueError:
                    slide_num = None
            if slide_num in AUTO_ADVANCE_SLIDES:
                xml = data.decode("utf-8")
                patched = patch_slide_xml(xml)
                data = patched.encode("utf-8")
                print(f"  auto-advance {ADVANCE_MS}ms -> slide {slide_num}")
            zout.writestr(item, data)

    shutil.move(str(tmp), str(DECK))
    print(f"Patched {len(AUTO_ADVANCE_SLIDES)} slides in {DECK.name}")


if __name__ == "__main__":
    main()
