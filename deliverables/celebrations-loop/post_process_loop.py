#!/usr/bin/env python3
"""
Add auto-advance timing and set the whole show to loop (kiosk-friendly).

We modify the raw PPTX (zip of XML) to add:
  1. Per-slide <p:transition> with advTm=<ms> and advClick=0 so PPT auto-advances.
  2. presentation.xml <p:showPr showType="kiosk" loop="1" useTimings="1"/> so
     the file opens in a self-running loop.

pptxgenjs does not expose per-slide auto-advance timings, so this stitch step
is required. Same technique the main event deck's post_build_timings.py uses.
"""
import os
import re
import sys
import shutil
import zipfile
from pathlib import Path

HERE = Path(__file__).parent
SRC  = HERE / 'Celebrations-Loop.pptx'
DST  = HERE / 'Celebrations-Loop.pptx'  # in-place
ADVANCE_SECONDS = 8

# PPT transition durations use milliseconds.
ADV_MS = ADVANCE_SECONDS * 1000

# XML namespaces used in slide files
NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

TRANSITION_XML = (
    f'<p:transition xmlns:p="{NS_P}" spd="med" advClick="0" advTm="{ADV_MS}">'
    '<p:fade/>'
    '</p:transition>'
)

def inject_transition(slide_xml: str) -> str:
    """Insert <p:transition> just before </p:sld>."""
    if 'p:transition' in slide_xml:
        # replace existing
        return re.sub(r'<p:transition\b[^/]*(/>|>.*?</p:transition>)',
                      TRANSITION_XML, slide_xml, count=1, flags=re.DOTALL)
    return slide_xml.replace('</p:sld>', TRANSITION_XML + '</p:sld>')

def enable_kiosk_loop(pres_xml: str) -> str:
    """Set the presentation to run as a self-looping kiosk show."""
    show_pr = (
        '<p:showPr showType="kiosk" loop="1" showNarration="0" showAnimation="1" useTimings="1">'
        '<p:sldAll/><p:penClr><a:srgbClr val="000000"/></p:penClr>'
        '</p:showPr>'
    )
    if '<p:showPr' in pres_xml:
        pres_xml = re.sub(r'<p:showPr\b.*?</p:showPr>', show_pr, pres_xml, count=1, flags=re.DOTALL)
        pres_xml = re.sub(r'<p:showPr\b[^/]*/>', show_pr, pres_xml, count=1)
    else:
        # Insert before <p:defaultTextStyle> or before </p:presentation>
        if '<p:defaultTextStyle' in pres_xml:
            pres_xml = pres_xml.replace('<p:defaultTextStyle', show_pr + '<p:defaultTextStyle', 1)
        else:
            pres_xml = pres_xml.replace('</p:presentation>', show_pr + '</p:presentation>')
    return pres_xml

def main():
    if not SRC.exists():
        print(f"ERROR: {SRC} does not exist. Run build_loop.js first.", file=sys.stderr)
        sys.exit(1)

    tmp = SRC.with_suffix('.tmp.pptx')
    slide_pattern = re.compile(r'^ppt/slides/slide\d+\.xml$')

    with zipfile.ZipFile(SRC, 'r') as zin:
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
            slide_count = 0
            for item in zin.infolist():
                data = zin.read(item.filename)
                if slide_pattern.match(item.filename):
                    text = data.decode('utf-8')
                    new_text = inject_transition(text)
                    data = new_text.encode('utf-8')
                    slide_count += 1
                elif item.filename == 'ppt/presentation.xml':
                    text = data.decode('utf-8')
                    new_text = enable_kiosk_loop(text)
                    data = new_text.encode('utf-8')
                zout.writestr(item, data)

    shutil.move(tmp, DST)
    print(f"Wrote {DST}")
    print(f"  slides with auto-advance ({ADVANCE_SECONDS}s each): {slide_count}")
    print(f"  presentation set to kiosk loop mode")

if __name__ == '__main__':
    main()
