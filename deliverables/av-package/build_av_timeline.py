#!/usr/bin/env python3
"""
Build the AV Team Timeline — WRoEOS North Texas 2026.

One-glance run-of-show for the AV operator at The Statler on 9/14/2026.
Reads config.js (agenda) so times stay in sync with the event website.
Music assignments and Spotify playlist links come from the Sep-9 email
thread with Meagan Harris / Shane Spillers.

Output: AV-Timeline.pdf (2 pages, US Letter, landscape).
"""
from pathlib import Path
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    KeepTogether, PageBreak
)
import urllib.request

# ---------- Fonts (match existing AV-Team-Instructions.pdf) ----------
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

# ---------- Colors (match main deck / AV instructions) ----------
NAVY    = HexColor("#0B1F3A")
ORANGE  = HexColor("#E87722")
TEXT    = HexColor("#28251D")
MUTED   = HexColor("#7A7974")
RULE    = HexColor("#D4D1CA")
BG_TINT = HexColor("#F4F6F9")
BG_FREE = HexColor("#EAF3EE")   # free-morning band
BG_PAID = HexColor("#FDF2E8")   # paid-afternoon band
BG_BRK  = HexColor("#F0F0F0")   # break rows

# ---------- Document ----------
OUT = Path(__file__).parent / "AV-Timeline.pdf"
PAGE = landscape(letter)   # 11 x 8.5

def header_footer(canv, doc):
    canv.saveState()
    # Orange top bar
    canv.setFillColor(ORANGE)
    canv.rect(0, PAGE[1] - 0.32 * inch, PAGE[0], 0.32 * inch, stroke=0, fill=1)
    canv.setFillColor(white)
    canv.setFont("DMSans-Bold", 10)
    canv.drawString(0.5 * inch, PAGE[1] - 0.22 * inch,
                    "WE RUN ON EOS \u00ae NORTH TEXAS 2026  \u00b7  AV TIMELINE")
    canv.drawRightString(PAGE[0] - 0.5 * inch, PAGE[1] - 0.22 * inch,
                         "MONDAY, SEPTEMBER 14, 2026  \u00b7  THE STATLER DALLAS")
    # Footer
    canv.setFillColor(MUTED)
    canv.setFont("DMSans-Regular", 8)
    canv.drawString(0.5 * inch, 0.30 * inch,
                    "Timer page: https://EOSNorthTexas.com/timer  \u00b7  Break Timer + Sponsor Marquee")
    canv.drawRightString(PAGE[0] - 0.5 * inch, 0.30 * inch,
                         f"Page {doc.page}")
    canv.restoreState()

doc = BaseDocTemplate(
    str(OUT),
    pagesize=PAGE,
    leftMargin=0.4 * inch,
    rightMargin=0.4 * inch,
    topMargin=0.55 * inch,
    bottomMargin=0.5 * inch,
    title="AV Timeline - WRoEOS North Texas 2026",
    author="Ray Myers",
)
frame = Frame(
    doc.leftMargin, doc.bottomMargin,
    doc.width, doc.height,
    leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
)
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

# ---------- Styles ----------
h1 = ParagraphStyle("h1", fontName="DMSans-Bold", fontSize=18, leading=22,
                    textColor=NAVY, spaceAfter=2)
h1_sub = ParagraphStyle("h1_sub", fontName="DMSans-Regular", fontSize=9, leading=12,
                        textColor=MUTED, spaceAfter=10)
h2 = ParagraphStyle("h2", fontName="DMSans-Bold", fontSize=11, leading=14,
                    textColor=ORANGE, spaceBefore=8, spaceAfter=5)
body = ParagraphStyle("body", fontName="DMSans-Regular", fontSize=9, leading=12,
                      textColor=TEXT)
body_bold = ParagraphStyle("body_bold", fontName="DMSans-Bold", fontSize=9, leading=12,
                           textColor=TEXT)
cell = ParagraphStyle("cell", fontName="DMSans-Regular", fontSize=8.5, leading=11,
                      textColor=TEXT)
cell_bold_white = ParagraphStyle("cell_bold_white", fontName="DMSans-Bold", fontSize=8.5, leading=11,
                           textColor=white)
cell_bold = ParagraphStyle("cell_bold", fontName="DMSans-Bold", fontSize=8.5, leading=11,
                           textColor=TEXT)
cell_time = ParagraphStyle("cell_time", fontName="DMSans-Bold", fontSize=9, leading=11,
                           textColor=NAVY)
cell_action = ParagraphStyle("cell_action", fontName="DMSans-Regular", fontSize=8.5, leading=11,
                             textColor=TEXT)

