#!/usr/bin/env python3
"""
Splice presenter handout PDFs into Workbook.pdf.

Each session in SPEAKER_SESSIONS with a `handout` gets its handout PDF
inserted after the session's own HANDOUT lead-in page, before the MY NOTES
page.

Currently, only Mark C. Winters' session has a handout. This script is
generic — it walks the workbook's text pages to find the correct insertion
point via the "· HANDOUT" heading on the lead-in page.

Input:  Workbook.pdf (Word export)
Output: Workbook.pdf (rewritten in place, with appendix pages spliced in)
"""
import re
import sys
from pathlib import Path

from pypdf import PdfReader, PdfWriter

WORKBOOK_DIR = Path(__file__).parent
WORKBOOK_PDF = WORKBOOK_DIR / "Workbook.pdf"

# (heading_text_substring_on_leadin_page, handout_pdf_path)
# The heading substring must uniquely identify the session's HANDOUT lead-in
# page (page immediately following the SESSION cover). We match on the
# session_title.upper() + " · HANDOUT" string emitted by build_workbook.js.
HANDOUTS = [
    (
        "THE 10 PILLARS OF VISIONARY GREATNESS · HANDOUT",
        WORKBOOK_DIR / "appendix" / "10-Pillars-Handout.pdf",
    ),
]


def find_page_index(reader: PdfReader, needle: str) -> int:
    """Return the 0-indexed page number whose extracted text contains needle."""
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        # normalize whitespace so line breaks inside the heading don't defeat us
        norm = re.sub(r"\s+", " ", text).upper()
        if needle.upper() in norm:
            return i
    raise RuntimeError(f"Could not find lead-in page containing: {needle}")


def main() -> int:
    if not WORKBOOK_PDF.exists():
        print(f"error: {WORKBOOK_PDF} not found", file=sys.stderr)
        return 1

    reader = PdfReader(str(WORKBOOK_PDF))
    n_pages = len(reader.pages)
    print(f"Workbook.pdf: {n_pages} pages")

    # Resolve insertion points BEFORE splicing (indices are stable in the source).
    inserts = []  # list of (source_index, handout_pdf_path)
    for heading, handout_path in HANDOUTS:
        if not handout_path.exists():
            print(f"error: handout not found: {handout_path}", file=sys.stderr)
            return 1
        idx = find_page_index(reader, heading)
        print(f"  found '{heading}' at page {idx + 1}")
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
