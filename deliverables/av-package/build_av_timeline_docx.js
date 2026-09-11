// Build AV-Timeline.docx for We Run On EOS North Texas 2026
// Landscape US Letter. Every song, playlist, timer URL, and phone/email is a live hyperlink.
// Style: navy/orange banded to match the PDF version.

const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ExternalHyperlink,
  AlignmentType,
  PageOrientation,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
  PageBreak,
  Header,
  Footer,
  LevelFormat,
} = require('docx');

// --- Palette ---
const NAVY = '0B1F3A';
const ORANGE = 'E87722';
const BAND = 'F5F1EA';
const RULE = 'D4D1CA';
const TEXT = '28251D';
const MUTED = '7A7974';
const RED = 'B0000A';
const WHITE = 'FFFFFF';

// --- Song / playlist links ---
const SPOT = {
  countdown: 'https://open.spotify.com/playlist/1Qc0IvwGfUXseHSsWOvkbM',
  walkup: 'https://open.spotify.com/playlist/6SHNkZRoEAFSwBGs2D4wgY',
  alt: 'https://open.spotify.com/playlist/1gMZxRygewYpMXbMwlRDYm',
  lunch: 'https://open.spotify.com/playlist/1hvdE7nwQ5a0RpPPGpXw3b',

  // Track links. ?t=SECONDS is honored by Spotify web player; ignored by the desktop app.
  unstoppable: 'https://open.spotify.com/track/0tq2DVpTlmruzIYCGcb331?t=30',
  antsMarching: 'https://open.spotify.com/track/41HPe7b10ch9QZgmB7Rq26',
  sickness: 'https://open.spotify.com/track/40rvBMQizxkIqnjPdEWY1v',
  noQuestions: 'https://open.spotify.com/track/5rHGRbh5F1oFQ4CdpzFyhN',
  beautifulDay: 'https://open.spotify.com/track/1VuBmEauSZywQVtqbxNqka',
  rollout: 'https://open.spotify.com/track/3gZ5ZvIRAYJOLT91Zz4nts',
  findYourPeople: 'https://open.spotify.com/track/6GuyIXoGIaTw1Pg6Ug9enJ',
  doIEver: 'https://open.spotify.com/track/6A8spBZpLjC8LBPRf2TgJD',
};

const TIMER_URL = 'https://EOSNorthTexas.com/timer';
// Direct-link URLs: one click opens the page and auto-starts the countdown
// to the next scheduled resume time. Query string is parsed by /timer/index.html.
const TIMER_TO = (hhmm) => `${TIMER_URL}/?to=${hhmm}`;

// --- Text helpers ---
const FONT = 'Calibri';

function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, ...opts });
}
function bold(text, opts = {}) {
  return run(text, { bold: true, ...opts });
}
function link(text, url, opts = {}) {
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({ text, font: FONT, style: 'Hyperlink', ...opts })],
  });
}
function p(children, opts = {}) {
  if (typeof children === 'string') children = [run(children)];
  return new Paragraph({ children, ...opts });
}
function pSmall(children, opts = {}) {
  // Small helper — 9pt (18 half-points)
  if (typeof children === 'string') children = [run(children, { size: 18 })];
  return new Paragraph({ children, spacing: { before: 0, after: 0 }, ...opts });
}

// --- Borders ---
const thin = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };

// --- Cell factory ---
function cell(content, opts = {}) {
  const {
    width,
    fill,
    align = AlignmentType.LEFT,
    vAlign = VerticalAlign.TOP,
    columnSpan,
    padding = { top: 80, bottom: 80, left: 100, right: 100 },
  } = opts;
  const children = Array.isArray(content) ? content : [content];
  const tcOpts = {
    borders: cellBorders,
    verticalAlign: vAlign,
    margins: padding,
    children,
  };
  if (width) tcOpts.width = { size: width, type: WidthType.DXA };
  if (fill) tcOpts.shading = { fill, type: ShadingType.CLEAR };
  if (columnSpan) tcOpts.columnSpan = columnSpan;
  return new TableCell(tcOpts);
}

