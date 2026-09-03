// Build the WRoEOS Dallas 2026 attendee workbook (.docx)
// US Letter portrait. Navy/orange EOS palette. Print-ready.
// Run: node build_workbook.js

const fs = require('fs');
const path = require('path');
const docx = require('docx');
const { execSync } = require('child_process');

// Read image dimensions via ImageMagick `identify` (already installed).
function imageSize(imgPath) {
  const out = execSync(`identify -format "%w %h" '${imgPath}'`).toString().trim();
  const [w, h] = out.split(' ').map(Number);
  return { w, h };
}
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, PageNumber,
  PageBreak, HeightRule, TabStopType, TabStopPosition,
} = docx;

// ---------- Load data ----------
const REPO = path.resolve(__dirname, '..', '..');
const ROSTER = JSON.parse(fs.readFileSync('/home/user/workspace/eosi-directory-work/final_roster.json', 'utf8'));
const PHOTO_MANIFEST = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/eosi/_manifest.json'), 'utf8'));

// Load SITE_CONFIG from repo config.js
const configSrc = fs.readFileSync(path.join(REPO, 'config.js'), 'utf8').replace(/const SITE_CONFIG/, 'SITE_CONFIG');
let SITE_CONFIG;
eval(configSrc);

// ---------- Colors (matches website) ----------
const COLORS = {
  navy:      '0B1F3A',  // deep navy background/headers
  navyLight: '1A2E4A',
  orange:    'E87722',  // brand accent
  orangeDk:  'B85A15',
  text:      '1A1A1A',
  textMuted: '5A6B82',
  ruler:     'C9D2DE',  // for note lines
  bgTint:    'F4F6F9',
  white:     'FFFFFF',
};

// ---------- Helpers ----------
const FONT = 'Calibri';
const FONT_HEAD = 'Calibri';

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function P(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: opts.spacing || { after: 120 },
    ...(opts.pageBreakBefore ? { pageBreakBefore: true } : {}),
    children: [new TextRun({
      text,
      font: opts.font || FONT,
      size: opts.size || 22,   // half-points; 22 = 11pt
      bold: opts.bold || false,
      italics: opts.italics || false,
      color: opts.color || COLORS.text,
    })],
  });
}

function H1(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: 240, after: 200 },
    ...(opts.pageBreakBefore ? { pageBreakBefore: true } : {}),
    children: [new TextRun({
      text, font: FONT_HEAD, size: 48, bold: true,
      color: opts.color || COLORS.navy,
    })],
  });
}

function H2(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({
      text, font: FONT_HEAD, size: 32, bold: true,
      color: opts.color || COLORS.navy,
    })],
  });
}

function H3(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 80 },
    keepNext: !!opts.keepNext,
    keepLines: true,
    children: [new TextRun({
      text, font: FONT_HEAD, size: 26, bold: true,
      color: opts.color || COLORS.orange,
    })],
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer(sz = 200) {
  return new Paragraph({ spacing: { after: sz }, children: [new TextRun('')] });
}

function ruleLine() {
  // Empty paragraph with bottom border to draw a horizontal rule
  return new Paragraph({
    spacing: { before: 60, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.orange } },
    children: [new TextRun('')],
  });
}

// A block of ruled "note lines" — use a table with N rows, each row is one line.
// Each row gets a bottom border. This renders reliably in Word and LibreOffice.
function noteLinesTable(count = 20) {
  const bottomOnly = {
    top: noBorder,
    bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.ruler },
    left: noBorder,
    right: noBorder,
  };
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(new TableRow({
      height: { value: 470, rule: HeightRule.EXACT }, // fills page minus header (~9" usable)
      children: [new TableCell({
        width: { size: USABLE_W, type: WidthType.DXA },
        borders: bottomOnly,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        children: [new Paragraph({
          spacing: { before: 0, after: 0 },
          children: [new TextRun({ text: ' ', font: FONT, size: 22 })],
        })],
      })],
    }));
  }
  return new Table({
    width: { size: USABLE_W, type: WidthType.DXA },
    columnWidths: [USABLE_W],
    rows,
  });
}

function image(imgPath, w, h) {
  const ext = path.extname(imgPath).slice(1).toLowerCase();
  const typeMap = { jpg: 'jpg', jpeg: 'jpeg', png: 'png', gif: 'gif' };
  return new ImageRun({
    type: typeMap[ext] || 'png',
    data: fs.readFileSync(imgPath),
    transformation: { width: w, height: h },
    altText: { title: path.basename(imgPath), description: 'image', name: 'img' },
  });
}

// Cell factory
function cell({ children, width, shading, borders, align = VerticalAlign.CENTER, margins }) {
  const m = margins || { top: 80, bottom: 80, left: 120, right: 120 };
  return new TableCell({
    verticalAlign: align,
    width: { size: width, type: WidthType.DXA },
    ...(shading ? { shading: { fill: shading, type: ShadingType.CLEAR } } : {}),
    ...(borders ? { borders } : {}),
    margins: m,
    children,
  });
}

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const lightBorder = { style: BorderStyle.SINGLE, size: 4, color: COLORS.ruler };
const lightBorders = { top: lightBorder, bottom: lightBorder, left: lightBorder, right: lightBorder };

