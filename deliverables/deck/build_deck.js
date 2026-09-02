#!/usr/bin/env node
/**
 * WRoEOS North Texas 2026 — Event Presentation Deck
 * 16:9 PowerPoint. Emcee notes on every non-speaker slide.
 * Data-driven from ../workbook/../config.js (agenda + sponsors) and
 * a local speakers config (below).
 *
 * Requires: pptxgenjs (installed at /home/user/node_modules)
 */

'use strict';

process.chdir(__dirname);
require('module').Module._initPaths(); // reset
// Point NODE_PATH at /home/user/node_modules for pptxgenjs
process.env.NODE_PATH = '/home/user/node_modules:' + (process.env.NODE_PATH || '');
require('module').Module._initPaths();

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// ====== LOAD SITE CONFIG (agenda + sponsors) ======
const configSrc = fs.readFileSync(path.join(__dirname, '../../config.js'), 'utf8')
  .replace(/const SITE_CONFIG/, 'SITE_CONFIG');
let SITE_CONFIG;
eval(configSrc);

// ====== DESIGN TOKENS (match website + workbook) ======
const NAVY       = '0B1F3A';
const NAVY_LIGHT = '1A2E4A';
const ORANGE     = 'E87722';
const ORANGE_DK  = 'B85A15';
const WHITE      = 'FFFFFF';
const TEXT       = '1A1A1A';
const TEXT_MUTED = '2A3441';   // darker for footer legibility on white
const BG_TINT    = 'F4F6F9';
const RULE       = 'C9D2DE';

const FONT_HEAD = 'Calibri';
const FONT_BODY = 'Calibri';

// ====== ASSETS ======
const SPONSOR_DIR = path.join(__dirname, '../workbook/assets/sponsors');
const BOOKS_DIR   = path.join(__dirname, '../workbook/assets/books');

// ====== SPEAKER SESSIONS (paid PM only) ======
// Free morning + Walt's lunch are NOT in this deck. The Event show starts at
// Mark Stanley (1:00 PM). Two of the three sessions hand off to an external
// speaker deck under speaker-decks/.
const SESSIONS = [
  {
    time: '1:00 – 2:30 PM',
    title: 'Profit Power: Stronger — or Just Bigger?',
    speaker: 'Mark Stanley',
    credential: 'Expert EOS Implementer®',
    intro: "In this session we're going to challenge one of the most common assumptions in business — that growth equals health. Mark Stanley, Expert EOS Implementer and author of Data, is going to help you decide whether you're really getting stronger or just getting bigger. Please welcome Mark Stanley.",
    externalDeck: 'Profit-Power-Deck.pptx',
  },
  {
    time: '2:50 – 4:25 PM',
    title: 'Rollout, Reworked: Running EOS Company-Wide',
    speaker: 'Beth Fahey',
    credential: 'Expert EOS Implementer®',
    intro: "Getting EOS to the leadership team is one thing. Getting it all the way through the organization is another. Beth Fahey, Expert EOS Implementer and author of Rollout, is going to give you the field-tested playbook. Please welcome Beth Fahey.",
  },
  {
    time: '4:45 – 6:15 PM',
    title: 'The 10 Pillars of Visionary Greatness',
    speaker: 'Mark C. Winters',
    credential: 'Expert EOS Implementer®',
    intro: "We save the very best for last. Mark C. Winters — Expert EOS Implementer and co-author of Rocket Fuel and Visionary — is going to walk us through the ten pillars of Visionary greatness. Please welcome Mark C. Winters.",
    externalDeck: '10-Pillars-of-Visionary-Greatness.pptx',
  },
];

// ====== HELPERS ======
function resolveSponsorLogo(sponsor) {
  const base = path.basename(sponsor.logo).replace(/\.(svg|jpg|jpeg|webp)$/i, '.png');
  const p = path.join(SPONSOR_DIR, base);
  return fs.existsSync(p) ? p : null;
}

function getVerifiedSponsors() {
  return SITE_CONFIG.sponsors.sponsors.filter(s => s.verified);
}