# ---------- Rows ----------
# Columns: TIME | SEGMENT | ON MAIN SCREEN | MUSIC / AUDIO | AV ACTION
HEADERS = ["Time", "Segment", "On Main Screen", "Music / Audio", "AV Action"]

def P(text, style=cell):
    return Paragraph(text, style)

ROWS = [
    # -------- FREE MORNING --------
    ("SECTION", "FREE MORNING PROGRAM"),
    ("7:30 – 8:00 AM", "Coffee, Snacks & Registration",
     "Timer page (countdown to 8:00)",
     "<b>Countdown Timer Playlist</b> (Spotify)",
     "Open <b>https://EOSNorthTexas.com/timer</b> on main screen. Set to 30:00 countdown. Start playlist."),
    ("8:00 – 9:35 AM", "Get a Grip on your Business with EOS<br/><font color='#7A7974'>Ann Sheu · Certified EOS Implementer</font>",
     "Ann Sheu's deck (she brings)",
     "<b>Walk-on:</b> <i>Unstoppable</i> by The Score — start at 0:30",
     "Fade playlist. Play Ann's walk-on song. Load her deck when she takes the stage."),
    ("9:35 – 9:50 AM", "Break (15 min)",
     "Timer page (15:00)",
     "<b>Countdown Timer Playlist</b>",
     "Set timer to 15:00. Resume playlist."),
    ("9:50 – 10:40 AM", "Journey with an EOS Implementer<br/><font color='#7A7974'>Brian Dosal · Strety</font>",
     "Brian's deck (in speaker-decks/)",
     "<b>Walk-on:</b> <i>Ants Marching</i> by Dave Matthews Band (chorus)",
     "Fade playlist. Play walk-on. Load <b>Brian Dosal (Strety) — Journey with an EOS Implementer.pptx</b>."),
    ("10:40 – 10:55 AM", "Break (15 min)",
     "Timer page (15:00)",
     "<b>Countdown Timer Playlist</b>",
     "Set timer to 15:00. Resume playlist."),
    ("10:55 – 11:55 AM", "Your Sales Team Isn't the Problem. Your System Is.<br/><font color='#7A7974'>Steve Heroux</font>",
     "Steve's deck (in speaker-decks/)",
     "<b>Walk-on:</b> <i>Down with the Sickness</i> by Disturbed (chorus)",
     "Fade playlist. Play walk-on. Load <b>Steve Heroux — Sales System (fixed).pptx</b>."),
    ("11:55 AM – 12:00 PM", "Emcee bridge to Lunch",
     "Lunch title card",
     "<b>Pre-Lunch:</b> <i>Find Your People</i> by Drew Holcomb &amp; The Neighbors",
     "Play pre-lunch song as guests transition to lunch tables."),

    # -------- LUNCH --------
    ("SECTION", "LUNCH & LEARN"),
    ("12:00 – 1:00 PM", "Lunch and Learn: Healthy Matters<br/><font color='#7A7974'>Walt Brown · 7 Critical Needs</font>",
     "Walt's deck (in speaker-decks/)",
     "<b>Walk-on:</b> <i>Don't Ask Me No Questions</i> by Lynyrd Skynyrd (chorus)",
     "Load <b>Walt Brown — 7 Critical Needs (fixed).pptx</b>. Play walk-on when Walt takes the stage after guests are seated."),
    ("1:00 – 1:10 PM", "Break / Bridge (10 min)",
     "Pre-event loop starts (Deck.pptx slides 1-5 auto-advance)",
     "<b>Post-Lunch:</b> <i>Do I Ever Cross Your Mind</i> by Dolly Parton, then <b>Countdown Timer Playlist</b>",
     "Play post-lunch song. Load <b>Deck.pptx</b> — start Custom Show <b>“Pre-Event Loop”</b> (auto-advances 15s per slide)."),

    # -------- PAID AFTERNOON --------
    ("SECTION", "PAID AFTERNOON PROGRAM"),
    ("1:10 – 2:40 PM", "Profit Power: Stronger — or Just Bigger?<br/><font color='#7A7974'>Mark Stanley</font>",
     "Deck.pptx slide 6-8, then Mark's deck",
     "<b>Walk-on:</b> <i>Beautiful Day</i> by U2 (chorus)",
     "Advance Deck.pptx to Custom Show <b>“Event”</b> (starts at slide 6). At slide 8, <b>Esc</b>, then open <b>Mark Stanley — Profit Power.pptx</b> and press F5. Play walk-on before he takes stage."),
    ("2:40 – 2:55 PM", "Afternoon Break (15 min)",
     "Timer page (15:00) OR Celebrations Loop",
     "<b>Countdown Timer Playlist</b>",
     "Set timer to 15:00. <b>Option:</b> switch to <b>Celebrations-Loop.pptx</b> on main projector during this break for extra content."),
    ("2:55 – 4:25 PM", "Rollout, Reworked: Running EOS Company-Wide<br/><font color='#7A7974'>Beth Fahey</font>",
     "Deck.pptx slide 10-11 (Beth may drive from master or her own deck)",
     "<b>Walk-on:</b> <i>Rollout</i> by Ludacris (instrumental, chorus)",
     "Advance Deck.pptx to slide 10-11. Beth presents from here or hands off to her deck. Play walk-on before she takes stage."),
    ("4:25 – 4:45 PM", "Final Break (20 min)",
     "Timer page (20:00) OR Celebrations Loop",
     "<b>Countdown Timer Playlist</b>",
     "Set timer to 20:00. <b>Sponsor thank-you</b> at Deck.pptx slides 13-14 will play on emcee return."),
    ("4:45 – 6:15 PM", "The 10 Pillars of Visionary Greatness<br/><font color='#7A7974'>Mark C. Winters</font>",
     "Deck.pptx slide 13-16, then Winters' deck",
     "<b>Walk-on:</b> <span color='#c00000'><b>TBD — awaiting Mark C. Winters</b></span>",
     "Advance Deck.pptx to slides 13-14 (sponsor thank-you), then slide 15 (session cover), then slide 16. <b>Esc</b>, then open <b>Mark C. Winters — 10 Pillars.pptx</b> and press F5. Play walk-on before he takes stage."),

    # -------- CLOSE --------
    ("SECTION", "HAPPY HOUR"),
    ("6:15 – 8:00 PM", "Happy Hour + Networking<br/><font color='#7A7974'>Sponsored by Ninety.io</font>",
     "Deck.pptx slide 17 (Happy Hour close)",
     "Any upbeat playlist (host's choice)",
     "Advance Deck.pptx to slide 17. Leave on-screen through Happy Hour. Music continues."),
]

