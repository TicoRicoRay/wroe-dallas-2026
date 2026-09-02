#!/usr/bin/env python3
"""Build a single-page AV team instruction sheet for the event deck."""
from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle
)
import urllib.request

# ---------- Fonts ----------
FONTS_DIR = Path("/tmp/av_fonts")
FONTS_DIR.mkdir(exist_ok=True)
FONT_URLS = {
    "DMSans-Regular": "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Regular.ttf",
    "DMSans-Medium": "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Medium.ttf",
    "DMSans-Bold": "https://raw.githubusercontent.com/googlefonts/dm-fonts/main/Sans/Exports/DMSans-Bold.ttf",
}
for name, url in FONT_URLS.items():
    p = FONTS_DIR / f"{name}.ttf"
    if not p.exists():
        urllib.request.urlretrieve(url, p)
    pdfmetrics.registerFont(TTFont(name, str(p)))

# ---------- Colors ----------
NAVY = HexColor("#0B1F3A")
ORANGE = HexColor("#E87722")
TEXT = HexColor("#28251D")
MUTED = HexColor("#7A7974")
RULE = HexColor("#D4D1CA")
BG_TINT = HexColor("#F4F6F9")

# ---------- Doc ----------
OUT = Path(__file__).parent / "AV-Team-Instructions.pdf"


def header_footer(canv, doc):
    canv.saveState()
    # Orange top bar
    canv.setFillColor(ORANGE)
    canv.rect(0, letter[1] - 0.32 * inch, letter[0], 0.32 * inch, stroke=0, fill=1)
    # Header text on orange bar
    canv.setFillColor(white)
    canv.setFont("DMSans-Bold", 10)
    canv.drawString(0.6 * inch, letter[1] - 0.22 * inch, "WE RUN ON EOS \u00ae NORTH TEXAS 2026")
    canv.drawRightString(letter[0] - 0.6 * inch, letter[1] - 0.22 * inch, "SEPTEMBER 14, 2026  \u00b7  THE STATLER")
    # Bottom rule + footer
    canv.setFillColor(MUTED)
    canv.setFont("DMSans-Regular", 8)
    canv.drawString(0.6 * inch, 0.35 * inch, "AV Team Instructions  \u00b7  Print single-sided, 2 pages")
    canv.drawRightString(letter[0] - 0.6 * inch, 0.35 * inch, "eosnorthtexas.com")
    canv.restoreState()


doc = BaseDocTemplate(
    str(OUT),
    pagesize=letter,
    leftMargin=0.6 * inch,
    rightMargin=0.6 * inch,
    topMargin=0.7 * inch,
    bottomMargin=0.6 * inch,
    title="AV Team Instructions - WRoEOS North Texas 2026",
    author="Perplexity Computer",
)
frame = Frame(
    doc.leftMargin, doc.bottomMargin,
    doc.width, doc.height,
    leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
)
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

# ---------- Styles ----------
h1 = ParagraphStyle(
    "h1", fontName="DMSans-Bold", fontSize=22, leading=26,
    textColor=NAVY, spaceAfter=2,
)
h1_sub = ParagraphStyle(
    "h1_sub", fontName="DMSans-Regular", fontSize=10, leading=13,
    textColor=MUTED, spaceAfter=14,
)
h2 = ParagraphStyle(
    "h2", fontName="DMSans-Bold", fontSize=12, leading=15,
    textColor=ORANGE, spaceBefore=10, spaceAfter=6, letterSpacing=1,
)
body = ParagraphStyle(
    "body", fontName="DMSans-Regular", fontSize=10, leading=14,
    textColor=TEXT, spaceAfter=4,
)
body_bold = ParagraphStyle(
    "body_bold", fontName="DMSans-Bold", fontSize=10, leading=14,
    textColor=TEXT,
)
callout = ParagraphStyle(
    "callout", fontName="DMSans-Regular", fontSize=9, leading=12,
    textColor=NAVY, spaceAfter=2,
)
step_num = ParagraphStyle(
    "step_num", fontName="DMSans-Bold", fontSize=14, leading=16,
    textColor=ORANGE, alignment=1,
)
step_body = ParagraphStyle(
    "step_body", fontName="DMSans-Regular", fontSize=10, leading=13,
    textColor=TEXT,
)

