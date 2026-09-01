// Build the WRoEOS Dallas 2026 attendee workbook (.docx)
// US Letter portrait. Navy/orange EOS palette. Print-ready.
// Run: node build_workbook.js

const fs = require('fs');
const path = require('path');
const docx = require('docx');
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
      height: { value: 460, rule: HeightRule.EXACT },
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
      color: COLORS.orange, characterSpacing: 200,
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
  return [
    H1('Welcome', { pageBreakBefore: true }),
    ruleLine(),
    P('[Welcome letter — coming soon]', { italics: true, color: COLORS.textMuted, size: 22 }),
    spacer(200),
    P('Placeholder for the opening letter from the North Texas EOS® community.', { italics: true, color: COLORS.textMuted }),
    spacer(200),
    P('Suggested contents:', { bold: true }),
    P('• Thanks to attendees, sponsors, and speakers'),
    P('• Theme of the day / what to expect'),
    P('• How to make the most of the workbook'),
    P('• Sign-off from the host committee'),
  ];
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
    const speaker = (r.speaker || '').split(' · ')[0] || '';
    const highlight = r.highlight;
    tableRows.push(new TableRow({
      children: [
        cell({
          width: 2200, shading: stripe, borders: noBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({ text: r.time, font: FONT, size: 20, bold: true, color: COLORS.navy })] })]
        }),
        cell({
          width: 5680, shading: stripe, borders: noBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({
              text: r.session, font: FONT, size: highlight ? 22 : 20,
              bold: highlight, color: highlight ? COLORS.text : COLORS.textMuted,
            })] })]
        }),
        cell({
          width: 2200, shading: stripe, borders: noBorders,
          margins: { top: 100, bottom: 100, left: 140, right: 100 },
          children: [new Paragraph({
            children: [new TextRun({ text: speaker, font: FONT, size: 18, color: COLORS.textMuted })] })]
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
const SPEAKER_SESSIONS = [
  { session_title: 'Get a Grip on your Business with EOS', speaker: 'Ann Sheu', title: 'Certified EOS Implementer®',
    time: '8:00 – 9:35 AM', slug: 'ann-sheu' },
  { session_title: 'Journey with an EOS Implementer', speaker: 'Strety', title: 'Title Sponsor',
    time: '9:55 – 10:45 AM', slug: 'strety', is_sponsor: true },
  { session_title: 'Your Sales Team Isn\u2019t the Problem. Your System Is.', speaker: 'The System of Selling', title: 'Title Sponsor',
    time: '11:00 AM – 12:00 PM', slug: 'system-of-selling', is_sponsor: true },
  { session_title: 'Lunch with Walt Brown: Healthy Matters', speaker: 'Walt Brown', title: 'EOS Worldwide Head Coach',
    time: '12:00 – 1:00 PM', slug: 'walt-brown',
    subtitle: 'Unlocking the power of Healthy. Introduction to the latest EOS Trust Builder → 7 Critical Needs.' },
  { session_title: 'Profit Power: Stronger — or Just Bigger?', speaker: 'Mark Stanley', title: 'Expert EOS Implementer®',
    time: '1:00 – 2:30 PM', slug: 'mark-stanley' },
  { session_title: 'Rollout, Reworked: Your Plan for Running EOS® Company-Wide', speaker: 'Beth Fahey', title: 'Expert EOS Implementer®',
    time: '2:50 – 4:25 PM', slug: 'beth-fahey' },
  { session_title: 'The 10 Pillars of Visionary Greatness', speaker: 'Mark C. Winters', title: 'Expert EOS Implementer®',
    time: '4:45 – 6:15 PM', slug: 'mark-c-winters' },
];

function speakerCoverPage(s) {
  const items = [];
  items.push(new Paragraph({
    pageBreakBefore: true, spacing: { before: 1200, after: 100 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: 'SESSION', font: FONT_HEAD, size: 20, bold: true, color: COLORS.orange, characterSpacing: 200 })],
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
    children: [new TextRun({ text: 'PRESENTED BY', font: FONT_HEAD, size: 18, bold: true, color: COLORS.orange, characterSpacing: 200 })],
  }));
  items.push(new Paragraph({
    spacing: { after: 40 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.speaker, font: FONT_HEAD, size: 34, bold: true, color: COLORS.navy })],
  }));
  items.push(new Paragraph({
    spacing: { after: 400 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.title, font: FONT, size: 22, italics: true, color: COLORS.textMuted })],
  }));

  items.push(new Paragraph({ spacing: { before: 800 }, children: [new TextRun('')] }));

  // Placeholder body
  items.push(new Paragraph({
    alignment: AlignmentType.LEFT, spacing: { after: 100 },
    children: [new TextRun({ text: 'CONTENT', font: FONT_HEAD, size: 18, bold: true, color: COLORS.orange, characterSpacing: 200 })],
  }));
  items.push(new Paragraph({
    spacing: { after: 200 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: 'Coming soon — the presenter\u2019s slides and key takeaways will be printed here.', font: FONT, size: 22, italics: true, color: COLORS.textMuted })],
  }));

  // 1 placeholder content page
  items.push(pageBreak());
  items.push(new Paragraph({
    spacing: { after: 120 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.speaker.toUpperCase() + ' · CONTENT', font: FONT_HEAD, size: 18, bold: true, color: COLORS.orange, characterSpacing: 200 })],
  }));
  items.push(new Paragraph({
    spacing: { after: 200 }, alignment: AlignmentType.LEFT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.orange } },
    children: [new TextRun('')],
  }));
  items.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: '[Content placeholder — 1 to 4 pages provided by the presenter.]', font: FONT, size: 22, italics: true, color: COLORS.textMuted })],
  }));

  // Notes page (12 note lines)
  items.push(pageBreak());
  items.push(new Paragraph({
    spacing: { after: 120 }, alignment: AlignmentType.LEFT,
    children: [new TextRun({ text: s.speaker.toUpperCase() + ' · MY NOTES', font: FONT_HEAD, size: 18, bold: true, color: COLORS.orange, characterSpacing: 200 })],
  }));
  items.push(new Paragraph({
    spacing: { after: 300 }, alignment: AlignmentType.LEFT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.orange } },
    children: [new TextRun('')],
  }));
  items.push(noteLinesTable(20));

  return items;
}