// --- Page geometry ---
// Landscape US Letter. Portrait dims + orientation flag; engine swaps internally.
const PAGE_W = 12240;
const PAGE_H = 15840;
const LEFT_MARGIN = 720;   // 0.5"
const RIGHT_MARGIN = 720;
// Usable landscape width = 15840 - 720 - 720 = 14400
const USABLE = 14400;

// Column widths for main timeline table (sum = 14400)
const COL_TIME = 1500;
const COL_SEGMENT = 3200;
const COL_SCREEN = 2700;
const COL_MUSIC = 3400;
const COL_ACTION = 3600;
const COLS = [COL_TIME, COL_SEGMENT, COL_SCREEN, COL_MUSIC, COL_ACTION];

// -----------------------------------------------------------------------------
// Header cell for main table
// -----------------------------------------------------------------------------
function headerCell(text, width) {
  return cell(
    p([run(text, { bold: true, color: WHITE, size: 20 })]),
    { width, fill: NAVY, padding: { top: 100, bottom: 100, left: 120, right: 120 } }
  );
}

function sectionRow(label) {
  return new TableRow({
    children: [
      cell(
        p([run(label, { bold: true, color: WHITE, size: 20 })]),
        { fill: ORANGE, columnSpan: 5, padding: { top: 80, bottom: 80, left: 120, right: 120 } }
      ),
    ],
  });
}

// -----------------------------------------------------------------------------
// Timeline row builder
// Each row: [time, segmentChildren, screenChildren, musicChildren, actionChildren]
// -----------------------------------------------------------------------------
function timelineRow(time, segment, screen, music, action, opts = {}) {
  const fill = opts.stripe ? BAND : undefined;
  return new TableRow({
    children: [
      cell(p([bold(time, { color: NAVY, size: 20 })]), { width: COL_TIME, fill }),
      cell(segment.map(par => par), { width: COL_SEGMENT, fill }),
      cell(screen.map(par => par), { width: COL_SCREEN, fill }),
      cell(music.map(par => par), { width: COL_MUSIC, fill }),
      cell(action.map(par => par), { width: COL_ACTION, fill }),
    ],
  });
}

// Body paragraph inside a cell — 9pt
function cp(children, opts = {}) {
  if (typeof children === 'string') children = [run(children, { size: 18 })];
  else children = children.map(c => {
    if (c instanceof ExternalHyperlink) return c;
    if (c instanceof TextRun) return c;
    return c;
  });
  return new Paragraph({ children, spacing: { before: 0, after: 40 }, ...opts });
}

// Convenience: children with default 9pt sizing on plain runs
function s(text, opts = {}) { return run(text, { size: 18, ...opts }); }
function sb(text, opts = {}) { return run(text, { size: 18, bold: true, ...opts }); }
function sl(text, url, opts = {}) { return link(text, url, { size: 18, ...opts }); }

// -----------------------------------------------------------------------------
// Build content
// -----------------------------------------------------------------------------
const elements = [];

// Big title
elements.push(new Paragraph({
  children: [run('AV Team Timeline', { bold: true, size: 40, color: NAVY })],
  spacing: { before: 0, after: 80 },
}));
elements.push(new Paragraph({
  children: [run('Monday, September 14, 2026   ·   The Statler Dallas   ·   Grand Ballroom', { size: 20, color: MUTED })],
  spacing: { before: 0, after: 200 },
}));

// -------- Quick-reference block --------
const qrRows = [
  ['TIMER PAGE', [
    sl(TIMER_URL, TIMER_URL, { bold: true }),
    s(' · open in a browser on the main output. The page shows the countdown AND scrolls sponsor logos at the top. Use for every break.'),
  ]],
  ['SPOTIFY', [
    sl('Countdown Timer Playlist', SPOT.countdown), s(' · '),
    sl('Speaker Walk Up Playlist', SPOT.walkup), s(' · '),
    sl('Alternates', SPOT.alt), s(' · '),
    sl('Lunch Break', SPOT.lunch), s('. Full playlist and walk-on tables on page 2.'),
  ]],
  ['SPEAKER DECKS', [
    sb('Speaker Decks/'),
    s(' subfolder · open each speaker\'s file in PowerPoint at the handoff. After each speaker, return to the timer page or Celebrations Loop.'),
  ]],
  ['CELEBRATIONS LOOP', [
    sb('Celebrations-Loop.pptx'),
    s(' · 18-slide auto-looping customer wins deck. Optional visual for breaks or between speakers if you want something other than the timer page.'),
  ]],
];