# ---------- Build Table ----------
COL_WIDTHS = [
    1.20 * inch,   # time
    2.20 * inch,   # segment
    1.90 * inch,   # main screen
    2.10 * inch,   # music
    2.80 * inch,   # AV action
]

def build_table():
    data = [[P(h, cell_bold_white) for h in HEADERS]]
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR",  (0, 0), (-1, 0), white),
        ("FONTNAME",   (0, 0), (-1, 0), "DMSans-Bold"),
        ("FONTSIZE",   (0, 0), (-1, 0), 9),
        ("LEFTPADDING",  (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("GRID",         (0, 0), (-1, -1), 0.4, RULE),
    ]
    # header override for header row on white text
    style_cmds.append(("TEXTCOLOR", (0, 0), (-1, 0), white))

    row_idx = 1
    for r in ROWS:
        if r[0] == "SECTION":
            # Section band row
            label = r[1]
            data.append([P(f"<b>{label}</b>", ParagraphStyle(
                "sec", fontName="DMSans-Bold", fontSize=10, leading=13, textColor=white))] + [""] * 4)
            style_cmds += [
                ("SPAN", (0, row_idx), (-1, row_idx)),
                ("BACKGROUND", (0, row_idx), (-1, row_idx), ORANGE),
                ("TEXTCOLOR",  (0, row_idx), (-1, row_idx), white),
                ("TOPPADDING", (0, row_idx), (-1, row_idx), 5),
                ("BOTTOMPADDING",(0, row_idx), (-1, row_idx), 5),
            ]
        else:
            time, seg, screen, music, action = r
            is_break = "Break" in seg or "Bridge" in seg
            data.append([
                P(time, cell_time),
                P(seg, cell),
                P(screen, cell),
                P(music, cell),
                P(action, cell_action),
            ])
            if is_break:
                style_cmds.append(("BACKGROUND", (0, row_idx), (-1, row_idx), BG_BRK))
        row_idx += 1

    t = Table(data, colWidths=COL_WIDTHS, repeatRows=1)
    t.setStyle(TableStyle(style_cmds))
    return t

# ---------- Cover / Header block ----------
elements = []
elements.append(Paragraph("AV Team Timeline", h1))
elements.append(Paragraph(
    "Monday, September 14, 2026 &nbsp; \u00b7 &nbsp; The Statler Dallas &nbsp; \u00b7 &nbsp; Room: Grand Ballroom", h1_sub))

# Quick-reference block (before the table)
quick_style_cmds = [
    ("BACKGROUND", (0, 0), (0, -1), NAVY),
    ("TEXTCOLOR",  (0, 0), (0, -1), white),
    ("FONTNAME",   (0, 0), (0, -1), "DMSans-Bold"),
    ("FONTSIZE",   (0, 0), (-1, -1), 8.5),
    ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING",(0, 0), (-1, -1), 6),
    ("TOPPADDING",  (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
    ("BOX", (0, 0), (-1, -1), 0.4, RULE),
    ("INNERGRID", (0, 0), (-1, -1), 0.4, RULE),
]
quick_data = [
    [P("TIMER PAGE", cell_bold_white), P("<b>https://EOSNorthTexas.com/timer</b> \u00b7 open in a browser on the main output. The page shows the countdown AND scrolls sponsor logos at the top. Use for every break.", cell)],
    [P("SPOTIFY", cell_bold_white), P("Countdown Timer Playlist \u00b7 Speaker Walk Up Playlist \u00b7 Alternates \u00b7 Lunch. All four links in the Music Cheat Sheet appendix on page 2.", cell)],
    [P("MAIN DECK", cell_bold_white), P("<b>deliverables/deck/Deck.pptx</b> \u00b7 17 slides \u00b7 Two Custom Shows: <b>Pre-Event Loop</b> (slides 1-5, auto-advances) and <b>Event</b> (slides 6-17).", cell)],
    [P("SPEAKER DECKS", cell_bold_white), P("<b>deliverables/speaker-decks/</b> \u00b7 open each speaker's file in PowerPoint at the handoff. Return to Deck.pptx afterward via Custom Show &raquo; Event.", cell)],
    [P("CELEBRATIONS LOOP", cell_bold_white), P("<b>deliverables/celebrations-loop/Celebrations-Loop.pptx</b> \u00b7 18-slide auto-looping customer wins deck. Optional backup for breaks if you want a second visual instead of the timer page.", cell)],
]
quick = Table(quick_data, colWidths=[1.4 * inch, 8.8 * inch])
quick.setStyle(TableStyle(quick_style_cmds))
elements.append(quick)
elements.append(Spacer(1, 8))

# The big timeline table
elements.append(build_table())

# ---------- Page 2: Music cheat sheet + hand-off notes ----------
elements.append(PageBreak())
elements.append(Paragraph("Music Cheat Sheet", h1))
elements.append(Paragraph(
    "Direction from Shane Spillers: play only the most famous part of each walk-on (chorus). Fade playlists as speakers approach the stage.", h1_sub))

# Spotify playlists table
elements.append(Paragraph("Spotify Playlists", h2))
sp_data = [
    [P("Playlist", cell_bold_white), P("Use For", cell_bold_white), P("URL", cell_bold_white)],
    [P("Countdown Timer Playlist", cell),
     P("Registration and every break", cell),
     P("<a href='https://open.spotify.com/playlist/1Qc0IvwGfUXseHSsWOvkbM'>https://open.spotify.com/playlist/1Qc0IvwGfUXseHSsWOvkbM</a>", cell)],
    [P("Speaker Walk Up Playlist", cell),
     P("Fallback if a specific walk-on song is unavailable", cell),
     P("<a href='https://open.spotify.com/playlist/6SHNkZRoEAFSwBGs2D4wgY'>https://open.spotify.com/playlist/6SHNkZRoEAFSwBGs2D4wgY</a>", cell)],
    [P("Possible Alternate Song Options", cell),
     P("Backup track pool", cell),
     P("<a href='https://open.spotify.com/playlist/1gMZxRygewYpMXbMwlRDYm'>https://open.spotify.com/playlist/1gMZxRygewYpMXbMwlRDYm</a>", cell)],
    [P("Lunch Break", cell),
     P("11:55 AM \u2013 12:00 PM lunch bridge (Walt takes over at 12:00)", cell),
     P("<a href='https://open.spotify.com/playlist/1hvdE7nwQ5a0RpPPGpXw3b'>https://open.spotify.com/playlist/1hvdE7nwQ5a0RpPPGpXw3b</a>", cell)],
]
sp = Table(sp_data, colWidths=[2.0 * inch, 3.0 * inch, 5.2 * inch])
sp.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR",  (0, 0), (-1, 0), white),
    ("FONTNAME",   (0, 0), (-1, 0), "DMSans-Bold"),
    ("GRID",       (0, 0), (-1, -1), 0.4, RULE),
    ("VALIGN",     (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING",  (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING",   (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
]))
elements.append(sp)

# Walk-on assignments
elements.append(Paragraph("Speaker Walk-On Assignments", h2))
wo_data = [
    [P("Speaker", cell_bold_white), P("Session", cell_bold_white), P("Walk-On Song", cell_bold_white), P("Notes", cell_bold_white)],
    [P("Ann Sheu", cell), P("Get a Grip on your Business with EOS", cell), P("<i>Unstoppable</i> \u2014 The Score", cell), P("Start at <b>0:30</b>", cell)],
    [P("Brian Dosal", cell), P("Journey with an EOS Implementer", cell), P("<i>Ants Marching</i> \u2014 Dave Matthews Band", cell), P("Chorus only", cell)],
    [P("Steve Heroux", cell), P("Your Sales Team Isn't the Problem", cell), P("<i>Down with the Sickness</i> \u2014 Disturbed", cell), P("Chorus only", cell)],
    [P("Walt Brown", cell), P("Healthy Matters / 7 Critical Needs (Lunch)", cell), P("<i>Don't Ask Me No Questions</i> \u2014 Lynyrd Skynyrd", cell), P("Chorus only", cell)],
    [P("Mark Stanley", cell), P("Profit Power: Stronger or Just Bigger?", cell), P("<i>Beautiful Day</i> \u2014 U2", cell), P("Chorus only", cell)],
    [P("Beth Fahey", cell), P("Rollout, Reworked", cell), P("<i>Rollout</i> \u2014 Ludacris (instrumental)", cell), P("Chorus only", cell)],
    [P("Mark C. Winters", cell), P("The 10 Pillars of Visionary Greatness", cell),
     P("<font color='#c00000'><b>TBD \u2014 not yet provided</b></font>", cell),
     P("<font color='#c00000'>Default to Speaker Walk Up Playlist if not received</font>", cell)],
]
wo = Table(wo_data, colWidths=[1.5 * inch, 3.0 * inch, 3.2 * inch, 2.5 * inch])
wo.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR",  (0, 0), (-1, 0), white),
    ("FONTNAME",   (0, 0), (-1, 0), "DMSans-Bold"),
    ("GRID",       (0, 0), (-1, -1), 0.4, RULE),
    ("VALIGN",     (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING",  (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING",   (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
]))
elements.append(wo)

# Special cues + hand-off tips
elements.append(Paragraph("Special Music Cues", h2))
elements.append(Paragraph(
    "\u2022 <b>Pre-Lunch bridge (11:55 AM):</b> <i>Find Your People</i> by Drew Holcomb &amp; The Neighbors.<br/>"
    "\u2022 <b>Post-Lunch return (1:00 PM):</b> <i>Do I Ever Cross Your Mind</i> by Dolly Parton, then resume Countdown Timer Playlist during the 10-minute bridge.", body))

elements.append(Paragraph("Speaker Hand-Off Pattern", h2))
elements.append(Paragraph(
    "When a speaker uses their own deck (marked in the timeline):<br/>"
    "&nbsp;&nbsp;<b>1.</b> Press <b>Esc</b> to exit the current master deck.<br/>"
    "&nbsp;&nbsp;<b>2.</b> Open the speaker's file from <b>deliverables/speaker-decks/</b> in PowerPoint.<br/>"
    "&nbsp;&nbsp;<b>3.</b> Press <b>F5</b> to run the presenter's deck.<br/>"
    "&nbsp;&nbsp;<b>4.</b> When they finish, press <b>Esc</b> and re-open <b>Deck.pptx</b>, then Slide Show &raquo; Custom Show &raquo; <b>Event</b> to continue on the next master slide.", body))

elements.append(KeepTogether([
    Paragraph("Contacts on Event Day", h2),
    Paragraph(
        "\u2022 <b>Ray Myers</b> (deck / files / AV lead) \u00b7 469-939-9746 \u00b7 ray.myers@eosworldwide.com<br/>"
        "\u2022 <b>Fermin Martinez</b> (Encore / Statler AV contact) \u00b7 214-690-5211 \u00b7 fermin.martinez@encoreglobal.com<br/>"
        "\u2022 <b>Shane Spillers</b> (emcee / event lead) \u00b7 214-519-9599 \u00b7 shane.spillers@eosworldwide.com<br/>"
        "\u2022 <b>Meagan Harris</b> (music coordinator) \u00b7 meagan@spillersworks.com", body)
]))

doc.build(elements)
print(f"Built: {OUT} ({OUT.stat().st_size:,} bytes)")