// ==== BOOKS PAGE ====
function booksPage() {
  const BOOKS = [
    { title: 'Data', author: 'Mark Stanley', retail: '$20.66',
      description: 'Harness Your Numbers to Go from Uncertain to Unstoppable. A practical playbook for using data to drive decisions and accountability.',
      cover: path.join(__dirname, 'assets/books/data_cover.jpg') },
    { title: 'Rollout', author: 'Beth Fahey', retail: '$29.99',
      description: 'Get Your Entire Team Running on EOS® to Achieve Your Vision. A field-tested guide for taking EOS deeper across your whole organization.',
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
  items.push(spacer(200));

  BOOKS.forEach((b) => {
    const row = new TableRow({
      cantSplit: true,
      children: [
        cell({
          width: 2600, borders: noBorders,
          align: VerticalAlign.TOP,
          margins: { top: 100, bottom: 100, left: 0, right: 200 },
          children: [new Paragraph({
            spacing: { after: 100 },
            children: [image(b.cover, 165, 245)]
          })],
        }),
        cell({
          width: 7480, borders: noBorders, align: VerticalAlign.TOP,
          margins: { top: 100, bottom: 100, left: 200, right: 0 },
          children: [
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: b.title, font: FONT_HEAD, size: 34, bold: true, color: COLORS.navy })],
            }),
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: 'by ' + b.author + '  ·  Retail ' + b.retail, font: FONT, size: 20, italics: true, color: COLORS.textMuted })],
            }),
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: b.description, font: FONT, size: 22, color: COLORS.text })],
            }),
          ],
        }),
      ],
    });
    items.push(new Table({
      width: { size: USABLE_W, type: WidthType.DXA },
      columnWidths: [2600, 7480],
      rows: [row],
    }));
    items.push(spacer(240));
  });

  return items;
}