/** Add a centered footer bar with WRoEOS branding. */
function addFooterBar(slide, opts = {}) {
  const bg = opts.bg || WHITE;
  const fg = opts.fg || TEXT_MUTED;
  slide.addShape('rect', {
    x: 0, y: 7.3, w: 13.333, h: 0.2,
    fill: { color: opts.barColor || ORANGE }, line: { color: opts.barColor || ORANGE },
  });
  slide.addText('WE RUN ON EOS® NORTH TEXAS  ·  SEPTEMBER 14, 2026', {
    x: 0.5, y: 7.05, w: 8, h: 0.25,
    fontSize: 9, fontFace: FONT_HEAD, color: fg, bold: true, charSpacing: 4,
  });
  slide.addText('#WRoENorthTexas2026', {
    x: 5.5, y: 7.05, w: 7.3, h: 0.25,
    fontSize: 9, fontFace: FONT_HEAD, color: fg, align: 'right',
  });
}

/** Compute aspect-correct image size. */
const sizeCache = {};
function imgSize(p) {
  if (sizeCache[p]) return sizeCache[p];
  const { execSync } = require('child_process');
  const [w, h] = execSync(`identify -format "%w %h" '${p}'`).toString().trim().split(' ').map(Number);
  sizeCache[p] = { w, h };
  return sizeCache[p];
}

function fitBox(imgPath, maxW, maxH) {
  const { w, h } = imgSize(imgPath);
  const r = w / h;
  let outW = maxW, outH = maxW / r;
  if (outH > maxH) { outH = maxH; outW = maxH * r; }
  return { w: outW, h: outH };
}

// ====== PRESENTATION SETUP ======
const pptx = new PptxGenJS();
pptx.author = 'WRoEOS North Texas';
pptx.company = 'North Texas EOS Community';
pptx.title = 'WRoEOS North Texas 2026 — Event Deck';
pptx.subject = 'Event day presentation deck for emcees, break loops, and session intros';
pptx.layout = 'LAYOUT_WIDE';   // 13.333 × 7.5 in

