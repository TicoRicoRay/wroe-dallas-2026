# AV Package — WRoEOS North Texas 2026

**Event:** Monday, September 14, 2026 · The Statler Dallas · Grand Ballroom
**AV lead:** Ray Myers · 469-939-9746 · ray.myers@eosworldwide.com
**Encore/Statler AV contact:** Fermin Martinez · 214-690-5211 · fermin.martinez@encoreglobal.com

Everything the AV team needs for show day is in this folder.

## Files

| File | What it is | How to use it |
| --- | --- | --- |
| **AV-Timeline.docx** | Minute-by-minute run of show with music cues, deck cues, and speaker walk-on assignments. Every playlist, song, timer URL, phone number, and email is a clickable link. | Open in Word. Follow top to bottom on show day. Edit last-minute changes directly (e.g., Winters walk-on song when it arrives). |
| **Timer.url** | Windows shortcut to the break timer page (https://EOSNorthTexas.com/timer) | Double-click to open in the default browser. The page shows the countdown AND the scrolling sponsor logo marquee. Use for every break. |
| **Celebrations-Loop.pptx** | 18-slide auto-looping customer wins deck (advances 8s per slide) | Optional. Use during breaks on the main projector as a second visual, or leave the timer page up. |

## Related files elsewhere in the repo

- `deliverables/speaker-decks/` — each presenter's own deck (open at their handoff)

## Show-day quick start

1. Open `Timer.url` on the main output. Leave it up during registration.
2. Open `AV-Timeline.docx` in Word. Ctrl-click the Spotify links to open playlists in the browser.
3. Follow the timeline top to bottom.

**Note on Spotify links:** Song links use `?t=SECONDS` to jump to the walk-on start time. This works in the Spotify **web player** (open.spotify.com in a browser) but the desktop app ignores it and starts at 0:00. If you use the desktop app, seek manually — start times are listed in the Notes column.

**One-click break countdowns:** The timer page accepts a `?to=HH:MM` query string (24-hour local time). Every break row in the timeline has a direct link that opens the timer and auto-starts counting down to the next scheduled resume time — no need to manually pick a duration. Examples:

- `https://eosnorthtexas.com/timer/?to=9:50` — count down to 9:50 AM
- `https://eosnorthtexas.com/timer/?to=13:10` — count down to 1:10 PM (24-hour)
- `https://eosnorthtexas.com/timer/?to=1:10pm` — same thing, 12-hour with suffix
- `https://eosnorthtexas.com/timer/?min=15` — 15-minute countdown
- Add `&auto=0` to open configured but paused.

## Sunday sound check

- Ann Sheu's deck is in `deliverables/speaker-decks/Ann_Sheu_Get_A_Grip.pptx` (also in the Drive Speaker Decks folder). No USB needed.
- Confirm Mark C. Winters' walk-on song (still "TBD" as of Sep 11).