const qrTable = new Table({
  width: { size: USABLE, type: WidthType.DXA },
  columnWidths: [2000, 12400],
  rows: qrRows.map(([label, runs]) => new TableRow({
    children: [
      cell(p([run(label, { bold: true, color: WHITE, size: 18 })]), {
        width: 2000, fill: NAVY,
        vAlign: VerticalAlign.CENTER,
        padding: { top: 80, bottom: 80, left: 120, right: 120 },
      }),
      cell(cp(runs), { width: 12400, vAlign: VerticalAlign.CENTER }),
    ],
  })),
});
elements.push(qrTable);
elements.push(new Paragraph({ children: [run('', { size: 12 })], spacing: { before: 0, after: 120 } }));

// -------- Main timeline table --------
const headerRow = new TableRow({
  tableHeader: true,
  children: [
    headerCell('Time', COL_TIME),
    headerCell('Segment', COL_SEGMENT),
    headerCell('On Main Screen', COL_SCREEN),
    headerCell('Music / Audio', COL_MUSIC),
    headerCell('AV Action', COL_ACTION),
  ],
});

const rows = [headerRow];

// ===== FREE MORNING =====
rows.push(sectionRow('FREE MORNING PROGRAM'));

rows.push(timelineRow(
  '7:30 – 8:00 AM',
  [cp('Coffee, Snacks & Registration')],
  [cp('Timer page (countdown to 8:00)')],
  [cp([sl('Countdown Timer Playlist', SPOT.countdown)])],
  [cp([s('Open '), sl('countdown to 8:00 AM', TIMER_TO('8:00')), s(' on main screen. Start playlist.')])],
));

rows.push(timelineRow(
  '8:00 – 9:35 AM',
  [cp([sb('Get a Grip on your Business with EOS')]), cp([run('Ann Sheu · Certified EOS Implementer', { size: 18, color: MUTED })])],
  [cp('Ann\'s deck (in Speaker Decks/)')],
  [cp([sb('Walk-on: '), sl('Unstoppable', SPOT.unstoppable, { italics: true }), s(' — The Score. '), sb('Start at 0:30.')])],
  [cp('Fade playlist. Play Ann\'s walk-on song. Load Ann_Sheu_Get_A_Grip.pptx when she takes the stage.')],
  { stripe: true },
));

rows.push(timelineRow(
  '9:35 – 9:50 AM',
  [cp('Break (15 min)')],
  [cp('Timer page (countdown to 9:50)')],
  [cp([sl('Countdown Timer Playlist', SPOT.countdown)])],
  [cp([s('One-click: '), sl('countdown to 9:50 AM', TIMER_TO('9:50')), s('. Resume playlist.')])],
));

rows.push(timelineRow(
  '9:50 – 10:40 AM',
  [cp([sb('Journey with an EOS Implementer')]), cp([run('Brian Dosal · Strety', { size: 18, color: MUTED })])],
  [cp('Brian\'s deck (in Speaker Decks/)')],
  [cp([sb('Walk-on: '), sl('Ants Marching', SPOT.antsMarching, { italics: true }), s(' — Dave Matthews Band (chorus)')])],
  [cp('Fade playlist. Play walk-on. Load Brian Dosal (Strety) — Journey with an EOS Implementer.pptx.')],
  { stripe: true },
));

rows.push(timelineRow(
  '10:40 – 10:55 AM',
  [cp('Break (15 min)')],
  [cp('Timer page (countdown to 10:55)')],
  [cp([sl('Countdown Timer Playlist', SPOT.countdown)])],
  [cp([s('One-click: '), sl('countdown to 10:55 AM', TIMER_TO('10:55')), s('. Resume playlist.')])],
));