// ==============================================================
// PRE-EVENT LOOP (5 slides that auto-advance before doors open)
// ==============================================================
function makePreEventLoop() {
  // Slide 1: Welcome / Doors open at
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText('WELCOME', {
      x: 0.5, y: 1.2, w: 12.333, h: 0.5,
      fontSize: 18, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
    });
    s.addText('We Run on EOS®', {
      x: 0.5, y: 1.9, w: 12.333, h: 1.2,
      fontSize: 72, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
    });
    s.addText('North Texas 2026', {
      x: 0.5, y: 3.1, w: 12.333, h: 0.8,
      fontSize: 44, fontFace: FONT_HEAD, color: WHITE, align: 'center',
    });
    s.addText('Afternoon Program  ·  Resumes at 1:00 PM', {
      x: 0.5, y: 4.5, w: 12.333, h: 0.5,
      fontSize: 22, fontFace: FONT_BODY, color: ORANGE, align: 'center', italic: true,
    });
    s.addText('Grab coffee. Say hello. Take a seat near the front.', {
      x: 0.5, y: 5.1, w: 12.333, h: 0.4,
      fontSize: 16, fontFace: FONT_BODY, color: WHITE, align: 'center',
    });
    addFooterBar(s, { bg: NAVY, fg: WHITE, barColor: ORANGE });
    s.addNotes('[Pre-event loop — plays 12:30–1:00 PM as guests return from Walt Brown’s lunch. No emcee needed. Slide auto-advances every 15 seconds.]');
  }
  // Slide 2: Wi-Fi
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText('WI-FI', {
      x: 0.5, y: 1.2, w: 12.333, h: 0.5,
      fontSize: 18, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
    });
    s.addText('Connect while you settle in', {
      x: 0.5, y: 1.9, w: 12.333, h: 0.7,
      fontSize: 32, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
    });
    // Network card
    s.addShape('roundRect', {
      x: 3.5, y: 3.2, w: 6.333, h: 1.1, fill: { color: NAVY_LIGHT }, line: { color: ORANGE, width: 1 }, rectRadius: 0.1,
    });
    s.addText('NETWORK', {
      x: 3.7, y: 3.3, w: 6, h: 0.3, fontSize: 12, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 8,
    });
    s.addText('WRoEOS-Guest', {
      x: 3.7, y: 3.65, w: 6, h: 0.55, fontSize: 32, fontFace: FONT_HEAD, color: WHITE, bold: true,
    });
    // Password card
    s.addShape('roundRect', {
      x: 3.5, y: 4.5, w: 6.333, h: 1.1, fill: { color: NAVY_LIGHT }, line: { color: ORANGE, width: 1 }, rectRadius: 0.1,
    });
    s.addText('PASSWORD', {
      x: 3.7, y: 4.6, w: 6, h: 0.3, fontSize: 12, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 8,
    });
    s.addText('RunOnEOS2026', {
      x: 3.7, y: 4.95, w: 6, h: 0.55, fontSize: 32, fontFace: FONT_HEAD, color: WHITE, bold: true,
    });
    addFooterBar(s, { bg: NAVY, fg: WHITE });
    s.addNotes('[Pre-event loop — no emcee needed. Placeholder Wi-Fi credentials — replace with actual venue values before event day.]');
  }
  // Slide 3: Restrooms & Coffee
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText('THE ESSENTIALS', {
      x: 0.5, y: 1.2, w: 12.333, h: 0.5,
      fontSize: 18, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
    });
    // Two columns: Restrooms | Coffee
    const cardY = 2.5, cardH = 3.2;
    ['RESTROOMS', 'COFFEE & PASTRIES'].forEach((label, i) => {
      const cx = i === 0 ? 1.5 : 7.0;
      s.addShape('roundRect', {
        x: cx, y: cardY, w: 4.833, h: cardH, fill: { color: NAVY_LIGHT }, line: { color: ORANGE, width: 1 }, rectRadius: 0.15,
      });
      s.addText(label, {
        x: cx + 0.3, y: cardY + 0.4, w: 4.233, h: 0.5, fontSize: 14, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 8,
      });
      const detail = i === 0
        ? 'Down the main hallway,\npast the registration desk,\non your right.'
        : 'Just outside the ballroom,\nnear the sponsor lounge.\nRefreshed at every break.';
      s.addText(detail, {
        x: cx + 0.3, y: cardY + 1.1, w: 4.233, h: 1.9, fontSize: 22, fontFace: FONT_BODY, color: WHITE, align: 'left',
      });
    });
    addFooterBar(s, { bg: NAVY, fg: WHITE });
    s.addNotes('[Pre-event loop — no emcee needed. Replace directional details with actual venue layout.]');
  }
  // Slide 4: Hashtag / Socials
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText('SHARE THE DAY', {
      x: 0.5, y: 1.2, w: 12.333, h: 0.5,
      fontSize: 18, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
    });
    s.addText('#WRoENorthTexas2026', {
      x: 0.5, y: 2.4, w: 12.333, h: 1.4,
      fontSize: 64, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
    });
    s.addText('Post a photo. Tag your favorite session. Tell someone what you learned.', {
      x: 0.5, y: 4.3, w: 12.333, h: 0.6,
      fontSize: 20, fontFace: FONT_BODY, color: ORANGE, italic: true, align: 'center',
    });
    addFooterBar(s, { bg: NAVY, fg: WHITE });
    s.addNotes('[Pre-event loop — no emcee needed.]');
  }
  // Slide 5: Countdown / Start soon
  {
    const s = pptx.addSlide();
    s.background = { color: NAVY };
    s.addText('WE START AT', {
      x: 0.5, y: 1.8, w: 12.333, h: 0.6,
      fontSize: 20, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
    });
    s.addText('1:00', {
      x: 0.5, y: 2.5, w: 12.333, h: 2.4,
      fontSize: 220, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
    });
    s.addText('Please find your seat.', {
      x: 0.5, y: 5.2, w: 12.333, h: 0.5,
      fontSize: 22, fontFace: FONT_BODY, color: WHITE, italic: true, align: 'center',
    });
    addFooterBar(s, { bg: NAVY, fg: WHITE });
    s.addNotes('[Pre-event loop — no emcee needed. Displays 5 minutes before 1:00 PM to prompt seating.]');
  }
}

