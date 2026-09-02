# Attendee Workbook

Print-ready workbook for WRoEOS North Texas 2026 attendees.

## Files

- `build_workbook.js` — generator script (Node.js, uses `docx` npm module)
- `splice_handouts.py` — post-build step: splices presenter handout PDFs into `Workbook.pdf`
- `download_photos.py` — pulls EOSI headshots from the roster and resizes to 400×400
- `Workbook.docx` — generated Word document (editable)
- `Workbook.pdf` — print-ready PDF export (with handouts spliced in)
- `appendix/` — presenter handout PDFs that get spliced into `Workbook.pdf`
- `assets/eosi/` — downloaded EOSI headshots
- `assets/sponsors/` — sponsor logos, converted to 400px-tall PNG
- `assets/books/` — hardcover book covers

## Structure

Paid-PM scope (starts at Mark Stanley 1:00 PM). Final PDF is 22 pages after handout splicing.

1. Cover
2. Welcome letter (placeholder)
3. Agenda (single page, auto-generated from `config.js`)
4. Speaker sections — 3 speakers, 3 pages each: cover + content/handout lead-in + notes
   - Mark Stanley (pages 4–6)
   - Beth Fahey (pages 7–9)
   - Mark C. Winters (pages 10–12 in docx; **pages 10–14 in PDF** after 2-page handout is spliced between the lead-in and notes)
5. Your Books (Data, Rollout, Visionary)
6. Sponsors (grouped by tier, all 17 verified sponsors)
7. DFW EOSI Directory (40 profiles, sorted by last name, with photos + contact + profile URL)
8. Back cover

Format: US Letter portrait, 0.75" margins, Calibri body, navy/orange EOS palette.

## Rebuild

```bash
node build_workbook.js                        # writes Workbook.docx (20 pages)
soffice --headless --convert-to pdf Workbook.docx --outdir .   # → Workbook.pdf (20 pages)
python splice_handouts.py                     # splices handouts → Workbook.pdf (22 pages)
```

The script reads sponsor data from `../../config.js` (single source of truth) and roster data from `/home/user/workspace/eosi-directory-work/final_roster.json`. Update either source and re-run to regenerate.

## Presenter handouts

Handouts live in `appendix/` and are declared per-session in `build_workbook.js` via a `handout: { file, pages, caption }` object on the session config. `splice_handouts.py` finds the correct insertion point by matching the session's `· HANDOUT` heading on the lead-in page. Add more handouts by dropping a PDF in `appendix/` and adding a matching entry to `HANDOUTS` in the script.

Current handouts:
- `appendix/10-Pillars-Handout.pdf` — 2 pages (Mark C. Winters, forwarded by Shane Spillers 2026-09-02)

## Known placeholders (fill later)

- Welcome letter body
- Mark Stanley content page (still generic placeholder)
- Beth Fahey content page (still generic placeholder)