// ---------- Content builders ----------
const PAGE_WIDTH  = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN      = 1080; // 0.75"
const USABLE_W    = PAGE_WIDTH - 2 * MARGIN;  // 10080 DXA

// ==== COVER PAGE ====
function coverPage() {
  const children = [];
  // Big block of navy-styled top
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2000, after: 200 },
    children: [new TextRun({
      text: 'FIFTH ANNUAL', font: FONT_HEAD, size: 22, bold: true,
      color: COLORS.orange,
    })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({
      text: 'WE RUN ON', font: FONT_HEAD, size: 40, bold: true, color: COLORS.textMuted,
    })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({
      text: 'EOS® NORTH TEXAS', font: FONT_HEAD, size: 96, bold: true, color: COLORS.navy,
    })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({
      text: '2026', font: FONT_HEAD, size: 120, bold: true, color: COLORS.orange,
    })],
  }));
  // Divider
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.orange } },
    children: [new TextRun('')],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'ATTENDEE WORKBOOK', font: FONT_HEAD, size: 36, bold: true, color: COLORS.navy })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'Monday, September 14, 2026', font: FONT, size: 26, color: COLORS.text })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'The Statler Dallas', font: FONT, size: 26, italics: true, color: COLORS.textMuted })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: '1914 Commerce Street, Dallas, TX 75201', font: FONT, size: 22, color: COLORS.textMuted })],
  }));
  return children;
}

// ==== WELCOME LETTER ====
function welcomeLetter() {
  const paragraphs = [
    'Welcome to the fifth annual We Run on EOS® North Texas. Today we come together as an EOS community — entrepreneurs, leadership teams, and the certified Implementers who serve them — to sharpen our tools, share what’s working, and get better at running our businesses.',
    'If you’re running on EOS, this day is designed to make you stronger. World-class speakers. Practical workshops. Books you can actually use on Monday morning. And a room full of North Texas leaders who are on the same journey.',
    'If you’re just getting started, welcome. You picked a great day to see what happens when a whole community rallies around one operating system. Ask questions. Take notes. Introduce yourself to the person next to you.',
    'A few suggestions to make the most of the day:',
  ];
  const bullets = [
    'Use this workbook. Every session has space for the ideas that hit you hardest.',
    'Talk to the sponsors. They’re here because they believe in EOS and want to help you win.',
    'Introduce yourself to at least three people you don’t know. Business is a team sport.',
    'Come back at 6:15 for Happy Hour. Some of the best conversations of the day happen there.',
  ];
  const closing = [
    'Here’s to a great day — stronger teams, healthier companies, and clearer visions.',
    'Let’s get to work.',
    '',
    '— The North Texas EOS Community',
  ];

  const items = [
    H1('Welcome', { pageBreakBefore: true }),
    ruleLine(),
  ];
  paragraphs.forEach(t => items.push(P(t, { spacing: { after: 200 } })));
  bullets.forEach(t => items.push(new Paragraph({
    numbering: { reference: 'welcome-bullets', level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text: t, font: FONT, size: 22, color: COLORS.text })],
  })));
  items.push(spacer(200));
  closing.forEach(t => items.push(P(t, {
    spacing: { after: 100 },
    italics: t.startsWith('—'),
    color: t.startsWith('—') ? COLORS.textMuted : COLORS.text,
  })));
  return items;
}