// ==============================================================
// EMCEE OPENING
// ==============================================================
function makeEmceeOpen() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  // Orange top accent bar
  s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.4, fill: { color: ORANGE }, line: { color: ORANGE } });
  s.addText('FIFTH ANNUAL', {
    x: 0.75, y: 1.3, w: 12, h: 0.5,
    fontSize: 20, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 10,
  });
  s.addText('We Run on EOS®', {
    x: 0.75, y: 1.85, w: 12, h: 1.3,
    fontSize: 76, fontFace: FONT_HEAD, color: NAVY, bold: true,
  });
  s.addText('North Texas 2026', {
    x: 0.75, y: 3.15, w: 12, h: 0.9,
    fontSize: 46, fontFace: FONT_HEAD, color: NAVY,
  });
  s.addText('Welcome back — let\u2019s bring it home.', {
    x: 0.75, y: 4.6, w: 12, h: 0.6,
    fontSize: 22, fontFace: FONT_BODY, color: TEXT_MUTED, italic: true,
  });
  addFooterBar(s);
  s.addNotes(
    "EMCEE OPEN (60-90 seconds) — Paid-Day Return from Lunch:\n\n" +
    "Welcome back, North Texas. Hope you enjoyed lunch and the conversation with Walt Brown — the 7 Critical Needs is going to stick with you.\n\n" +
    "Quick reminders as we get into the paid workshops. Restrooms are down the main hallway on your right. Wi-Fi info is on the pre-event slides if you missed it. Please silence your phones — not off, silence — because we want you posting from every session this afternoon. Hashtag is #WRoENorthTexas2026.\n\n" +
    "This afternoon: three of the best Expert EOS Implementers in the country, three hardcover books in your bag, and a Happy Hour at 6:15 that you will not want to miss.\n\n" +
    "Let\u2019s kick this off. Please welcome to the stage — Expert EOS Implementer and author of Data, Mark Stanley."
  );
}

