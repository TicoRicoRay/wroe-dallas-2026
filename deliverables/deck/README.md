# WRoEOS North Texas 2026 — Event Deck

## Files

- `Deck.pptx` — main presentation deck (28 slides). Open in PowerPoint or Google Slides.
- `CountdownTimer.bas` — VBA source for adding a live mm:ss countdown timer to the break slides. Optional.
- `build_deck.js` — generator script (Node.js + pptxgenjs). Run `node build_deck.js` to rebuild.

## Deck contents (28 slides)

| # | Slide | Notes |
|---|---|---|
| 1–5 | Pre-event loop | Welcome, Wi-Fi, Essentials, Hashtag, Countdown to 8:00 |
| 6 | Emcee open — Fifth Annual welcome | 60–90s notes |
| 7 | Session 1 intro — Ann Sheu | + speaker canvas (slide 8) |
| 9 | Morning break — 20 min + all sponsors | |
| 10 | Session 2 intro — Strety | + canvas (11) |
| 12 | Transition — 15 min | |
| 13 | Session 3 intro — System of Selling | + canvas (14) |
| 15 | Session 4 intro — Walt Brown lunch | + canvas (16), runs continuously into Mark Stanley |
| 17 | Session 5 intro — Mark Stanley | + canvas (18) |
| 19 | Afternoon break — 20 min | |
| 20 | Session 6 intro — Beth Fahey | + canvas (21) |
| 22 | Final break — 20 min | |
| 23 | Sponsor thank-you page 1 — Title/Book/Happy Hour/Lounge | |
| 24 | Sponsor thank-you page 2 — Swag Bag + Booth | |
| 25 | Session 7 intro — Mark C. Winters | + canvas (26) |
| 27 | Happy Hour close — 6:15 PM with Ninety.io logo | |

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
python /home/user/workspace/skills/office/pptx/scripts/repair.py Deck.pptx
```