// ==== AGENDA ====
function agendaPage() {
  const rows = SITE_CONFIG.agenda;
  const tableRows = [];

  // Header row
  tableRows.push(new TableRow({
    tableHeader: true,
    children: [
      cell({
        width: 2200, shading: COLORS.navy, borders: noBorders,
        children: [new Paragraph({ alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: 'TIME', font: FONT_HEAD, size: 20, bold: true, color: COLORS.white })] })]
      }),
      cell({
        width: 5680, shading: COLORS.navy, borders: noBorders,
        children: [new Paragraph({ alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: 'SESSION', font: FONT_HEAD, size: 20, bold: true, color: COLORS.white })] })]
      }),
      cell({
        width: 2200, shading: COLORS.navy, borders: noBorders,
        children: [new Paragraph({ alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: 'PRESENTER', font: FONT_HEAD, size: 20, bold: true, color: COLORS.white })] })]
      }),
    ],
  }));

  rows.forEach((r, i) => {
    const stripe = i % 2 === 0 ? COLORS.white : COLORS.bgTint;
    let speaker = (r.speaker || '').split(' · ')[0] || '';
    if (speaker === 'Walt Brown') {
      speaker = 'EOS Worldwide Head Coach · Walt Brown';
    }
    const highlight = r.highlight;
    // The workbook covers the PM (paid) sessions only, starting at Mark Stanley
    // 1:00 PM. Everything scheduled before that — including Walt's lunch talk —
    // is shown on the agenda page for context but styled as "not covered here".
    const START_HOUR = '1:00';
    const isContextOnly = r.tier === 'free' || r.time.startsWith('7:') ||
      r.time.startsWith('8:') || r.time.startsWith('9:') ||
      r.time.startsWith('10:') || r.time.startsWith('11:') ||
      r.time.startsWith('12:');
    const isFree = isContextOnly;

    // All rows: session title bold (except breaks), no italics, times not bold.
    // Every speaker session shares the same size & color; only breaks/reference
    // rows differ.
    const isBreak = /^(Break|Coffee|Happy Hour)/i.test(r.session);
    const timeColor    = COLORS.navy;
    const sessionColor = isBreak ? COLORS.textMuted : COLORS.text;

    const sessionChildren = [
      new TextRun({
        text: r.session, font: FONT, size: 22,
        bold: !isBreak, italics: false, color: sessionColor,
      }),
    ];
    const sessionParas = [new Paragraph({ children: sessionChildren })];

    tableRows.push(new TableRow({
      children: [
        cell({
          width: 2200, shading: stripe, borders: noBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({ text: r.time, font: FONT, size: 20, bold: false, color: timeColor })] })]
        }),
        cell({
          width: 5680, shading: stripe, borders: noBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 100 },
          children: sessionParas,
        }),
        cell({
          width: 2200, shading: stripe, borders: noBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({ text: speaker, font: FONT, size: 18, italics: false, color: COLORS.textMuted })] })]
        }),
      ],
    }));
  });
  return [
    H1('Agenda', { pageBreakBefore: true }),
    ruleLine(),
    P('Monday, September 14, 2026 · The Statler Dallas', { italics: true, color: COLORS.textMuted, size: 22 }),
    spacer(200),
    new Table({
      width: { size: USABLE_W, type: WidthType.DXA },
      columnWidths: [2200, 5680, 2200],
      rows: tableRows,
    }),
  ];
}

// ==== SPEAKER SECTIONS ====
// PAID-DAY WORKBOOK ONLY.
// The free morning (Ann Sheu, Strety, System of Selling) is listed on the
// agenda page for context but does NOT get session pages in this workbook.
// Walt Brown's lunch talk is not in the paid workbook either (paid content
// begins 1:00 PM with Mark Stanley).
const SPEAKER_SESSIONS = [
  { session_title: 'Profit Power: Stronger — or Just Bigger?', speaker: 'Mark Stanley', title: 'Expert EOS Implementer®',
    time: '1:00 – 2:30 PM', slug: 'mark-stanley', notes_pages: 1,
    photo: 'assets/speakers/mark-stanley.jpg',
    bio: 'One of the first EOS® Implementers in the world (2009) and now an Expert EOS Implementer with 1,700+ full-day sessions across 180+ leadership teams. Co-author of The Data Book, co-founder of the UNSTOPPABLE! Data-Driven Leader community, and a three-time entrepreneur. Brings a Theory of Constraints, Lean, and Six Sigma toolkit — plus a bias for action — to every session. BBA (Iowa), MBA (Drake). Lives in Johnston, Iowa.',
    handout: { file: 'appendix/Profit-Power-Handout.pdf', pages: 2,
      caption: 'Profit Power — The 5-Number Income Statement™ worksheet from Mark Stanley. Fill it in during the session.' } },
  { session_title: 'Rollout, Reworked: Your Plan for Running EOS® Company-Wide', speaker: 'Beth Fahey', title: 'Expert EOS Implementer®',
    time: '2:50 – 4:25 PM', slug: 'beth-fahey', notes_pages: 1,
    photo: 'assets/speakers/beth-fahey.jpg',
    bio: 'Expert EOS Implementer® with 500+ client sessions and an EOS Worldwide Coach who trains other Implementers. Co-author of ROLLOUT: Get Your Entire Team Running on EOS® to Achieve Your Vision, and co-creator of the Great Boss™ Workshops with René Boer — more than 40 workshops delivered to thousands of managers. Host of the Bad Boss Confessional podcast. Founder-first perspective: she built a bakery, ran it on EOS, and led the Retail Bakers of America before going full-time as an Implementer. Based in the Chicago area.',
    handout: { file: 'appendix/Rollout-Handout.pdf', pages: 18,
      caption: 'Rollout — Tips for Sharing the Context of EOS®, Rollout Tracker, and the ROLLOUT Troubleshooting Guide.' } },
  { session_title: 'The 10 Pillars of Visionary Greatness', speaker: 'Mark C. Winters', title: 'Expert EOS Implementer®',
    time: '4:45 – 6:15 PM', slug: 'mark-c-winters', notes_pages: 1,
    photo: 'assets/speakers/mark-c-winters.jpg',
    bio: 'Expert EOS Implementer® since 2012 with 1,000+ full-day sessions delivered. Author of Visionary and co-author of Rocket Fuel with EOS founder Gino Wickman — the definitive book on the Visionary/Integrator partnership. Founder and Visionary of Rocket Fuel University and host of the Rocket Fuel Podcast. Serial entrepreneur (14 companies started, bought, sold, or shut down) with one exit at a 100x cash return in under three years. MBA from The University of Chicago. Based in Dallas.',
    handout: { file: 'appendix/10-Pillars-Handout.pdf', pages: 2,
      caption: 'The 10 Pillars of Visionary Greatness — full framework grid and Visionary book overview from Mark C. Winters.' } },
];