# ---------- Content ----------
story = []

story.append(Paragraph("AV Team \u2014 Deck Playback Guide", h1))
story.append(Paragraph("One PowerPoint file, paid-day (PM) scope. Two playback modes: pre-event loop and event.", h1_sub))

story.append(Paragraph(
    "<b>Scope:</b> This deck covers the paid afternoon only. The free morning (Ann Sheu, Strety, System of Selling) and Walt Brown\u2019s lunch are <b>not</b> in this deck \u2014 they run separately from their own materials. The pre-event loop is designed to play from ~12:30 PM as guests return from lunch, and the Event show starts at Mark Stanley\u2019s 1:00 PM session.",
    callout,
))

# --------- Section: Before doors open ---------
story.append(Paragraph("BEFORE THE PM PROGRAM  \u2014  START THE PRE-EVENT LOOP AT ~12:30 PM", h2))

steps_pre = [
    ["1", "Open <b>Deck.pptx</b> in PowerPoint (desktop). Google Slides and Keynote do <b>not</b> support the auto-advance timings \u2014 use Microsoft PowerPoint."],
    ["2", "Go to <b>Slide Show</b> menu \u203a <b>Set Up Slide Show</b>."],
    ["3", "Under <b>Show slides</b>, choose <b>Custom show</b> \u203a <b>Pre-Event Loop</b>. Under <b>Show options</b>, check <b>Loop continuously until \u2018Esc\u2019</b>. Under <b>Advance slides</b>, choose <b>Using timings, if present</b>. Click <b>OK</b>."],
    ["4", "Press <b>F5</b> (or <b>Slide Show</b> menu \u203a <b>From Beginning</b>). Slides 1\u20135 will cycle every <b>15 seconds</b>, hands-free, until you press <b>Esc</b>."],
]
tbl_pre = Table(
    [[Paragraph(n, step_num), Paragraph(t, step_body)] for n, t in steps_pre],
    colWidths=[0.4 * inch, 6.7 * inch],
)
tbl_pre.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(tbl_pre)

story.append(Paragraph(
    "The two Custom Shows (<b>Pre-Event Loop</b> and <b>Event</b>) are already saved inside "
    "the deck. No setup needed \u2014 just pick them from the Custom show dropdown.",
    callout,
))

# --------- Section: When emcee is ready ---------
story.append(Paragraph("WHEN THE EMCEE IS READY TO START  \u2014  SWITCH TO THE EVENT", h2))

steps_event = [
    ["1", "Press <b>Esc</b> to exit the pre-event loop."],
    ["2", "Go to <b>Slide Show</b> menu \u203a <b>Set Up Slide Show</b>. Under <b>Show slides</b>, choose <b>Custom show</b> \u203a <b>Event</b>. Under <b>Show options</b>, <b>uncheck</b> \u201cLoop continuously.\u201d Under <b>Advance slides</b>, choose <b>Manually</b>. Click <b>OK</b>."],
    ["3", "Press <b>F5</b>. The deck opens on <b>slide 6 (emcee open)</b>. Click or press space to advance from here on out."],
]
tbl_event = Table(
    [[Paragraph(n, step_num), Paragraph(t, step_body)] for n, t in steps_event],
    colWidths=[0.4 * inch, 6.7 * inch],
)
tbl_event.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(tbl_event)

# --------- Section: Speaker deck handoffs ---------
story.append(Paragraph("SPEAKER DECK HANDOFFS  \u2014  TWO SESSIONS OPEN AN EXTERNAL FILE", h2))

story.append(Paragraph(
    "Two of the three PM sessions do <b>not</b> present from inside the master deck. When you reach their canvas slide, "
    "the slide itself will say <b>OPEN PRESENTER DECK</b> and name the file. Follow these steps:",
    body,
))