// ==============================================================
// SESSION INTRO SLIDES (one per session)
// ==============================================================
function makeSessionIntro(session, idx) {
  // Cover slide
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  // Small orange rule top
  s.addShape('rect', { x: 0.75, y: 0.6, w: 1.5, h: 0.06, fill: { color: ORANGE }, line: { color: ORANGE } });
  s.addText(`SESSION ${idx + 1}  ·  ${session.time}`, {
    x: 0.75, y: 0.85, w: 12, h: 0.4,
    fontSize: 16, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 8,
  });
  // Title (auto-fit)
  s.addText(session.title, {
    x: 0.75, y: 1.6, w: 12, h: 2.4,
    fontSize: 54, fontFace: FONT_HEAD, color: WHITE, bold: true, valign: 'top',
    autoFit: true,
  });
  if (session.subtitle) {
    s.addText(session.subtitle, {
      x: 0.75, y: 4.1, w: 12, h: 0.7,
      fontSize: 22, fontFace: FONT_BODY, color: 'D4DFEA', italic: true,
    });
  }
  // Presenter block
  s.addText('PRESENTED BY', {
    x: 0.75, y: 5.4, w: 12, h: 0.3,
    fontSize: 12, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 8,
  });
  s.addText(session.speaker, {
    x: 0.75, y: 5.7, w: 12, h: 0.7,
    fontSize: 40, fontFace: FONT_HEAD, color: WHITE, bold: true,
  });
  s.addText(session.credential, {
    x: 0.75, y: 6.4, w: 12, h: 0.4,
    fontSize: 18, fontFace: FONT_BODY, color: 'D4DFEA', italic: true,
  });
  addFooterBar(s, { bg: NAVY, fg: 'D4DFEA' });
  s.addNotes(`EMCEE INTRO (30-45 seconds):\n\n${session.intro}`);

  // Speaker content placeholder — either a working canvas or an explicit
  // handoff card pointing at the speaker's own deck (staged in ./speaker-decks/).
  const p = pptx.addSlide();
  p.background = { color: WHITE };
  p.addText(session.title, {
    x: 0.75, y: 0.55, w: 12, h: 0.55,
    fontSize: 20, fontFace: FONT_HEAD, color: NAVY, bold: true,
  });
  p.addText(`${session.speaker}  ·  ${session.time}`, {
    x: 0.75, y: 1.05, w: 12, h: 0.3,
    fontSize: 11, fontFace: FONT_BODY, color: ORANGE, bold: true, charSpacing: 4,
  });
  // Thin orange rule under header
  p.addShape('rect', { x: 0.75, y: 1.45, w: 1.2, h: 0.04, fill: { color: ORANGE }, line: { color: ORANGE } });

  if (session.externalDeck) {
    // Handoff card: presenter opens their own file for the actual session content.
    p.addShape('roundRect', {
      x: 0.75, y: 1.75, w: 11.8, h: 5.1,
      fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.08,
    });
    p.addText('OPEN PRESENTER DECK', {
      x: 0.75, y: 2.4, w: 11.8, h: 0.4,
      fontSize: 12, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 10, align: 'center',
    });
    p.addText(session.externalDeck, {
      x: 0.75, y: 2.95, w: 11.8, h: 0.9,
      fontSize: 36, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
    });
    p.addText(`located in \\speaker-decks\\  ·  presenter drives from here`, {
      x: 0.75, y: 4.05, w: 11.8, h: 0.4,
      fontSize: 14, fontFace: FONT_BODY, color: 'D4DFEA', italic: true, align: 'center',
    });
    p.addText('When session ends, press Esc and return to this master deck to continue.', {
      x: 0.75, y: 5.6, w: 11.8, h: 0.4,
      fontSize: 12, fontFace: FONT_BODY, color: 'A9B4C4', align: 'center',
    });
    addFooterBar(p, { bg: NAVY, fg: 'D4DFEA' });
    p.addNotes(
      `AV HANDOFF for ${session.speaker}:\n\n` +
      `1. Press Esc to exit this master deck.\n` +
      `2. Open speaker-decks\\${session.externalDeck} in PowerPoint.\n` +
      `3. Press F5 to run the presenter's deck.\n` +
      `4. When they finish, Esc and re-open Deck.pptx > Custom Show > Event to continue on the next slide.`
    );
  } else {
    // Working canvas (subtle frame, not dashed)
    p.addShape('roundRect', {
      x: 0.75, y: 1.75, w: 11.8, h: 5.1,
      fill: { color: BG_TINT }, line: { color: RULE, width: 0.75 }, rectRadius: 0.08,
    });
    p.addText('SPEAKER CONTENT', {
      x: 0.75, y: 4.05, w: 11.8, h: 0.3,
      fontSize: 11, fontFace: FONT_HEAD, color: 'A9B4C4', bold: true, charSpacing: 8, align: 'center',
    });
    p.addText('Replace this slide with your presentation, or use it as a working canvas.', {
      x: 0.75, y: 4.4, w: 11.8, h: 0.4,
      fontSize: 13, fontFace: FONT_BODY, color: 'A9B4C4', italic: true, align: 'center',
    });
    addFooterBar(p);
    p.addNotes(`[Speaker canvas for ${session.speaker}. Replace with the presenter's deck, or annotate live.]`);
  }
}

