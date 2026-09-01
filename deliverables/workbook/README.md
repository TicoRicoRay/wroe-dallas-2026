# Attendee Workbook

Print-ready workbook for WRoEOS North Texas 2026 attendees.

## Files

- `build_workbook.js` — generator script (Node.js, uses `docx` npm module)
- `download_photos.py` — pulls EOSI headshots from the roster and resizes to 400×400
- `Workbook.docx` — generated Word document (editable)
- `Workbook.pdf` — print-ready PDF export
- `assets/eosi/` — downloaded EOSI headshots
- `assets/sponsors/` — sponsor logos, converted to 400px-tall PNG
- `assets/books/` — hardcover book covers

## Structure

1. Cover
2. Welcome letter (placeholder)
3. Agenda (single page, auto-generated from `config.js`)
4. Speaker sections (7 × 3 pages each = 21 pages: cover + content placeholder + notes)
5. Your Books (Data, Rollout, Visionary)
6. Sponsors (grouped by tier, all 17 verified sponsors)
7. DFW EOSI Directory (40 profiles, sorted by last name, with photos + contact + profile URL)
8. Back cover

Format: US Letter portrait, 0.75" margins, Calibri body, navy/orange EOS palette.

## Rebuild

```bash
node build_workbook.js
soffice --headless --convert-to pdf Workbook.docx
```

The script reads sponsor data from `../../config.js` (single source of truth) and roster data from `/home/user/workspace/eosi-directory-work/final_roster.json`. Update either source and re-run to regenerate.

## Known placeholders (fill later)

- Welcome letter body
- Each speaker's content page (1–4 pages per speaker — currently one placeholder page)
