# Customer Celebrations — Break Loop

Looping deck for the big screen during breaks at WRoEOS North Texas 2026.

- **File:** `Celebrations-Loop.pptx`
- **Format:** 16:9 widescreen, 21 slides, 8 seconds per slide (~2:48 loop)
- **Kiosk mode:** already set — the file will auto-advance and loop on its own.
- **Design:** matches the main event deck (navy `#0B1F3A` + orange `#E87722`, Calibri).

## Running the loop in PowerPoint

1. Open `Celebrations-Loop.pptx`.
2. Start slideshow (`F5`).
3. It runs on its own — advances every 8 seconds, loops forever, no clicker needed. Press `Esc` to stop.

If the timings or loop do not stick (e.g., opened in Keynote or Google Slides), set them manually:

- **PowerPoint:** Slide Show → Set Up Slide Show → check "Loop continuously until 'Esc'" and "Using timings, if present".
- **Keynote:** Play → In Order → Set Slideshow to "Automatic" and "Loop".
- **Google Slides:** Present → Auto-advance every 8 seconds → Loop.

## Slide order

| # | Slide |
|---|---|
| 1 | Title — Customer Celebrations |
| 2 | Section — Spillers Clients |
| 3 | Maverick Power (headline win) |
| 4 | KPost Roofing & Waterproofing |
| 5 | Neighborhood Management, Inc. |
| 6 | B2 Design Co |
| 7 | Artstillery |
| 8 | Section — EY Entrepreneur Of The Year® 2026 |
| 9 | Moonshot (Southwest Winner) |
| 10 | Lime Media Group (Southwest Winner) |
| 11 | Brain Storm Shelter Restaurants (Finalist) |
| 12 | TruLabs (Finalist) |
| 13 | Excel Medical Staffing (Finalist) |
| 14 | HorsePower Brands (Heartland Finalist) |
| 15 | Section — More Community Celebrations |
| 16 | North Texas Ophthalmology |
| 17 | Austin Street Center |
| 18 | BAT Security |
| 19 | Blue Mint Thai |
| 20 | Rose Marketing Solutions |
| 21 | Closing — Congratulations |

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