// ==============================================================
// BREAK SLIDE with sponsor rotation strip
// ==============================================================
function makeBreakSlide(opts) {
  const { label, duration, resumeAt, notes } = opts;
  const s = pptx.addSlide();
  s.background = { color: NAVY };

  // Header label
  s.addText(label.toUpperCase(), {
    x: 0.5, y: 0.6, w: 12.333, h: 0.5,
    fontSize: 18, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
  });

  // Countdown number — objectName tagged so the VBA macro (in .pptm build) can find it
  // and count down mm:ss in real time. In the plain .pptx build, it stays static at NN:00.
  s.addText(`${duration}:00`, {
    x: 0.5, y: 1.15, w: 12.333, h: 2.5,
    fontSize: 180, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
    objectName: `CountdownTimer_${duration}`,
  });
  s.addText('minutes remaining', {
    x: 0.5, y: 3.75, w: 12.333, h: 0.4,
    fontSize: 18, fontFace: FONT_BODY, color: 'D4DFEA', italic: true, align: 'center',
  });
  s.addText(`We resume at ${resumeAt}`, {
    x: 0.5, y: 4.2, w: 12.333, h: 0.4,
    fontSize: 18, fontFace: FONT_BODY, color: ORANGE, bold: true, align: 'center',
  });

  // Sponsor showcase — ALL sponsors, tier-organized in a compact 2-row strip
  const stripY = 4.9, stripH = 2.4;
  s.addShape('rect', {
    x: 0.5, y: stripY, w: 12.333, h: stripH, fill: { color: WHITE }, line: { color: RULE, width: 0.5 },
  });
  s.addText('THANK YOU TO OUR SPONSORS', {
    x: 0.5, y: stripY + 0.08, w: 12.333, h: 0.28,
    fontSize: 10, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 6, align: 'center',
  });
  // Row 1: major sponsors (title + book + happyHour + lounge) = 6 logos, larger
  const majors = getVerifiedSponsors().filter(sp => ['title', 'book', 'happyHour', 'lounge'].includes(sp.tier));
  drawLogoRow(s, majors, { y: stripY + 0.45, maxH: 0.75, cols: majors.length, stripInnerW: 11.5, xLeft: 0.917 });
  // Row 2: swag + booth = 10 logos, smaller
  const community = getVerifiedSponsors().filter(sp => ['swag', 'booth'].includes(sp.tier));
  drawLogoRow(s, community, { y: stripY + 1.4, maxH: 0.55, cols: community.length, stripInnerW: 11.9, xLeft: 0.717 });
  addFooterBar(s, { bg: NAVY, fg: 'D4DFEA' });
  s.addNotes(notes || `[Break slide. All sponsors displayed. Countdown timer available separately.]`);
}

// ==============================================================
// LUNCH LOOP PLACEHOLDER
// ==============================================================
function makeLunchLoop() {
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addText('LUNCH', {
    x: 0.5, y: 0.8, w: 12.333, h: 0.6,
    fontSize: 22, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
  });
  s.addText('Success Stories from the North Texas EOS Community', {
    x: 0.5, y: 1.6, w: 12.333, h: 0.8,
    fontSize: 32, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
  });
  // Placeholder card
  s.addShape('roundRect', {
    x: 2, y: 3, w: 9.333, h: 3, fill: { color: NAVY_LIGHT }, line: { color: ORANGE, width: 1, dashType: 'dash' }, rectRadius: 0.15,
  });
  s.addText('[Customer success story slides go here]', {
    x: 2, y: 3.8, w: 9.333, h: 0.6,
    fontSize: 22, fontFace: FONT_BODY, color: 'D4DFEA', italic: true, align: 'center',
  });
  s.addText('Rotating 6–8 client wins from the community — 30 seconds each', {
    x: 2, y: 4.4, w: 9.333, h: 0.5,
    fontSize: 16, fontFace: FONT_BODY, color: 'D4DFEA', align: 'center',
  });
  addFooterBar(s, { bg: NAVY, fg: 'D4DFEA' });
  s.addNotes(
    "[Lunch loop placeholder — during Walt Brown's lunch session, this can be replaced with a rotating carousel of customer success stories from North Texas EOS companies. Each slide 30 seconds, auto-advance. Collect wins from Implementers in advance.]"
  );
}

// ==============================================================
// SPONSOR THANK-YOU (mid-day and closing)
// ==============================================================
function makeSponsorThankYou(opts = {}) {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  s.addText('THANK YOU', {
    x: 0.5, y: 0.6, w: 12.333, h: 0.5,
    fontSize: 20, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
  });
  s.addText('to our sponsors', {
    x: 0.5, y: 1.15, w: 12.333, h: 0.7,
    fontSize: 40, fontFace: FONT_HEAD, color: NAVY, bold: true, align: 'center',
  });

  // Major tiers only — splits at 5.10/6.15 give clear vertical breathing room
  const sponsors = getVerifiedSponsors();
  const tiers = [
    { key: 'title',     label: 'Title Sponsors',     cols: 2, maxH: 0.95, y: 2.45 },
    { key: 'book',      label: 'Book Sponsors',      cols: 2, maxH: 0.85, y: 3.90 },
    { key: 'happyHour', label: 'Happy Hour Sponsor', cols: 1, maxH: 0.7,  y: 5.30 },
    { key: 'lounge',    label: 'Lounge Sponsor',     cols: 1, maxH: 0.55, y: 6.40 },
  ];
  drawTierGrid(s, sponsors, tiers);
  addFooterBar(s);
  s.addNotes(
    "EMCEE (20-30 seconds):\n\n" +
    "Take a look at the screen — these are the companies that made today possible. Please visit their tables at the break, follow them on LinkedIn, and if any of them can serve your business — reach out. This day exists because of them."
  );
}