function speakerCoverPage(s) {
  const items = [];
  items.push(new Paragraph({
    pageBreakBefore: true, spacing: { before: 1200, after: 100 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: 'SESSION', font: FONT_HEAD, size: 20, bold: true, color: COLORS.orange })],
  }));
  items.push(new Paragraph({
    spacing: { after: 200 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.time, font: FONT, size: 22, color: COLORS.textMuted })],
  }));
  items.push(new Paragraph({
    spacing: { after: 240 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.session_title, font: FONT_HEAD, size: 44, bold: true, color: COLORS.navy })],
  }));
  if (s.subtitle) {
    items.push(new Paragraph({
      spacing: { after: 240 }, alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: s.subtitle, font: FONT, size: 24, italics: true, color: COLORS.textMuted })],
    }));
  }
  items.push(new Paragraph({
    spacing: { before: 100, after: 400 }, alignment: AlignmentType.LEFT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: COLORS.orange } },
    children: [new TextRun('')],
  }));
  items.push(new Paragraph({
    spacing: { after: 60 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: 'PRESENTED BY', font: FONT_HEAD, size: 18, bold: true, color: COLORS.orange })],
  }));
  items.push(new Paragraph({
    spacing: { after: 40 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.speaker, font: FONT_HEAD, size: 34, bold: true, color: COLORS.navy })],
  }));
  items.push(new Paragraph({
    spacing: { after: 300 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.title, font: FONT, size: 22, italics: true, color: COLORS.textMuted })],
  }));

  // Photo + bio (side-by-side) when configured for this speaker.
  if (s.photo && s.bio) {
    const photoPath = path.join(__dirname, s.photo);
    // Two-column table: 2" square photo on left, bio on right.
    // USABLE_W is defined elsewhere; use fixed DXA widths so LibreOffice
    // renders identically to Word. 1" = 1440 DXA.
    const PHOTO_W = 2160;   // 1.5"
    const BIO_W   = 6720;   // ~4.67"
    items.push(new Table({
      width: { size: PHOTO_W + BIO_W, type: WidthType.DXA },
      columnWidths: [PHOTO_W, BIO_W],
      rows: [new TableRow({
        cantSplit: true,
        children: [
          cell({
            width: PHOTO_W, borders: noBorders,
            align: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 0, right: 480 },
            children: [new Paragraph({
              alignment: AlignmentType.LEFT, spacing: { after: 0 },
              children: [image(photoPath, 144, 144)],
            })],
          }),
          cell({
            width: BIO_W, borders: noBorders,
            align: VerticalAlign.TOP,
            margins: { top: 0, bottom: 0, left: 240, right: 0 },
            children: [new Paragraph({
              alignment: AlignmentType.LEFT, spacing: { after: 0, line: 300 },
              children: [new TextRun({ text: s.bio, font: FONT, size: 20, color: COLORS.text })],
            })],
          }),
        ],
      })],
    }));
  }

  // SESSION cover flows straight into MY NOTES.
  // Handouts (when present) are spliced in by splice_handouts.py between
  // this cover page and the notes page(s), anchored on the speaker name.

  // Notes pages (per session's notes_pages count, default 1)
  const notesPages = s.notes_pages != null ? s.notes_pages : 1;
  for (let i = 0; i < notesPages; i++) {
    items.push(pageBreak());
    const suffix = notesPages > 1 ? ` (${i + 1}/${notesPages})` : '';
    const heading = 'MY NOTES · ' + s.session_title.toUpperCase() + suffix;
    items.push(new Paragraph({
      spacing: { after: 120 }, alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: heading, font: FONT_HEAD, size: 24, bold: true, color: COLORS.orange })],
    }));
    items.push(new Paragraph({
      spacing: { after: 300 }, alignment: AlignmentType.LEFT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.orange } },
      children: [new TextRun('')],
    }));
    items.push(noteLinesTable(26)); // speaker session notes: no subheading, fits 26 @ 470 DXA
  }

  return items;
}

// ==== BOOKS PAGE ====
// Fit an image into a bounding box while preserving aspect ratio.
function fitBox(imgPath, maxW, maxH) {
  const { w, h } = imageSize(imgPath);
  const ratio = w / h;
  let outW = maxW, outH = maxW / ratio;
  if (outH > maxH) { outH = maxH; outW = maxH * ratio; }
  return { w: Math.round(outW), h: Math.round(outH) };
}