// ==== SPONSORS PAGE ====
function sponsorsPage() {
  const tiers = SITE_CONFIG.sponsors.tiers;
  const sponsors = SITE_CONFIG.sponsors.sponsors.filter(s => s.verified);

  // Group sponsors by tier key
  const tierKeyMap = {
    'Title Sponsor': 'title',
    'Book Sponsor': 'book',
    'Happy Hour Sponsor': 'happyHour',
    'Lounge Sponsor': 'lounge',
    'Swag Bag Sponsor': 'swag',
    'Booth Sponsor': 'booth',
  };
  const tierOrder = ['title', 'book', 'happyHour', 'lounge', 'swag', 'booth'];
  const tierLabel = {
    title: 'Title Sponsors',
    book: 'Book Sponsors',
    happyHour: 'Happy Hour Sponsor',
    lounge: 'Lounge Sponsor',
    swag: 'Swag Bag Sponsors',
    booth: 'Booth Sponsors',
  };
  const grouped = {};
  sponsors.forEach(s => {
    grouped[s.tier] = grouped[s.tier] || [];
    grouped[s.tier].push(s);
  });

  const items = [];
  items.push(H1('Thank You to Our Sponsors', { pageBreakBefore: true }));
  items.push(ruleLine());
  items.push(P('This day is made possible by the generosity of these North Texas businesses.',
    { italics: true, color: COLORS.textMuted, size: 22 }));
  items.push(spacer(200));

  tierOrder.forEach(tk => {
    const list = grouped[tk] || [];
    if (list.length === 0) return;
    items.push(H3(tierLabel[tk]));
    // 2-column grid of logos
    const cols = 2;
    for (let i = 0; i < list.length; i += cols) {
      const rowCells = [];
      for (let c = 0; c < cols; c++) {
        const s = list[i + c];
        if (!s) {
          rowCells.push(cell({ width: 5040, borders: noBorders, children: [new Paragraph('')] }));
          continue;
        }
        // Resolve local logo
        const logoBase = path.basename(s.logo).replace(/\.(svg|jpg|jpeg|webp)$/i, '.png').replace(/\.png$/, '.png');
        const localPath = path.join(__dirname, 'assets/sponsors', logoBase);
        const cellChildren = [];
        try {
          cellChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { after: 100 },
            children: [image(localPath, 200, 90)]
          }));
        } catch (e) {
          cellChildren.push(new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { after: 100 },
            children: [new TextRun({ text: '[logo]', font: FONT, size: 18, color: COLORS.textMuted })]
          }));
        }
        cellChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
          children: [new TextRun({ text: s.name, font: FONT_HEAD, size: 22, bold: true, color: COLORS.navy })],
        }));
        cellChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new ExternalHyperlink({
            link: s.url,
            children: [new TextRun({
              text: s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
              font: FONT, size: 18, color: COLORS.orange, style: 'Hyperlink',
            })],
          })],
        }));
        rowCells.push(cell({
          width: 5040, borders: lightBorders, shading: COLORS.white,
          align: VerticalAlign.CENTER,
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          children: cellChildren,
        }));
      }
      items.push(new Table({
        width: { size: USABLE_W, type: WidthType.DXA },
        columnWidths: [5040, 5040],
        rows: [new TableRow({ cantSplit: true, children: rowCells })],
      }));
      items.push(spacer(120));
    }
    items.push(spacer(200));
  });

  return items;
}