// Second sponsor slide — swag + booth sponsors
function makeSponsorThankYou2() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  s.addText('OUR COMMUNITY SPONSORS', {
    x: 0.5, y: 0.6, w: 12.333, h: 0.5,
    fontSize: 20, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
  });
  s.addText('Say hello at their tables', {
    x: 0.5, y: 1.15, w: 12.333, h: 0.6,
    fontSize: 26, fontFace: FONT_HEAD, color: NAVY, italic: true, align: 'center',
  });

  const sponsors = getVerifiedSponsors();
  const swag  = sponsors.filter(sp => sp.tier === 'swag');
  const booth = sponsors.filter(sp => sp.tier === 'booth');

  s.addText('SWAG BAG SPONSORS', {
    x: 0.5, y: 2.35, w: 12.333, h: 0.22,
    fontSize: 10, fontFace: FONT_HEAD, color: TEXT_MUTED, bold: true, charSpacing: 6, align: 'center',
  });
  drawLogoRow(s, swag, { y: 2.65, maxH: 1.0, cols: 2, stripInnerW: 10, xLeft: 1.667 });

  s.addText('BOOTH SPONSORS', {
    x: 0.5, y: 4.05, w: 12.333, h: 0.22,
    fontSize: 10, fontFace: FONT_HEAD, color: TEXT_MUTED, bold: true, charSpacing: 6, align: 'center',
  });
  drawLogoRow(s, booth.slice(0, 4), { y: 4.4,  maxH: 0.85, cols: 4, stripInnerW: 12, xLeft: 0.667 });
  if (booth.length > 4) {
    drawLogoRow(s, booth.slice(4, 8), { y: 5.55, maxH: 0.85, cols: 4, stripInnerW: 12, xLeft: 0.667 });
  }

  addFooterBar(s);
  s.addNotes(
    "EMCEE (15 seconds):\n\n" +
    "One more round of thanks — our community sponsors put swag in your bag and staffed booths in the lounge all day. Stop by, grab a card, and thank them personally."
  );
}

// Helper: draw a tiered stack of centered logo rows
function drawTierGrid(slide, sponsors, tiers) {
  tiers.forEach(t => {
    const list = sponsors.filter(sp => sp.tier === t.key);
    if (list.length === 0) return;
    slide.addText(t.label.toUpperCase(), {
      x: 0.5, y: t.y - 0.24, w: 12.333, h: 0.2,
      fontSize: 10, fontFace: FONT_HEAD, color: TEXT_MUTED, bold: true, charSpacing: 6, align: 'center',
    });
    drawLogoRow(slide, list.slice(0, t.cols), { y: t.y, maxH: t.maxH, cols: t.cols, stripInnerW: 11, xLeft: 1.167 });
  });
}

// Helper: draw a horizontal row of logos, aspect-correct, evenly centered per cell
function drawLogoRow(slide, sponsorList, opts) {
  const { y, maxH, cols, stripInnerW, xLeft } = opts;
  const cellW = stripInnerW / cols;
  sponsorList.forEach((sp, i) => {
    const logo = resolveSponsorLogo(sp);
    if (!logo) return;
    const fit = fitBox(logo, cellW - 0.2, maxH);
    const cxCenter = xLeft + cellW * i + cellW / 2;
    slide.addImage({
      path: logo,
      x: cxCenter - fit.w / 2,
      y: y + (maxH - fit.h) / 2,
      w: fit.w, h: fit.h,
    });
  });
}

