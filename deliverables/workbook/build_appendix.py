#!/usr/bin/env python3
"""Append Beth Fahey's Rollout PDFs to Workbook.pdf as an appendix.

Reads the freshly-built Workbook.pdf and the three ROLLOUT-* PDFs from
inbox-materials/workbook/beth_fahey/, generates a lightweight divider page
matching the workbook style, and writes Workbook-Full.pdf back to
deliverables/workbook/.

Run after `build_workbook.js` + `soffice --convert-to pdf`.
"""
from pathlib import Path
import pypdf
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer,
)
import io
import urllib.request

# ---------- Fonts (reuse AV sheet cache) ----------
FONTS_DIR = Path("/tmp/av_fonts")
FONTS_DIR.mkdir(exist_ok=True)
FONT_URLS = {
    "DMSans-Regular": "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Regular.ttf",
    "DMSans-Medium":  "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Medium.ttf",
    "DMSans-Bold":    "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Bold.ttf",
}
for name, url in FONT_URLS.items():
    p = FONTS_DIR / f"{name}.ttf"
    if not p.exists():
        urllib.request.urlretrieve(url, p)
    pdfmetrics.registerFont(TTFont(name, str(p)))

# ---------- Colors ----------
NAVY   = HexColor("#0B1F3A")
ORANGE = HexColor("#E87722")
TEXT   = HexColor("#28251D")
MUTED  = HexColor("#7A7974")

REPO   = Path(__file__).resolve().parents[2]
INBOX  = REPO / "inbox-materials" / "workbook" / "beth_fahey"
OUT_DIR = Path(__file__).parent

MAIN_PDF  = OUT_DIR / "Workbook.pdf"
FINAL_PDF = OUT_DIR / "Workbook-Full.pdf"

ROLLOUT_FILES = [
    ("EOS-Rollout-Tracker.pdf",
     "EOS Rollout Tracker",
     "Beth Fahey's tool for tracking your company-wide EOS rollout: departments, "
     "milestones, and the current stage of each team."),
    ("ROLLOUT-Tips-for-Sharing-Context-of-EOS.pdf",
     "Tips for Sharing the Context of EOS",
     "How to introduce EOS to a new team member or department so they understand "
     "not just the tools but the why."),
    ("ROLLOUT-Troubleshooting-Guide.pdf",
     "Rollout Troubleshooting Guide",
     "The most common places a company-wide EOS rollout stalls, and how to get "
     "unstuck."),
]

# ---------- Divider PDF builder ----------
def build_divider_pdf() -> bytes:
    """Return an in-memory PDF byte string with an appendix cover + entry pages."""
    buf = io.BytesIO()

    def header_footer(canv, doc):
        canv.saveState()
        canv.setFillColor(ORANGE)
        canv.rect(0, letter[1] - 0.32 * inch, letter[0], 0.32 * inch, stroke=0, fill=1)
        canv.setFillColor(white)
        canv.setFont("DMSans-Bold", 10)
        canv.drawString(0.6 * inch, letter[1] - 0.22 * inch, "WE RUN ON EOS \u00ae NORTH TEXAS 2026")
        canv.drawRightString(letter[0] - 0.6 * inch, letter[1] - 0.22 * inch, "APPENDIX  \u00b7  BETH FAHEY")
        canv.setFillColor(MUTED)
        canv.setFont("DMSans-Regular", 8)
        canv.drawString(0.6 * inch, 0.35 * inch, "Attendee Workbook \u2014 Appendix")
        canv.drawRightString(letter[0] - 0.6 * inch, 0.35 * inch, "eosnorthtexas.com")
        canv.restoreState()

    doc = BaseDocTemplate(
        buf, pagesize=letter,
        leftMargin=0.75 * inch, rightMargin=0.75 * inch,
        topMargin=0.9 * inch, bottomMargin=0.75 * inch,
    )
    frame = Frame(
        doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
        leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

    kicker = ParagraphStyle("kicker", fontName="DMSans-Bold", fontSize=11,
                            textColor=ORANGE, spaceAfter=8, leading=14)
    h1 = ParagraphStyle("h1", fontName="DMSans-Bold", fontSize=32,
                        textColor=NAVY, leading=36, spaceAfter=16)
    lede = ParagraphStyle("lede", fontName="DMSans-Regular", fontSize=13,
                          textColor=TEXT, leading=19, spaceAfter=16)
    entry_kicker = ParagraphStyle("entry_kicker", fontName="DMSans-Bold", fontSize=10,
                                  textColor=ORANGE, spaceAfter=6, leading=12)
    entry_title = ParagraphStyle("entry_title", fontName="DMSans-Bold", fontSize=22,
                                 textColor=NAVY, leading=26, spaceAfter=10)
    entry_body = ParagraphStyle("entry_body", fontName="DMSans-Regular", fontSize=12,
                                textColor=TEXT, leading=17, spaceAfter=8)

    story = []
    # ---- Cover ----
    story.append(Spacer(1, 2.5 * inch))
    story.append(Paragraph("APPENDIX", kicker))
    story.append(Paragraph("Rollout Toolkit", h1))
    story.append(Paragraph(
        "Three companion resources for <b>Rollout, Reworked: Your Plan for Running EOS\u00ae "
        "Company-Wide</b>, contributed by Beth Fahey, Expert EOS Implementer\u00ae.",
        lede,
    ))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph(
        "Use these after the event to run and troubleshoot your company-wide rollout.",
        entry_body,
    ))

    # ---- Per-tool divider page ----
    for _, title, desc in ROLLOUT_FILES:
        from reportlab.platypus import PageBreak
        story.append(PageBreak())
        story.append(Spacer(1, 2.0 * inch))
        story.append(Paragraph("ROLLOUT TOOLKIT", entry_kicker))
        story.append(Paragraph(title, entry_title))
        story.append(Paragraph(desc, entry_body))

    doc.build(story)
    return buf.getvalue()


def main():
    if not MAIN_PDF.exists():
        raise SystemExit(f"Missing {MAIN_PDF}. Run build_workbook.js and convert to PDF first.")
    for fname, _, _ in ROLLOUT_FILES:
        if not (INBOX / fname).exists():
            raise SystemExit(f"Missing appendix source: {INBOX / fname}")

    divider_bytes = build_divider_pdf()
    divider = pypdf.PdfReader(io.BytesIO(divider_bytes))

    writer = pypdf.PdfWriter()

    # 1. Main workbook body
    main = pypdf.PdfReader(str(MAIN_PDF))
    for page in main.pages:
        writer.add_page(page)

    # 2. Appendix cover page = divider page 1
    writer.add_page(divider.pages[0])

    # 3. For each Rollout file: divider page (i+1) then the file itself
    for i, (fname, _, _) in enumerate(ROLLOUT_FILES, start=1):
        writer.add_page(divider.pages[i])
        src = pypdf.PdfReader(str(INBOX / fname))
        for page in src.pages:
            writer.add_page(page)

    writer.add_metadata({
        "/Title": "WRoEOS North Texas 2026 \u2014 Attendee Workbook (Full)",
        "/Author": "Perplexity Computer",
        "/Subject": "Full-day attendee workbook including Beth Fahey Rollout Toolkit appendix",
    })

    with open(FINAL_PDF, "wb") as fh:
        writer.write(fh)

    n_final = len(pypdf.PdfReader(str(FINAL_PDF)).pages)
    n_main  = len(main.pages)
    print(f"Wrote {FINAL_PDF}")
    print(f"  main workbook: {n_main} pages")
    print(f"  appendix:      {n_final - n_main} pages")
    print(f"  total:         {n_final} pages")


if __name__ == "__main__":
    main()