rows.push(timelineRow(
  '10:55 – 11:55 AM',
  [cp([sb('Your Sales Team Isn\'t the Problem. Your System Is.')]), cp([run('Steve Heroux', { size: 18, color: MUTED })])],
  [cp('Steve\'s deck (in Speaker Decks/)')],
  [cp([sb('Walk-on: '), sl('Down with the Sickness', SPOT.sickness, { italics: true }), s(' — Disturbed (chorus)')])],
  [cp('Fade playlist. Play walk-on. Load Steve Heroux — Sales System (fixed).pptx.')],
  { stripe: true },
));

rows.push(timelineRow(
  '11:55 – 12:00 PM',
  [cp('Emcee bridge to Lunch')],
  [cp('Lunch title card')],
  [cp([sb('Pre-Lunch: '), sl('Find Your People', SPOT.findYourPeople, { italics: true }), s(' — Drew Holcomb & The Neighbors')])],
  [cp('Play pre-lunch song as guests transition to lunch tables.')],
));

// ===== LUNCH =====
rows.push(sectionRow('LUNCH & LEARN'));

rows.push(timelineRow(
  '12:00 – 1:00 PM',
  [cp([sb('Lunch and Learn: Healthy Matters')]), cp([run('Walt Brown · 7 Critical Needs', { size: 18, color: MUTED })])],
  [cp('Walt\'s deck (in Speaker Decks/)')],
  [cp([sb('Walk-on: '), sl("Don't Ask Me No Questions", SPOT.noQuestions, { italics: true }), s(' — Lynyrd Skynyrd (chorus)')])],
  [cp('Load Walt Brown — 7 Critical Needs (fixed).pptx. Play walk-on when Walt takes the stage after guests are seated.')],
  { stripe: true },
));

rows.push(timelineRow(
  '1:00 – 1:10 PM',
  [cp('Break / Bridge (10 min)')],
  [cp([sl('Timer countdown to 1:10 PM', TIMER_TO('13:10')), s(' (or Celebrations Loop)')])],
  [cp([sb('Post-Lunch: '), sl('Do I Ever Cross Your Mind', SPOT.doIEver, { italics: true }), s(' — Dolly Parton, then '), sl('Countdown Timer Playlist', SPOT.countdown)])],
  [cp([s('Play post-lunch song. One-click: '), sl('countdown to 1:10 PM', TIMER_TO('13:10')), s('.')])],
));

// ===== PAID AFTERNOON =====
rows.push(sectionRow('PAID AFTERNOON PROGRAM'));

rows.push(timelineRow(
  '1:10 – 2:40 PM',
  [cp([sb('Profit Power: Stronger — or Just Bigger?')]), cp([run('Mark Stanley', { size: 18, color: MUTED })])],
  [cp('Mark\'s deck (in Speaker Decks/)')],
  [cp([sb('Walk-on: '), sl('Beautiful Day', SPOT.beautifulDay, { italics: true }), s(' — U2 (chorus)')])],
  [cp([s('Fade playlist. Play walk-on. Load '), sb('Mark Stanley — Profit Power.pptx'), s(' and press F5 when Mark takes the stage.')])],
  { stripe: true },
));

rows.push(timelineRow(
  '2:40 – 2:55 PM',
  [cp('Afternoon Break (15 min)')],
  [cp('Timer page (countdown to 2:55) OR Celebrations Loop')],
  [cp([sl('Countdown Timer Playlist', SPOT.countdown)])],
  [cp([s('One-click: '), sl('countdown to 2:55 PM', TIMER_TO('14:55')), s('. '), sb('Option:'), s(' switch to Celebrations-Loop.pptx on main projector during this break for extra content.')])],
));

rows.push(timelineRow(
  '2:55 – 4:25 PM',
  [cp([sb('Rollout, Reworked: Running EOS Company-Wide')]), cp([run('Beth Fahey', { size: 18, color: MUTED })])],
  [cp('Beth\'s deck (in Speaker Decks/)')],
  [cp([sb('Walk-on: '), sl('Rollout (My Business) — Instrumental', SPOT.rollout, { italics: true }), s(' — Ludacris')])],
  [cp([s('Fade playlist. Play walk-on. Load '), sb('Beth_Fahey-RolloutPresentation_Dallas_2026_Updated.pptx'), s(' and press F5 when Beth takes the stage.')])],
  { stripe: true },
));