function booksPage() {
  const BOOKS = [
    { title: 'Data', author: 'Mark Stanley', retail: '$20.66',
      description: 'Harness Your Numbers to Go from Uncertain to Unstoppable. A practical playbook for using data to drive decisions and accountability.',
      cover: path.join(__dirname, 'assets/books/data_cover.jpg') },
    { title: 'Rollout', author: 'Beth Fahey', retail: '$29.99',
      description: 'Get Your Entire Team Running on EOS\u00ae to Achieve Your Vision. A field-tested guide for taking EOS deeper across your whole organization.',
      cover: path.join(__dirname, 'assets/books/rollout_cover.jpg') },
    { title: 'Visionary', author: 'Mark C. Winters', retail: '$29.99',
      description: 'How Driven Entrepreneurs Get What They Want Without Doing It All Themselves. The Visionary/Integrator dynamic that powers great companies.',
      cover: path.join(__dirname, 'assets/books/visionary_cover.jpg') },
  ];

  const items = [];
  items.push(H1('Your Books', { pageBreakBefore: true }));
  items.push(ruleLine());
  items.push(P('Every Full Day ticket includes three hardcover books\u00a0— your working library from today\u2019s presenters.',
    { italics: true, color: COLORS.textMuted, size: 22 }));
  items.push(spacer(160));

  BOOKS.forEach((b) => {
    // Aspect-correct cover, small enough to fit 3 on a page:
    // Book covers are ~2:3 (portrait). Cap at 120px wide × 180px tall.
    const fit = fitBox(b.cover, 120, 180);
    const row = new TableRow({
      cantSplit: true,
      children: [
        cell({
          width: 2000, borders: noBorders,
          align: VerticalAlign.TOP,
          margins: { top: 80, bottom: 80, left: 0, right: 200 },
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 60 },
            children: [image(b.cover, fit.w, fit.h)]
          })],
        }),
        cell({
          width: 8080, borders: noBorders, align: VerticalAlign.TOP,
          margins: { top: 80, bottom: 80, left: 200, right: 0 },
          children: [
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: b.title, font: FONT_HEAD, size: 30, bold: true, color: COLORS.navy })],
            }),
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: 'by ' + b.author + '  \u00b7  Retail ' + b.retail, font: FONT, size: 18, italics: true, color: COLORS.textMuted })],
            }),
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: b.description, font: FONT, size: 20, color: COLORS.text })],
            }),
          ],
        }),
      ],
    });
    items.push(new Table({
      width: { size: USABLE_W, type: WidthType.DXA },
      columnWidths: [2000, 8080],
      rows: [row],
    }));
    items.push(spacer(160));
  });

  return items;
}

// ==== SPONSORS PAGE ====
// Loads QR-code manifest for sponsor URLs (see gen_qr.py). Missing entries fall
// back to no QR (still shows logo + name).
const QR_MANIFEST = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'assets/qr/_manifest.json'), 'utf8')); }
  catch (e) { return { sponsors: {}, eosi: {} }; }
})();

