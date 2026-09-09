# Customer Celebrations — Break Loop

Looping deck for the big screen during breaks at WRoEOS North Texas 2026.

- **File:** `Celebrations-Loop.pptx`
- **Format:** 16:9 widescreen, 18 slides, 8 seconds per slide (~2:24 loop)
- **Kiosk mode:** already set — the file will auto-advance and loop on its own.
- **Design:** matches the main event deck (navy `#0B1F3A` + orange `#E87722`, Calibri).
- Each customer slide shows the Implementer name in small orange text near the bottom right of the text panel.

## Running the loop in PowerPoint

1. Open `Celebrations-Loop.pptx`.
2. Start slideshow (`F5`).
3. It runs on its own — advances every 8 seconds, loops forever, no clicker needed. Press `Esc` to stop.

If the timings or loop do not stick (e.g., opened in Keynote or Google Slides), set them manually:

- **PowerPoint:** Slide Show → Set Up Slide Show → check "Loop continuously until 'Esc'" and "Using timings, if present".
- **Keynote:** Play → In Order → Set Slideshow to "Automatic" and "Loop".
- **Google Slides:** Present → Auto-advance every 8 seconds → Loop.

## Slide order

| # | Slide | Implementer |
|---|---|---|
| 1 | Title — Customer Celebrations | — |
| 2 | Maverick Power (headline win) | Shane Spillers |
| 3 | KPost Roofing & Waterproofing | Shane Spillers |
| 4 | Neighborhood Management, Inc. | Shane Spillers |
| 5 | B2 Design Co | Shane Spillers |
| 6 | Artstillery | Shane Spillers |
| 7 | Moonshot (EY Southwest Winner) | Ryan Wall |
| 8 | Lime Media Group (EY Southwest Winner) | Leonard |
| 9 | Brain Storm Shelter Restaurants (EY Finalist) | Amanda Matthews |
| 10 | TruLabs (EY Finalist) | Amy Johannesen |
| 11 | Excel Medical Staffing (EY Finalist) | Justin Mink |
| 12 | HorsePower Brands (EY Heartland Finalist) | Justin Mink |
| 13 | North Texas Ophthalmology | Erin Thiem |
| 14 | Austin Street Center | Kevin Taylor |
| 15 | BAT Security | Kevin Taylor |
| 16 | Blue Mint Thai | Kevin Taylor |
| 17 | Rose Marketing Solutions | Amanda Matthews |
| 18 | Closing — Congratulations | — |

Implementer attribution comes from Shane's master DOCX (“EOSI:” field). For wins that came in via a separate email, the sender is credited as Implementer. North Texas Ophthalmology was forwarded by Erin Thiem; adjust if Matt Griffiths' actual EOSI is someone else.

## Content sources

Content assembled from EOS inbox emails:

- Shane Spillers' `WRoEOS-2026-Celebration-Segment-Assets.docx` (11 pre-written entries)
- Kevin Taylor's client submissions (Austin Street, BAT Security, Blue Mint Thai)
- Erin Thiem's forward from Matt Griffiths (North Texas Ophthalmology)
- Amy's forward from Amanda Matthews (Rose Marketing Solutions)

Raw source materials preserved under `../../inbox-materials/celebrations/`.

## Rebuilding

```bash
cd deliverables/celebrations-loop
NODE_PATH=/home/user/node_modules node build_loop.js
python3 post_process_loop.py
soffice --headless --convert-to pdf Celebrations-Loop.pptx --outdir .
```

To change timing, edit `ADVANCE_SEC` in `build_loop.js` (top of file) and `ADVANCE_SECONDS` in `post_process_loop.py`. To add or remove customers, edit the `CUSTOMERS` array in `build_loop.js`.

To swap a photo, drop a new file into `assets/` and update the `photo:` field in `build_loop.js`. Photos should be at least ~1200px on the long edge; the build reads any JPG.