rows.push(timelineRow(
  '4:25 – 4:45 PM',
  [cp('Final Break (20 min)')],
  [cp('Timer page (countdown to 4:45) OR Celebrations Loop')],
  [cp([sl('Countdown Timer Playlist', SPOT.countdown)])],
  [cp([s('One-click: '), sl('countdown to 4:45 PM', TIMER_TO('16:45')), s('. MC Max handles sponsor thank-yous verbally on return.')])],
));

rows.push(timelineRow(
  '4:45 – 6:15 PM',
  [cp([sb('The 10 Pillars of Visionary Greatness')]), cp([run('Mark C. Winters', { size: 18, color: MUTED })])],
  [cp('Winters\' deck (in Speaker Decks/)')],
  [cp([sb('Walk-on: '), run('TBD — awaiting Mark C. Winters', { size: 18, bold: true, color: RED })])],
  [cp([s('Fade playlist. Play walk-on. Load '), sb('Mark_Winters_10_Pillars.pptx'), s(' and press F5 when Mark takes the stage.')])],
  { stripe: true },
));

// ===== HAPPY HOUR =====
rows.push(sectionRow('HAPPY HOUR'));

rows.push(timelineRow(
  '6:15 – 8:00 PM',
  [cp([sb('Happy Hour + Networking')]), cp([run('Sponsored by Ninety.io', { size: 18, color: MUTED })])],
  [cp('Celebrations Loop OR timer page (any static screen)')],
  [cp('Any upbeat playlist (host\'s choice)')],
  [cp('Leave Celebrations-Loop.pptx running on the main screen through Happy Hour. Music continues.')],
));

const mainTable = new Table({
  width: { size: USABLE, type: WidthType.DXA },
  columnWidths: COLS,
  rows,
});
elements.push(mainTable);

// -------- Page 2: cheat sheet --------
elements.push(new Paragraph({ children: [new PageBreak()] }));

elements.push(new Paragraph({
  children: [run('Music Cheat Sheet', { bold: true, size: 32, color: NAVY })],
  spacing: { before: 0, after: 60 },
}));
elements.push(new Paragraph({
  children: [run('Direction from Shane Spillers: play only the most famous part of each walk-on (chorus). Fade playlists as speakers approach the stage.', { size: 18, color: MUTED })],
  spacing: { before: 0, after: 200 },
}));

// Spotify Playlists table
elements.push(new Paragraph({
  children: [run('Spotify Playlists', { bold: true, size: 24, color: ORANGE })],
  spacing: { before: 0, after: 100 },
}));

const spRows = [
  new TableRow({ tableHeader: true, children: [
    headerCell('Playlist', 3400),
    headerCell('Use For', 4600),
    headerCell('Link', 6400),
  ]}),
  new TableRow({ children: [
    cell(cp([sb('Countdown Timer Playlist')]), { width: 3400 }),
    cell(cp('Registration and every break'), { width: 4600 }),
    cell(cp([sl(SPOT.countdown, SPOT.countdown)]), { width: 6400 }),
  ]}),
  new TableRow({ children: [
    cell(cp([sb('Speaker Walk Up Playlist')]), { width: 3400, fill: BAND }),
    cell(cp('Fallback if a specific walk-on song is unavailable'), { width: 4600, fill: BAND }),
    cell(cp([sl(SPOT.walkup, SPOT.walkup)]), { width: 6400, fill: BAND }),
  ]}),
  new TableRow({ children: [
    cell(cp([sb('Alternate Song Options')]), { width: 3400 }),
    cell(cp('Backup track pool'), { width: 4600 }),
    cell(cp([sl(SPOT.alt, SPOT.alt)]), { width: 6400 }),
  ]}),
  new TableRow({ children: [
    cell(cp([sb('Lunch Break Playlist')]), { width: 3400, fill: BAND }),
    cell(cp('11:55 AM – 12:00 PM lunch bridge (Walt takes over at 12:00)'), { width: 4600, fill: BAND }),
    cell(cp([sl(SPOT.lunch, SPOT.lunch)]), { width: 6400, fill: BAND }),
  ]}),
];
elements.push(new Table({
  width: { size: USABLE, type: WidthType.DXA },
  columnWidths: [3400, 4600, 6400],
  rows: spRows,
}));