function sponsorsPage() {
  const sponsors = SITE_CONFIG.sponsors.sponsors.filter(s => s.verified);

  // Compact single-page layout. All 16 sponsors on one page. Heights and
  // paddings tightened vs. the earlier two-page version; URL text has been
  // replaced by a QR code inside each cell.
  // Prices: Title $10K, Book $9K, HH $6.5K, Lounge $5K, Swag $3.5K, Booth $1.5K.
  const TIER_LAYOUT = {
    title:      { label: 'Title Sponsors',              cols: 2, maxH: 68, qr: 58 },
    book:       { label: 'Book Sponsors',               cols: 2, maxH: 60, qr: 54 },
    hhLounge:   { label: 'Happy Hour & Lounge Sponsors', cols: 2, maxH: 56, qr: 50 },
    swag:       { label: 'Swag Bag Sponsors',           cols: 2, maxH: 54, qr: 50 },
    booth:      { label: 'Booth Sponsors',              cols: 4, maxH: 40, qr: 42 },
  };
  const tierOrder = ['title', 'book', 'hhLounge', 'swag', 'booth'];

  const grouped = {};
  sponsors.forEach(s => {
    // Combine happyHour + lounge into a single row to save vertical space.
    const key = (s.tier === 'happyHour' || s.tier === 'lounge') ? 'hhLounge' : s.tier;
    grouped[key] = grouped[key] || [];
    grouped[key].push(s);
  });

  const items = [];
  items.push(H1('Thank You to Our Sponsors', { pageBreakBefore: true }));
  items.push(ruleLine());
  items.push(P('This day is made possible by the generosity of these North Texas businesses. Scan any QR to visit the sponsor.',
    { italics: true, color: COLORS.textMuted, size: 20 }));
  items.push(spacer(30));

  // Compact tier label — smaller than global H3 and no big "before" spacing.
  const sponsorTierLabel = (text) => new Paragraph({
    spacing: { before: 40, after: 30 },
    keepNext: true,
    children: [new TextRun({ text, font: FONT_HEAD, size: 20, bold: true, color: COLORS.orange })],
  });

  tierOrder.forEach(tk => {
    const list = grouped[tk] || [];
    if (list.length === 0) return;
    const layout = TIER_LAYOUT[tk];
    items.push(sponsorTierLabel(layout.label));

    const cols = layout.cols;
    const colWidth = Math.floor(USABLE_W / cols);
    const columnWidths = Array(cols).fill(colWidth);
    // Adjust last col to make widths sum exactly to USABLE_W
    columnWidths[cols - 1] += USABLE_W - columnWidths.reduce((a,b) => a+b, 0);

    // Build ALL rows for this tier as ONE multi-row table so that when the
    // tier has multiple rows (e.g. Booth Sponsors) they stay together without
    // an inter-row spacer, and the whole tier can flow to the next page if
    // needed. cantSplit is still per-row so individual cards don't split.
    const tierRows = [];
    for (let i = 0; i < list.length; i += cols) {
      const rowCells = [];
      for (let c = 0; c < cols; c++) {
        const s = list[i + c];
        if (!s) {
          rowCells.push(cell({ width: columnWidths[c], borders: noBorders, children: [new Paragraph('')] }));
          continue;
        }
        // Resolve local logo path
        const logoBase = path.basename(s.logo).replace(/\.(svg|jpg|jpeg|webp)$/i, '.png');
        const localPath = path.join(__dirname, 'assets/sponsors', logoBase);

        // Inner 2-column layout inside each sponsor cell: logo + name on the
        // left, QR code on the right. Widths chosen so the QR is ~qr-px on the
        // page and the logo column takes the remaining space.
        const qrPx = layout.qr;
        const qrColDxa = qrPx * 15 + 240; // qr px + inner margin
        const logoColDxa = columnWidths[c] - qrColDxa;
        const logoInnerPx = Math.floor((logoColDxa - 240) / 15) - 8;

        // Left inner cell: logo + name
        const leftChildren = [];
        try {
          const fit = fitBox(localPath, logoInnerPx, layout.maxH);
          leftChildren.push(new Paragraph({
            alignment: AlignmentType.LEFT, spacing: { after: 40 },
            children: [image(localPath, fit.w, fit.h)]
          }));
        } catch (e) {
          leftChildren.push(new Paragraph({
            alignment: AlignmentType.LEFT, spacing: { after: 40 },
            children: [new TextRun({ text: '[logo]', font: FONT, size: 16, color: COLORS.textMuted })]
          }));
        }
        const nameSize = tk === 'title' ? 22 : (tk === 'book' || tk === 'happyHour') ? 20 : tk === 'booth' ? 14 : 18;
        leftChildren.push(new Paragraph({
          alignment: AlignmentType.LEFT, spacing: { after: 0 },
          children: [new TextRun({ text: s.name, font: FONT_HEAD, size: nameSize, bold: true, color: COLORS.navy })],
        }));

        // Right inner cell: QR code (or blank if missing)
        const qrMeta = QR_MANIFEST.sponsors && QR_MANIFEST.sponsors[s.name];
        const qrChildren = [];
        if (qrMeta && qrMeta.path) {
          const qrPath = path.join(__dirname, qrMeta.path);
          qrChildren.push(new Paragraph({
            alignment: AlignmentType.RIGHT, spacing: { after: 0 },
            children: [image(qrPath, qrPx, qrPx)],
          }));
        } else {
          qrChildren.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun('')] }));
        }

        const innerTable = new Table({
          width: { size: columnWidths[c] - 320, type: WidthType.DXA },
          columnWidths: [logoColDxa, qrColDxa],
          rows: [new TableRow({
            cantSplit: true,
            children: [
              cell({ width: logoColDxa, borders: noBorders, align: VerticalAlign.CENTER,
                margins: { top: 0, bottom: 0, left: 0, right: 120 }, children: leftChildren }),
              cell({ width: qrColDxa, borders: noBorders, align: VerticalAlign.CENTER,
                margins: { top: 0, bottom: 0, left: 120, right: 0 }, children: qrChildren }),
            ],
          })],
        });

        const boxPadding = tk === 'title' ? 70 : tk === 'booth' ? 40 : 60;
        rowCells.push(cell({
          width: columnWidths[c], borders: lightBorders, shading: COLORS.white,
          align: VerticalAlign.CENTER,
          margins: { top: boxPadding, bottom: boxPadding, left: 140, right: 140 },
          children: [innerTable],
        }));
      }
      tierRows.push(new TableRow({ cantSplit: true, children: rowCells }));
    }
    items.push(new Table({
      width: { size: USABLE_W, type: WidthType.DXA },
      columnWidths,
      rows: tierRows,
    }));
    items.push(spacer(20));
  });

  return items;
}