steps_handoff = [
    ["1", "When the emcee finishes the intro and you land on the <b>OPEN PRESENTER DECK</b> slide, press <b>Esc</b> to exit the show."],
    ["2", "Double-click the named file inside the <b>speaker-decks\\</b> folder (same folder as Deck.pptx):<br/>"
          "&nbsp;&nbsp;&nbsp;&nbsp;\u2022 Mark Stanley (1:00 PM opener): <b>Profit-Power-Deck.pptx</b> \u2014 lands on <b>slide 8</b><br/>"
          "&nbsp;&nbsp;&nbsp;&nbsp;\u2022 Mark C. Winters (4:45 PM closer): <b>10-Pillars-of-Visionary-Greatness.pptx</b> \u2014 lands on <b>slide 16</b>"],
    ["3", "Press <b>F5</b> in the speaker file to run their deck. The presenter drives it."],
    ["4", "When the session ends, press <b>Esc</b>, close the speaker file, switch back to <b>Deck.pptx</b>, and resume the <b>Event</b> custom show on the next slide (press F5, then use \u2018By slide\u2019 or advance from the current slide)."],
]
tbl_handoff = Table(
    [[Paragraph(n, step_num), Paragraph(t, step_body)] for n, t in steps_handoff],
    colWidths=[0.4 * inch, 6.7 * inch],
)
tbl_handoff.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(tbl_handoff)

story.append(Paragraph(
    "Both speaker files must be copied to the presentation laptop <b>before</b> the event, in the "
    "<b>speaker-decks\\</b> folder sitting next to Deck.pptx. The master deck references them by "
    "filename only.",
    callout,
))

# --------- Section: Break countdown ---------
story.append(Paragraph("BREAK COUNTDOWN TIMERS", h2))
break_body = (
    "The break slides show a static number (20:00, 15:00). For a <b>live countdown</b>, "
    "open the companion timer page on a second laptop or a monitor visible to the emcee: "
    "<b>eosnorthtexas.com/timer</b>. Presets for 10 / 15 / 20 / 25 minutes; press <b>spacebar</b> "
    "to start/pause, <b>R</b> to reset, <b>F</b> for fullscreen."
)
story.append(Paragraph(break_body, body))

# --------- Section: Quick reference ---------
story.append(Paragraph("QUICK REFERENCE", h2))

qref_data = [
    ["Deck file", "Deck.pptx (17 slides, 16:9) \u2014 paid PM only"],
    ["Playback app", "Microsoft PowerPoint (desktop) \u2014 required for timings"],
    ["Pre-event loop", "Slides 1\u20135, auto-advance 15s, loop until Esc (plays ~12:30\u20131:00 PM)"],
    ["Event show", "Slides 6\u201317, manual click-to-advance (starts at 1:00 PM emcee open)"],
    ["Speaker decks", "speaker-decks\\ folder \u2014 Mark Stanley (slide 8), Winters (slide 16)"],
    ["Break timer URL", "eosnorthtexas.com/timer"],
    ["Backup handoff", "If timings misfire, click through slides 1\u20135 manually"],
]
qref = Table(
    qref_data,
    colWidths=[1.7 * inch, 5.4 * inch],
)
qref.setStyle(TableStyle([
    ("FONT", (0, 0), (0, -1), "DMSans-Bold", 9),
    ("FONT", (1, 0), (1, -1), "DMSans-Regular", 9),
    ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
    ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BACKGROUND", (0, 0), (-1, -1), BG_TINT),
    ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(qref)

# --------- Section: Troubleshooting ---------
story.append(Paragraph("IF SOMETHING GOES WRONG", h2))
trouble = [
    "<b>Slides don\u2019t auto-advance:</b> Set Up Slide Show \u203a Advance slides \u203a select <b>Using timings, if present</b>.",
    "<b>Loop doesn\u2019t restart:</b> Set Up Slide Show \u203a Show options \u203a check <b>Loop continuously until \u2018Esc\u2019</b>.",
    "<b>Wrong slide range playing:</b> Set Up Slide Show \u203a Show slides \u203a Custom show \u203a pick the right one.",
    "<b>PowerPoint online / Google Slides opened it:</b> Download and open the file in <b>desktop PowerPoint</b> instead.",
]
for line in trouble:
    story.append(Paragraph(f"\u2022 &nbsp; {line}", body))

# Build
doc.build(story)
print(f"Wrote {OUT}")