elements.push(new Paragraph({ children: [run('', { size: 12 })], spacing: { before: 0, after: 200 } }));

// Walk-On Assignments table
elements.push(new Paragraph({
  children: [run('Speaker Walk-On Assignments', { bold: true, size: 24, color: ORANGE })],
  spacing: { before: 0, after: 100 },
}));

const walkOnRows = [
  new TableRow({ tableHeader: true, children: [
    headerCell('Speaker', 2200),
    headerCell('Session', 4400),
    headerCell('Walk-On Song', 4600),
    headerCell('Notes', 3200),
  ]}),
];
const walkOns = [
  ['Ann Sheu', 'Get a Grip on your Business with EOS',
    [sl('Unstoppable', SPOT.unstoppable, { italics: true }), s(' — The Score')], [sb('Start at 0:30')]],
  ['Brian Dosal', 'Journey with an EOS Implementer',
    [sl('Ants Marching', SPOT.antsMarching, { italics: true }), s(' — Dave Matthews Band')], [s('Chorus only')]],
  ['Steve Heroux', 'Your Sales Team Isn\'t the Problem',
    [sl('Down with the Sickness', SPOT.sickness, { italics: true }), s(' — Disturbed')], [s('Chorus only')]],
  ['Walt Brown', 'Healthy Matters / 7 Critical Needs (Lunch)',
    [sl("Don't Ask Me No Questions", SPOT.noQuestions, { italics: true }), s(' — Lynyrd Skynyrd')], [s('Chorus only')]],
  ['Mark Stanley', 'Profit Power: Stronger or Just Bigger?',
    [sl('Beautiful Day', SPOT.beautifulDay, { italics: true }), s(' — U2')], [s('Chorus only')]],
  ['Beth Fahey', 'Rollout, Reworked',
    [sl('Rollout (My Business) — Instrumental', SPOT.rollout, { italics: true }), s(' — Ludacris')], [s('Chorus only')]],
  ['Mark C. Winters', 'The 10 Pillars of Visionary Greatness',
    [run('TBD — not yet provided', { size: 18, bold: true, color: RED })],
    [run('Default to ', { size: 18 }), sl('Speaker Walk Up Playlist', SPOT.walkup), run(' if not received', { size: 18 })]],
];
walkOns.forEach(([speaker, session, song, notes], i) => {
  const stripe = i % 2 === 0 ? BAND : undefined;
  walkOnRows.push(new TableRow({ children: [
    cell(cp([sb(speaker)]), { width: 2200, fill: stripe }),
    cell(cp(session), { width: 4400, fill: stripe }),
    cell(cp(song), { width: 4600, fill: stripe }),
    cell(cp(notes), { width: 3200, fill: stripe }),
  ]}));
});
elements.push(new Table({
  width: { size: USABLE, type: WidthType.DXA },
  columnWidths: [2200, 4400, 4600, 3200],
  rows: walkOnRows,
}));

elements.push(new Paragraph({ children: [run('', { size: 12 })], spacing: { before: 0, after: 200 } }));

// Special cues
elements.push(new Paragraph({
  children: [run('Special Music Cues', { bold: true, size: 24, color: ORANGE })],
  spacing: { before: 0, after: 100 },
}));
elements.push(new Paragraph({
  children: [
    sb('•  Pre-Lunch bridge (11:55 AM): '),
    sl('Find Your People', SPOT.findYourPeople, { italics: true }),
    s(' by Drew Holcomb & The Neighbors.'),
  ],
  spacing: { before: 0, after: 40 },
}));
elements.push(new Paragraph({
  children: [
    sb('•  Post-Lunch return (1:00 PM): '),
    sl('Do I Ever Cross Your Mind', SPOT.doIEver, { italics: true }),
    s(' by Dolly Parton, then resume '),
    sl('Countdown Timer Playlist', SPOT.countdown),
    s(' during the 10-minute bridge.'),
  ],
  spacing: { before: 0, after: 200 },
}));