// ==== EOSI DIRECTORY ====
// Compact 3-page layout: 7 rows × 2 columns = 14 cards per page → up to 42
// slots for the 40-person roster. QR code (right side of each card) links to
// the implementer's EOS Worldwide profile; email/profile URL text removed to
// save vertical space.
function eosiDirectory() {
  const items = [];
  items.push(H1('North Texas EOS Implementer® Directory', { pageBreakBefore: true }));
  items.push(ruleLine());
  items.push(P('The certified EOS Implementers serving North Texas businesses. Scan any QR to view the full profile on EOSWorldwide.com.',
    { italics: true, color: COLORS.textMuted, size: 18 }));
  items.push(spacer(80));

  const roster = [...ROSTER].sort((a, b) => a.last_name.localeCompare(b.last_name));
  const cols = 2;
  const cardW = Math.floor(USABLE_W / cols);       // ~5040 dxa
  // Card inner: photo | info | QR
  const PHOTO_W = 1120;                              // ~75px column
  const QR_W    = 1120;                              // ~75px column
  const INFO_W  = cardW - PHOTO_W - QR_W - 320;      // remainder minus card margins

  for (let i = 0; i < roster.length; i += cols) {
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
      const r = roster[i + c];
      if (!r) {
        rowCells.push(cell({ width: cardW, borders: noBorders, children: [new Paragraph('')] }));
        continue;
      }
      const photoInfo = PHOTO_MANIFEST[r.name];
      const photoPath = photoInfo && photoInfo.path ? photoInfo.path : null;

      const photoCell = cell({
        width: PHOTO_W, borders: noBorders, align: VerticalAlign.CENTER,
        margins: { top: 0, bottom: 0, left: 0, right: 80 },
        children: [
          photoPath
            ? new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 0 }, children: [image(photoPath, 66, 66)] })
            : new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: (r.first_name[0] + r.last_name[0]).toUpperCase(), font: FONT_HEAD, size: 24, bold: true, color: COLORS.navy })],
              }),
        ],
      });

      const infoChildren = [
        new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: r.name, font: FONT_HEAD, size: 18, bold: true, color: COLORS.navy })],
        }),
        new Paragraph({
          spacing: { after: 30 },
          children: [new TextRun({ text: r.designation + ' EOS Implementer®', font: FONT, size: 12, italics: true, color: COLORS.orange })],
        }),
      ];
      if (r.primary_market) {
        infoChildren.push(new Paragraph({
          spacing: { after: 10 },
          children: [
            new TextRun({ text: 'Primary: ', font: FONT, size: 12, bold: true, color: COLORS.textMuted }),
            new TextRun({ text: r.primary_market, font: FONT, size: 12, color: COLORS.text }),
          ],
        }));
      }
      if (r.other_market) {
        infoChildren.push(new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({ text: 'Other: ', font: FONT, size: 12, bold: true, color: COLORS.textMuted }),
            new TextRun({ text: r.other_market, font: FONT, size: 12, color: COLORS.text }),
          ],
        }));
      }
      const infoCell = cell({
        width: INFO_W, borders: noBorders, align: VerticalAlign.CENTER,
        margins: { top: 0, bottom: 0, left: 80, right: 80 },
        children: infoChildren,
      });

      // QR cell
      const qrMeta = QR_MANIFEST.eosi && QR_MANIFEST.eosi[r.name];
      const qrChildren = [];
      if (qrMeta && qrMeta.path) {
        qrChildren.push(new Paragraph({
          alignment: AlignmentType.RIGHT, spacing: { after: 0 },
          children: [image(path.join(__dirname, qrMeta.path), 66, 66)],
        }));
      } else {
        qrChildren.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun('')] }));
      }
      const qrCell = cell({
        width: QR_W, borders: noBorders, align: VerticalAlign.CENTER,
        margins: { top: 0, bottom: 0, left: 80, right: 0 },
        children: qrChildren,
      });

      const innerTable = new Table({
        width: { size: cardW - 320, type: WidthType.DXA },
        columnWidths: [PHOTO_W, INFO_W, QR_W],
        rows: [new TableRow({ cantSplit: true, children: [photoCell, infoCell, qrCell] })],
      });

      rowCells.push(cell({
        width: cardW, borders: lightBorders, shading: COLORS.white,
        align: VerticalAlign.CENTER,
        margins: { top: 90, bottom: 90, left: 140, right: 140 },
        children: [innerTable],
      }));
    }
    items.push(new Table({
      width: { size: USABLE_W, type: WidthType.DXA },
      columnWidths: [cardW, cardW],
      rows: [new TableRow({ cantSplit: true, children: rowCells })],
    }));
    items.push(spacer(40));
  }

  return items;
}

