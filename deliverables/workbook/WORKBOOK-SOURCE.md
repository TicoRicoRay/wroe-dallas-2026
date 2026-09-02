# Workbook Source of Truth

**`Workbook.docx` is the source of truth. Edit it directly in Microsoft Word.**

As of commit after `56b850d` (2026-09-02), the workbook is no longer
regenerated from a script. Ray took over hand-editing the .docx in Word.

## Rules

1. Edit `Workbook.docx` in Word. Commit and push.
2. Regenerate the PDF whenever the .docx changes:
   ```bash
   cd /home/user/workspace/wroe-dallas-2026/deliverables/workbook
   soffice --headless --convert-to pdf Workbook.docx --outdir .
   ```
   Commit `Workbook.pdf` alongside `Workbook.docx`.
3. **Do not run `build_workbook.js.archived`.** It is retained only for
   historical reference — running it would overwrite Ray's hand edits.

## What the archived script produced

The final v3 output (paid-PM scope, 20 pages) is preserved in the
tracked `Workbook.docx` and `Workbook.pdf`. That's the starting point
for all future hand edits.

## If you ever need to rebuild from scratch

If a full regeneration is truly needed (rare), rename the archive back:

```bash
git mv build_workbook.js.archived build_workbook.js
NODE_PATH=/home/user/node_modules node build_workbook.js
```

Then coordinate with Ray before overwriting the tracked `Workbook.docx`.
