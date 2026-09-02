# WRoEOS North Texas 2026 — Event Deck (Paid-Day / PM Scope)

## Scope

This deck covers the **paid afternoon only**. The free morning (Ann Sheu,
Strety, System of Selling) and Walt Brown’s lunch (Healthy Matters / 7 Critical
Needs) are **not** in this deck — they run from their own materials. The
pre-event loop is designed to play from ~12:30 PM as guests return from lunch;
the Event show starts at Mark Stanley’s 1:00 PM session.

## Files

- `Deck.pptx` — main presentation deck (17 slides, 16:9). Open in PowerPoint (desktop) for timings.
- `speaker-decks/` — external presenter decks referenced by the master deck:
  - `Profit-Power-Deck.pptx` — Mark Stanley (1:00 PM)
  - `10-Pillars-of-Visionary-Greatness.pptx` — Mark C. Winters (4:45 PM)
- `CountdownTimer.bas` — VBA source for adding a live mm:ss countdown timer to the break slides. Optional.
- `build_deck.js` — generator script (Node.js + pptxgenjs). Run `node build_deck.js` to rebuild.
- `post_build_timings.py` — injects 15s auto-advance on slides 1–5 and defines the two Custom Shows.
- `build_av_sheet.py` — generates the 2-page `AV-Team-Instructions.pdf` handout.

## Deck contents (17 slides)

| # | Slide | Notes |
|---|---|---|
| 1–5 | Pre-event loop | Welcome (“Afternoon Program · Resumes at 1:00 PM”), Wi-Fi, Essentials, Hashtag, Countdown to 1:00 |
| 6 | Emcee open — Fifth Annual welcome back from lunch | 60–90s notes |
| 7 | Session 1 cover — Mark Stanley (1:00–2:30 PM) | |
| 8 | Mark Stanley canvas | OPEN PRESENTER DECK → `speaker-decks/Profit-Power-Deck.pptx` |
| 9 | Afternoon break — 20 min | |
| 10 | Session 2 cover — Beth Fahey (2:50–4:25 PM) | |
| 11 | Beth Fahey canvas | Presenter drives from here inside the master deck |
| 12 | Final break — 20 min | |
| 13 | Sponsor thank-you page 1 — Title/Book/Happy Hour/Lounge | |
| 14 | Sponsor thank-you page 2 — Swag Bag + Booth | |
| 15 | Session 3 cover — Mark C. Winters (4:45–6:15 PM) | |
| 16 | Winters canvas | OPEN PRESENTER DECK → `speaker-decks/10-Pillars-of-Visionary-Greatness.pptx` |
| 17 | Happy Hour close — 6:15 PM with Ninety.io logo | |

Custom Shows: **Pre-Event Loop** = slides 1–5, **Event** = slides 6–17.
Every non-speaker slide has emcee notes in the Notes pane.

## Adding the live countdown timer (optional)

The break slides show static countdown values (e.g. `20:00`). To make them count down live during the show:

1. Open `Deck.pptx` in PowerPoint (desktop, not web).
2. **File > Save As**, choose type **PowerPoint Macro-Enabled Presentation (.pptm)**.
3. Press **Alt+F11** to open the VBA editor.
4. **Insert > Module**, then paste the entire contents of `CountdownTimer.bas`.
5. In the Project pane, double-click **ThisPresentation** and paste this event hook:

   ```vba
   Private Sub App_SlideShowNextSlide(ByVal Wn As SlideShowWindow)
       CountdownTimer.StartCountdownOnSlide Wn.View.Slide.SlideIndex
   End Sub

   Private WithEvents App As Application

   Private Sub Presentation_Open()
       Set App = Application
   End Sub
   ```

6. **File > Save** (keep .pptm).
7. Close and reopen. When prompted, **enable macros**.

Now during Slide Show, every break slide auto-counts down mm:ss.

## Companion HTML timer

For venues where macros are blocked, use the companion timer at:

  https://eosnorthtexas.com/timer

Open it on a second display or a laptop screen visible to the emcee. Presets for 10/15/20-minute breaks; big legible mm:ss; audible "time's up" chime at zero.

## Rebuilding the deck

```bash
cd /home/user/workspace/wroe-dallas-2026/deliverables/deck
NODE_PATH=/home/user/node_modules node build_deck.js
python post_build_timings.py
python /home/user/workspace/skills/office/pptx/scripts/repair.py Deck.pptx
python build_av_sheet.py     # rebuilds AV-Team-Instructions.pdf
```
