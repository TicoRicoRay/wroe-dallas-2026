#!/usr/bin/env python3
"""
Overlay consistent page numbers on Workbook.pdf.

Runs AFTER splice_handouts.py, so it sees the final page order (Word
pages + spliced-in presenter handouts) and paints "Page N of TOTAL" on
every page except the cover.

Placement is per-page:
- Workbook pages (Word-generated, contain 'WRoEOS North Texas 2026'
  in the running header): TOP CENTER.
- Handout pages (spliced from appendix/, no workbook running header):
  BOTTOM RIGHT, so we don't collide with presenter-branded top bars,
  logos, or copyright footers.

Uses reportlab to build a same-size overlay PDF, then pypdf to merge.

Font: Helvetica 9pt, color #7A7974 (text muted from Nexus palette,
matches the workbook's own muted-text color used elsewhere).
"""
import io
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

WORKBOOK_DIR = Path(__file__).parent
WORKBOOK_PDF = WORKBOOK_DIR / "Workbook.pdf"

# Design token — matches the muted grey used in the workbook body.
PAGENUM_COLOR = HexColor("#7A7974")
PAGENUM_FONT = "Helvetica"
PAGENUM_SIZE = 9
PAGENUM_TOP_MARGIN_PT = 22   # ~ 0.3" down from top edge

# Pages to skip (1-indexed).
# Page 1 is the cover — no page number.
SKIP_PAGES = {1}

# Marker string that identifies a workbook (Word-generated) page.
# Every workbook page except the cover has this in its running header.
WORKBOOK_HEADER_MARKER = "WRoEOS North Texas 2026"


def build_overlay(page_num: int, total: int, width: float, height: float) -> bytes:
    """Return a single-page PDF (as bytes) with 'Page N of TOTAL' at top center."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(width, height))
    c.setFont(PAGENUM_FONT, PAGENUM_SIZE)
    c.setFillColor(PAGENUM_COLOR)
    text = f"Page {page_num} of {total}"
    text_width = c.stringWidth(text, PAGENUM_FONT, PAGENUM_SIZE)
    x = (width - text_width) / 2
    y = height - PAGENUM_TOP_MARGIN_PT - PAGENUM_SIZE
    c.drawString(x, y, text)
    c.save()
    return buf.getvalue()


def main() -> int:
    if not WORKBOOK_PDF.exists():
        print(f"error: {WORKBOOK_PDF} not found", file=sys.stderr)
        return 1

    reader = PdfReader(str(WORKBOOK_PDF))
    total = len(reader.pages)
    print(f"paginate: {total} pages")

    writer = PdfWriter()
    stamped = 0
    for i, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        is_workbook = WORKBOOK_HEADER_MARKER in page_text
        if i not in SKIP_PAGES and is_workbook:
            w = float(page.mediabox.width)
            h = float(page.mediabox.height)
            overlay_bytes = build_overlay(i, total, w, h)
            overlay_reader = PdfReader(io.BytesIO(overlay_bytes))
            page.merge_page(overlay_reader.pages[0])
            stamped += 1
        writer.add_page(page)

    with WORKBOOK_PDF.open("wb") as f:
        writer.write(f)

    print(f"OK -> {WORKBOOK_PDF.name} ({total} pages, page numbers overlaid on {stamped} workbook pages; handouts left untouched)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