// ==============================================================
// HAPPY HOUR CLOSE
// ==============================================================
function makeHappyHourClose() {
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addText('HAPPY HOUR', {
    x: 0.5, y: 0.9, w: 12.333, h: 0.5,
    fontSize: 22, fontFace: FONT_HEAD, color: ORANGE, bold: true, charSpacing: 12, align: 'center',
  });
  s.addText('6:15 PM', {
    x: 0.5, y: 1.55, w: 12.333, h: 1.6,
    fontSize: 130, fontFace: FONT_HEAD, color: WHITE, bold: true, align: 'center',
  });
  // Ninety logo card — white background so brand renders correctly on navy
  const ninetyLogo = path.join(SPONSOR_DIR, 'ninety.png');
  if (fs.existsSync(ninetyLogo)) {
    const cardW = 4.8, cardH = 1.5, cardX = (13.333 - cardW) / 2, cardY = 3.55;
    s.addShape('roundRect', {
      x: cardX, y: cardY, w: cardW, h: cardH,
      fill: { color: WHITE }, line: { color: WHITE }, rectRadius: 0.1,
    });
    s.addText('SPONSORED BY', {
      x: cardX, y: cardY + 0.12, w: cardW, h: 0.25,
      fontSize: 10, fontFace: FONT_HEAD, color: TEXT_MUTED, bold: true, charSpacing: 6, align: 'center',
    });
    const fit = fitBox(ninetyLogo, cardW - 0.6, cardH - 0.55);
    s.addImage({
      path: ninetyLogo,
      x: cardX + (cardW - fit.w) / 2,
      y: cardY + 0.4 + ((cardH - 0.5) - fit.h) / 2,
      w: fit.w, h: fit.h,
    });
  }
  s.addText('Stay. Meet someone new. Celebrate what you learned today.', {
    x: 0.5, y: 5.35, w: 12.333, h: 0.6,
    fontSize: 22, fontFace: FONT_BODY, color: WHITE, align: 'center', italic: true,
  });
  s.addText('See you next year.', {
    x: 0.5, y: 6.05, w: 12.333, h: 0.5,
    fontSize: 18, fontFace: FONT_BODY, color: 'D4DFEA', align: 'center',
  });
  addFooterBar(s, { bg: NAVY, fg: 'D4DFEA' });
  s.addNotes(
    "EMCEE CLOSE (60-90 seconds):\n\n" +
    "That's a wrap on the formal program — but don't leave yet. Happy Hour starts right now, right here, sponsored by our friends at Ninety.io.\n\n" +
    "A few thank-yous. Thank you to every one of our speakers — you gave us your very best today. Thank you to our fifteen sponsors — this doesn't happen without you. Thank you to the venue and the staff for taking care of us all day.\n\n" +
    "And most of all — thank YOU for showing up. Your business is better today than it was this morning. Now go find someone you don't know, buy them a drink, and swap notes. See you at We Run on EOS North Texas 2027."
  );
}

// ==============================================================
// BUILD THE DECK
// ==============================================================
// Paid-PM assembly. Free morning + Walt's lunch are NOT in this deck.
// Pre-event loop plays 12:30–1:00 PM as guests return from lunch.
makePreEventLoop();
makeEmceeOpen();
// Session 1 (paid PM): Mark Stanley
makeSessionIntro(SESSIONS[0], 0);
makeBreakSlide({ label: 'Afternoon Break', duration: '20', resumeAt: '2:50 PM',
  notes: 'EMCEE (20 seconds): "Twenty minute break. Sponsor lounge is open — say hi. Back at 2:50 with Beth Fahey."'});
// Session 2 (paid PM): Beth Fahey
makeSessionIntro(SESSIONS[1], 1);
makeBreakSlide({ label: 'Final Break', duration: '20', resumeAt: '4:45 PM',
  notes: 'EMCEE: "Last break of the day, twenty minutes. Stretch, refuel, then we bring it home with Mark C. Winters."'});
// Sponsor thank-you before final session (2 slides)
makeSponsorThankYou();
makeSponsorThankYou2();
// Session 3 (paid PM): Mark C. Winters
makeSessionIntro(SESSIONS[2], 2);
// Close
makeHappyHourClose();

// ==============================================================
// WRITE OUTPUT
// ==============================================================
const outPath = path.join(__dirname, 'Deck.pptx');
pptx.writeFile({ fileName: outPath })
  .then(fn => console.log(`OK → ${fn}`))
  .catch(err => { console.error('ERROR:', err); process.exit(1); });
