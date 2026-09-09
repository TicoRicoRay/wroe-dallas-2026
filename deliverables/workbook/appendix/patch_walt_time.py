#!/usr/bin/env python3
"""Patch Walt-Brown-Healthy-Matters-Handout.pdf so the top-of-page time line
reads "11:55 AM – 1:00 PM · Lunch with Walt Brown" (matches agenda + notes page).

Idempotent: reads, patches if needed, writes back in place.
"""
import shutil
from pathlib import Path
import fitz

HERE = Path(__file__).parent
PDF = HERE / "Walt-Brown-Healthy-Matters-Handout.pdf"
CARLITO = "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf"

OLD = "12:00 – 1:00 PM · Lunch with Walt Brown"
NEW = "11:55 AM – 1:00 PM · Lunch with Walt Brown"

def main():
    doc = fitz.open(PDF)
    page = doc[0]
    # find the span
    target = None
    for b in page.get_text("dict")["blocks"]:
        for line in b.get("lines", []):
            for span in line["spans"]:
                if span["text"] == OLD:
                    target = span
                    break
    if target is None:
        # already patched?
        if NEW in page.get_text():
            print("Already patched, no changes.")
            return
        raise SystemExit("Could not find old time string on page 1")

    bbox = fitz.Rect(target["bbox"])
    size = target["size"]
    color_int = target["color"]
    r = ((color_int >> 16) & 0xFF) / 255
    g = ((color_int >> 8) & 0xFF) / 255
    b = (color_int & 0xFF) / 255

    # Proper redaction: removes the old text from the content stream (so
    # copy-paste / extraction won't leak it) and paints the area white.
    redact_rect = fitz.Rect(bbox.x0 - 0.5, bbox.y0 - 0.5, bbox.x1 + 0.5, bbox.y1 + 0.5)
    page.add_redact_annot(redact_rect, fill=(1, 1, 1))
    page.apply_redactions()

    # Insert replacement at same baseline. Use insert_textbox for reliable placement.
    page.insert_font(fontname="Carlito", fontfile=CARLITO)
    tb = fitz.Rect(bbox.x0, bbox.y0, bbox.x0 + 400, bbox.y0 + (bbox.y1 - bbox.y0) + 4)
    rc = page.insert_textbox(
        tb,
        NEW,
        fontname="Carlito",
        fontfile=CARLITO,
        fontsize=size,
        color=(r, g, b),
        align=0,
    )
    if rc < 0:
        raise SystemExit(f"insert_textbox failed rc={rc}")

    tmp = PDF.with_suffix(".pdf.tmp")
    doc.save(tmp, garbage=4, deflate=True)
    doc.close()
    shutil.move(tmp, PDF)
    print(f"Patched OK: {PDF.name}")

if __name__ == "__main__":
    main()
