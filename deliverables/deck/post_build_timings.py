#!/usr/bin/env python3
"""Post-build: inject auto-advance timings and Custom Shows into Deck.pptx.

pptxgenjs 4.0.1 has no API for either, so we edit the OOXML directly.

1. Per-slide auto-advance on slides 1-5 (pre-event loop):
   Add <p:transition spd="med" advTm="15000"><p:fade/></p:transition> between
   </p:cSld> and <p:clrMapOvr/> in each of those slide XMLs.

2. Two Custom Shows in ppt/presentation.xml:
     - "Pre-Event Loop" (slides 1-5)
     - "Event"          (slides 6-N, where N is the last slide of the deck)
   Insert <p:custShowLst>...</p:custShowLst> after </p:sldIdLst>.
   Slides are referenced by the r:id values found in the sldIdLst mapping.
"""
import re
import shutil
import sys
import zipfile
from pathlib import Path

DECK = Path(__file__).parent / "Deck.pptx"
AUTO_ADVANCE_SLIDES = [1, 2, 3, 4, 5]  # pre-event loop
ADVANCE_MS = 15000

# Second show goes from slide 6 to the last slide (computed at runtime from sldIdLst)
PRE_EVENT_SLIDES = list(range(1, 6))  # 1-5
EVENT_START_SLIDE = 6

TRANSITION = (
    '<p:transition spd="med" advTm="{ms}">'
    '<p:fade/>'
    '</p:transition>'
).format(ms=ADVANCE_MS)


def patch_slide_xml(xml: str) -> str:
    if "<p:transition" in xml:
        return xml
    marker = "</p:cSld>"
    idx = xml.find(marker)
    if idx == -1:
        raise ValueError("no </p:cSld> found")
    insert_at = idx + len(marker)
    return xml[:insert_at] + TRANSITION + xml[insert_at:]


def parse_slide_id_to_rid(pres_xml: str) -> dict:
    """Return {slide_position: rId} from <p:sldIdLst>. Position is 1-based order."""
    match = re.search(r"<p:sldIdLst>(.*?)</p:sldIdLst>", pres_xml, re.S)
    if not match:
        raise ValueError("no sldIdLst found")
    inner = match.group(1)
    rids = re.findall(r'r:id="(rId\d+)"', inner)
    return {i + 1: rid for i, rid in enumerate(rids)}


def build_custom_show_xml(pres_xml: str) -> str:
    pos_to_rid = parse_slide_id_to_rid(pres_xml)
    total = len(pos_to_rid)
    shows = [
        ("Pre-Event Loop", PRE_EVENT_SLIDES),
        ("Event",          list(range(EVENT_START_SLIDE, total + 1))),
    ]
    parts = ["<p:custShowLst>"]
    for idx, (name, positions) in enumerate(shows):
        parts.append(f'<p:custShow name="{name}" id="{idx}">')
        parts.append("<p:sldLst>")
        for p in positions:
            rid = pos_to_rid[p]
            parts.append(f'<p:sld r:id="{rid}"/>')
        parts.append("</p:sldLst>")
        parts.append("</p:custShow>")
    parts.append("</p:custShowLst>")
    print(f"  custom shows: Pre-Event Loop (1-{max(PRE_EVENT_SLIDES)}), Event ({EVENT_START_SLIDE}-{total})")
    return "".join(parts)


def patch_presentation_xml(xml: str) -> str:
    # Remove any existing custShowLst first
    xml = re.sub(r"<p:custShowLst>.*?</p:custShowLst>", "", xml, flags=re.S)
    cs_xml = build_custom_show_xml(xml)
    marker = "</p:sldIdLst>"
    idx = xml.find(marker)
    if idx == -1:
        raise ValueError("no </p:sldIdLst> in presentation.xml")
    insert_at = idx + len(marker)
    return xml[:insert_at] + cs_xml + xml[insert_at:]


def main():
    if not DECK.exists():
        sys.exit(f"missing {DECK}")

    tmp = DECK.with_suffix(".pptx.tmp")
    slides_patched = 0
    pres_patched = False
    with zipfile.ZipFile(DECK, "r") as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "ppt/presentation.xml":
                xml = data.decode("utf-8")
                patched = patch_presentation_xml(xml)
                data = patched.encode("utf-8")
                pres_patched = True
            else:
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
                    slides_patched += 1
                    print(f"  auto-advance {ADVANCE_MS}ms -> slide {slide_num}")
            zout.writestr(item, data)

    if not pres_patched:
        sys.exit("presentation.xml not found in .pptx")

    shutil.move(str(tmp), str(DECK))
    print(f"Patched {slides_patched} slides + custom shows in {DECK.name}")


if __name__ == "__main__":
    main()