// Handoff pattern
elements.push(new Paragraph({
  children: [run('Speaker Hand-Off Pattern', { bold: true, size: 24, color: ORANGE })],
  spacing: { before: 0, after: 100 },
}));
elements.push(new Paragraph({
  children: [s('When a speaker uses their own deck (marked in the timeline):')],
  spacing: { before: 0, after: 40 },
}));
[
  ['1.', [s('Fade the countdown playlist and play the speaker\'s walk-on song.')]],
  ['2.', [s('Open the speaker\'s file from '), sb('Speaker Decks/'), s(' in PowerPoint and press '), sb('F5'), s(' to run the deck.')]],
  ['3.', [s('When they finish, press '), sb('Esc'), s('. Return to the timer page (or Celebrations Loop) on the main screen.')]],
  ['4.', [s('MC Max handles all segment transitions and sponsor thank-yous verbally between decks.')]],
].forEach(([n, kids]) => {
  elements.push(new Paragraph({
    children: [sb(`   ${n}  `), ...kids],
    spacing: { before: 0, after: 30 },
  }));
});

elements.push(new Paragraph({ children: [run('', { size: 12 })], spacing: { before: 0, after: 180 } }));

// Contacts
elements.push(new Paragraph({
  children: [run('Contacts on Event Day', { bold: true, size: 24, color: ORANGE })],
  spacing: { before: 0, after: 100 },
  keepNext: true,
}));
const contacts = [
  ['Ray Myers', 'deck / files / AV lead', '469-939-9746', '4699399746', 'ray.myers@eosworldwide.com'],
  ['Erin Thiem', 'Day-of Show Operations (event lead, run of show)', '979-575-4585', '9795754585', 'erin.thiem@eosworldwide.com'],
  ['Shane Spillers', 'Venue Liaison (knows the Statler)', '214-519-9599', '2145199599', 'shane.spillers@eosworldwide.com'],
  ['Fermin Martinez', 'Encore / Statler AV contact', '214-690-5211', '2146905211', 'fermin.martinez@encoreglobal.com'],
  ['Max Reich', 'MC (emcee)', null, null, 'max.reich@eosworldwide.com'],
  ['Meagan Harris', 'stage-side coordinator (eyes on stage all day, supports MC Max)', null, null, 'meagan@spillersworks.com'],
];
contacts.forEach(([name, role, phoneDisp, phoneRaw, email]) => {
  const kids = [sb(`•  ${name}`), s(` (${role}) · `)];
  if (phoneDisp) {
    kids.push(sl(phoneDisp, `tel:+1${phoneRaw}`));
    kids.push(s(' · '));
  }
  kids.push(sl(email, `mailto:${email}`));
  elements.push(new Paragraph({ children: kids, spacing: { before: 0, after: 30 } }));
});

// -----------------------------------------------------------------------------
// Assemble document
// -----------------------------------------------------------------------------
const doc = new Document({
  creator: 'Ray Myers',
  title: 'AV Team Timeline — WRoEOS North Texas 2026',
  description: 'AV run of show, music cues, and speaker walk-on assignments',
  styles: {
    default: {
      document: { run: { font: FONT, size: 20 } },
      hyperlink: { run: { color: '0563C1', underline: {} } },
    },
    characterStyles: [
      { id: 'Hyperlink', name: 'Hyperlink', basedOn: 'DefaultParagraphFont', run: { color: '0563C1', underline: {} } },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 720, right: RIGHT_MARGIN, bottom: 720, left: LEFT_MARGIN, header: 360, footer: 360 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                run('WE RUN ON EOS® NORTH TEXAS 2026', { bold: true, size: 16, color: NAVY }),
                run('     ·     ', { size: 16, color: MUTED }),
                run('AV TIMELINE', { size: 16, color: NAVY }),
                run('                                                                                                             ', { size: 16 }),
                run('MONDAY, SEPTEMBER 14, 2026  ·  THE STATLER DALLAS', { bold: true, size: 16, color: NAVY }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                run('Page ', { size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: FONT }),
                run(' of ', { size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED, font: FONT }),
              ],
            }),
          ],
        }),
      },
      children: elements,
    },
  ],
});

const OUT = path.join(__dirname, 'AV-Timeline.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`Built: ${OUT} (${buf.length.toLocaleString()} bytes)`);
});
