#!/usr/bin/env python3
"""
Overlay page numbers on Workbook.pdf.

Runs AFTER splice_handouts.py so it sees the final page order (Word
pages + spliced-in presenter handouts) and paints the page number in
the BOTTOM-RIGHT corner of every workbook page except the cover.
Only the number is drawn — no "of N" suffix.

Handout pages (spliced from appendix/) are left untouched.

Font: Helvetica 9pt, color #7A7974 (text muted from Nexus palette).
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
PAGENUM_MARGIN_PT = 36   # ~ 0.5" from the right/bottom edges

# Pages to skip (1-indexed).
# Page 1 is the cover — no page number.
SKIP_PAGES = {1}

# Marker string that identifies a workbook (Word-generated) page.
# Every workbook page except the cover has this in its running header.
# Header is now two lines: "We Run ON EOS®" / "North Texas 2026".
# We match on the second (stable) line so a stray glyph in the first
# doesn't defeat detection.
WORKBOOK_HEADER_MARKER = "North Texas 2026"


def build_overlay(page_num: int, total: int, width: float, height: float) -> bytes:
    """Return a single-page PDF (as bytes) with just the page number in the bottom-right corner."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(width, height))
    c.setFont(PAGENUM_FONT, PAGENUM_SIZE)
    c.setFillColor(PAGENUM_COLOR)
    text = str(page_num)
    text_width = c.stringWidth(text, PAGENUM_FONT, PAGENUM_SIZE)
    x = width - PAGENUM_MARGIN_PT - text_width
    y = PAGENUM_MARGIN_PT
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