// ==== EOSI DIRECTORY ====
function eosiDirectory() {
  const items = [];
  items.push(H1('DFW EOS Implementer® Directory', { pageBreakBefore: true }));
  items.push(ruleLine());
  items.push(P('The certified EOS Implementers serving North Texas businesses.',
    { italics: true, color: COLORS.textMuted, size: 22 }));
  items.push(spacer(200));

  // 2 columns × cards
  const roster = [...ROSTER].sort((a, b) => a.last_name.localeCompare(b.last_name));
  const cols = 2;

  for (let i = 0; i < roster.length; i += cols) {
    const rowCells = [];
    for (let c = 0; c < cols; c++) {
      const r = roster[i + c];
      if (!r) {
        rowCells.push(cell({ width: 5040, borders: noBorders, children: [new Paragraph('')] }));
        continue;
      }
      const photoInfo = PHOTO_MANIFEST[r.name];
      const photoPath = photoInfo && photoInfo.path ? photoInfo.path : null;

      // Left sub-cell: photo, Right sub-cell: text — implement as inner table
      const photoCell = cell({
        width: 1400, borders: noBorders, align: VerticalAlign.TOP,
        margins: { top: 0, bottom: 0, left: 0, right: 100 },
        children: [
          photoPath
            ? new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 40 }, children: [image(photoPath, 90, 90)] })
            : new Paragraph({
                alignment: AlignmentType.CENTER,
                shading: { fill: COLORS.navy, type: ShadingType.CLEAR },
                children: [new TextRun({ text: (r.first_name[0] + r.last_name[0]).toUpperCase(), font: FONT_HEAD, size: 32, bold: true, color: COLORS.white })],
              }),
        ],
      });

      const infoChildren = [
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: r.name, font: FONT_HEAD, size: 22, bold: true, color: COLORS.navy })],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: r.designation + ' EOS Implementer®', font: FONT, size: 16, italics: true, color: COLORS.orange })],
        }),
      ];
      if (r.primary_market) {
        infoChildren.push(new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Primary: ', font: FONT, size: 16, bold: true, color: COLORS.textMuted }),
            new TextRun({ text: r.primary_market, font: FONT, size: 16, color: COLORS.text }),
          ],
        }));
      }
      if (r.other_market) {
        infoChildren.push(new Paragraph({
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Other: ', font: FONT, size: 16, bold: true, color: COLORS.textMuted }),
            new TextRun({ text: r.other_market, font: FONT, size: 16, color: COLORS.text }),
          ],
        }));
      }
      if (r.email) {
        infoChildren.push(new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: r.email, font: FONT, size: 14, color: COLORS.textMuted })],
        }));
      }
      if (r.profile_url) {
        infoChildren.push(new Paragraph({
          children: [new ExternalHyperlink({
            link: r.profile_url,
            children: [new TextRun({ text: 'EOS Worldwide Profile', font: FONT, size: 14, color: COLORS.orange, style: 'Hyperlink' })],
          })],
        }));
      }
      const infoCell = cell({
        width: 3540, borders: noBorders, align: VerticalAlign.TOP,
        margins: { top: 0, bottom: 0, left: 100, right: 0 },
        children: infoChildren,
      });

      // Inner table (photo + info) for one card
      const innerTable = new Table({
        width: { size: 4940, type: WidthType.DXA },
        columnWidths: [1400, 3540],
        rows: [new TableRow({ cantSplit: true, children: [photoCell, infoCell] })],
      });

      rowCells.push(cell({
        width: 5040, borders: lightBorders, shading: COLORS.white,
        align: VerticalAlign.TOP,
        margins: { top: 160, bottom: 160, left: 160, right: 160 },
        children: [innerTable],
      }));
    }
    items.push(new Table({
      width: { size: USABLE_W, type: WidthType.DXA },
      columnWidths: [5040, 5040],
      rows: [new TableRow({ cantSplit: true, children: rowCells })],
    }));
    items.push(spacer(100));
  }

  return items;
}

// ==== BACK COVER ====
function backCover() {
  return [
    new Paragraph({ pageBreakBefore: true, spacing: { before: 3000 }, children: [new TextRun('')] }),
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

// ---------- Assemble document ----------
const allChildren = [
  ...coverPage(),
  ...welcomeLetter(),
  ...agendaPage(),
];

// Speaker sections
SPEAKER_SESSIONS.forEach(s => {
  speakerCoverPage(s).forEach(c => allChildren.push(c));
});

// Books
booksPage().forEach(c => allChildren.push(c));

// Sponsors
sponsorsPage().forEach(c => allChildren.push(c));

// EOSI Directory
eosiDirectory().forEach(c => allChildren.push(c));

// Back cover
backCover().forEach(c => allChildren.push(c));

const doc = new Document({
  creator: 'WRoEOS North Texas',
  title: 'WRoEOS North Texas 2026 — Attendee Workbook',
  description: 'Attendee workbook',
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
    // Cover: no page numbers
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
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT, spacing: { after: 100 },
            children: [new TextRun({
              text: 'WRoEOS North Texas 2026',
              font: FONT, size: 16, color: COLORS.textMuted,
            })],
          })],
        }),
        first: new Header({ children: [new Paragraph('')] }),  // hide on cover
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { before: 100 },
            children: [
              new TextRun({ text: 'Page ', font: FONT, size: 16, color: COLORS.textMuted }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: COLORS.textMuted }),
              new TextRun({ text: ' of ', font: FONT, size: 16, color: COLORS.textMuted }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: COLORS.textMuted }),
            ],
          })],
        }),
        first: new Footer({ children: [new Paragraph('')] }),  // hide on cover
      },
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const outPath = path.join(__dirname, 'Workbook.docx');
  fs.writeFileSync(outPath, buf);
  console.log('OK →', outPath, `(${(buf.length / 1024).toFixed(0)} KB)`);
});