// ==== BACK COVER ====
function backCover() {
  return [
    // Note: no pageBreakBefore — this content lives in its own section which starts on a new page.
    new Paragraph({ spacing: { before: 3000 }, children: [new TextRun('')] }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 400 },
      children: [new TextRun({ text: 'Thank You', font: FONT_HEAD, size: 96, bold: true, color: COLORS.navy })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 800 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: COLORS.orange } },
      children: [new TextRun('')],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: 'See you next year.', font: FONT, size: 32, italics: true, color: COLORS.textMuted })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: 'EOSNorthTexas.com', font: FONT_HEAD, size: 26, bold: true, color: COLORS.orange })],
    }),
  ];
}

// ---------- Morning session notes pages (free sessions, no handout) ----------
// One MY NOTES page per free morning session, inserted between agenda and
// the paid speaker sections.
const MORNING_NOTES = [
  { title: 'Get a Grip on your Business with EOS',            speaker: 'Ann Sheu',           time: '8:00 – 9:35 AM' },
  { title: 'Journey with an EOS Implementer',                  speaker: 'Strety',              time: '9:55 – 10:45 AM' },
  { title: 'Your Sales Team Isn’t the Problem. Your System Is.', speaker: 'The System of Selling', time: '11:00 AM – 12:00 PM' },
  { title: 'Lunch with Walt Brown: Healthy Matters',           speaker: 'Walt Brown',          time: '12:00 – 1:00 PM' },
];

function morningNotesPage(m) {
  const items = [];
  items.push(pageBreak());
  items.push(new Paragraph({
    spacing: { after: 60 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: 'MY NOTES · ' + m.title.toUpperCase(), font: FONT_HEAD, size: 24, bold: true, color: COLORS.orange })],
  }));
  items.push(new Paragraph({
    spacing: { after: 300 }, alignment: AlignmentType.LEFT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.orange } },
    children: [new TextRun({ text: `${m.time} · ${m.speaker}`, font: FONT, size: 18, color: COLORS.textMuted })],
  }));
  items.push(noteLinesTable(25)); // morning notes has extra subheading (time+speaker), 25 @ 470 DXA fits
  return items;
}

// ---------- Assemble document ----------
const allChildren = [
  ...coverPage(),
  ...welcomeLetter(),
  ...agendaPage(),
];

// Morning session notes pages (4 pages)
MORNING_NOTES.forEach(m => {
  morningNotesPage(m).forEach(c => allChildren.push(c));
});

// Speaker sections (paid sessions)
SPEAKER_SESSIONS.forEach(s => {
  speakerCoverPage(s).forEach(c => allChildren.push(c));
});

// Books
booksPage().forEach(c => allChildren.push(c));

// Sponsors
sponsorsPage().forEach(c => allChildren.push(c));

// EOSI Directory
eosiDirectory().forEach(c => allChildren.push(c));

// Back cover lives in its own section (see sections[1]) so it can
// suppress the running header + page number. Do NOT append to allChildren.
const backCoverChildren = backCover();

const doc = new Document({
  creator: 'WRoEOS North Texas',
  title: 'WRoEOS North Texas 2026 \u2014 Attendee Workbook',
  description: 'Attendee workbook',
  numbering: {
    config: [
      {
        reference: 'welcome-bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 48, bold: true, font: FONT_HEAD, color: COLORS.navy },
        paragraph: { spacing: { before: 280, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: FONT_HEAD, color: COLORS.navy },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT_HEAD, color: COLORS.orange },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  sections: [
    // Main section: cover + all body pages. Cover suppresses header via titlePage.
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
        titlePage: true,
      },
      children: allChildren,
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT, spacing: { after: 0 },
              children: [new TextRun({
                text: 'We Run ON EOS®',
                font: FONT_HEAD, size: 26, bold: true, color: COLORS.text,
              })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT, spacing: { after: 100 },
              children: [new TextRun({
                text: 'North Texas 2026',
                font: FONT_HEAD, size: 22, bold: true, color: COLORS.textMuted,
              })],
            }),
          ],
        }),
        first: new Header({ children: [new Paragraph('')] }),  // hide on cover
      },
      footers: {
        // Page numbers are applied post-build by paginate_workbook.py so
        // they stay consistent across the Word pages AND the spliced-in
        // presenter handout pages. Leave the docx footer empty.
        default: new Footer({ children: [new Paragraph('')] }),
        first: new Footer({ children: [new Paragraph('')] }),
      },
    },
    // Back cover section: no header, no footer, no page number.
    // The paginator skips this page automatically because it keys off
    // WORKBOOK_HEADER_MARKER ("North Texas 2026"), which is absent here.
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: backCoverChildren,
      headers: {
        default: new Header({ children: [new Paragraph('')] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph('')] }),
      },
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const outPath = path.join(__dirname, 'Workbook.docx');
  fs.writeFileSync(outPath, buf);
  console.log('OK →', outPath, `(${(buf.length / 1024).toFixed(0)} KB)`);
});
