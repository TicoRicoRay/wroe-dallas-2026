#!/usr/bin/env python3
"""
Splice presenter handout PDFs into Workbook.pdf.

Each handout is inserted directly after its speaker's SESSION cover page,
before that session's MY NOTES page. The SESSION cover is the natural
anchor — it uniquely identifies the session via the presenter's name.

Input:  Workbook.pdf (Word export)
Output: Workbook.pdf (rewritten in place, with appendix pages spliced in)
"""
import re
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter

WORKBOOK_DIR = Path(__file__).parent
WORKBOOK_PDF = WORKBOOK_DIR / "Workbook.pdf"

# (anchor_text_on_session_cover, handout_pdf_path)
# The anchor must uniquely identify the SESSION cover page. We use
# "PRESENTED BY" + speaker name — both strings appear together on the
# session cover and nowhere else in the workbook.
HANDOUTS = [
    (
        "PRESENTED BY MARK STANLEY",
        WORKBOOK_DIR / "appendix" / "Profit-Power-Handout.pdf",
    ),
    (
        "PRESENTED BY MARK C. WINTERS",
        WORKBOOK_DIR / "appendix" / "10-Pillars-Handout.pdf",
    ),
]


def find_page_index(reader: PdfReader, needle: str) -> int:
    """Return the 0-indexed page number whose extracted text contains needle."""
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        # normalize whitespace so line breaks inside the anchor don't defeat us
        norm = re.sub(r"\s+", " ", text).upper()
        if needle.upper() in norm:
            return i
    raise RuntimeError(f"Could not find session cover page containing: {needle}")


def main() -> int:
    if not WORKBOOK_PDF.exists():
        print(f"error: {WORKBOOK_PDF} not found", file=sys.stderr)
        return 1

    reader = PdfReader(str(WORKBOOK_PDF))
    n_pages = len(reader.pages)
    print(f"Workbook.pdf: {n_pages} pages")

    # Resolve insertion points BEFORE splicing (indices are stable in the source).
    inserts = []  # list of (source_index, handout_pdf_path)
    for anchor, handout_path in HANDOUTS:
        if not handout_path.exists():
            print(f"error: handout not found: {handout_path}", file=sys.stderr)
            return 1
        idx = find_page_index(reader, anchor)
        print(f"  found '{anchor}' at page {idx + 1}")
        inserts.append((idx, handout_path))

    # Sort ascending so we can walk pages once.
    inserts.sort(key=lambda t: t[0])

    writer = PdfWriter()
    insert_ptr = 0
    for i in range(n_pages):
        writer.add_page(reader.pages[i])
        if insert_ptr < len(inserts) and inserts[insert_ptr][0] == i:
            handout_path = inserts[insert_ptr][1]
            h_reader = PdfReader(str(handout_path))
            for h_page in h_reader.pages:
                writer.add_page(h_page)
            print(f"  spliced {len(h_reader.pages)} page(s) from {handout_path.name} after page {i + 1}")
            insert_ptr += 1

    out_path = WORKBOOK_PDF
    with out_path.open("wb") as f:
        writer.write(f)

    final_reader = PdfReader(str(out_path))
    print(f"OK -> {out_path.name} ({len(final_reader.pages)} pages)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
