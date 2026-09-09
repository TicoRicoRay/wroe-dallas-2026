#!/usr/bin/env node
/**
 * WRoEOS North Texas 2026 — Customer Celebrations Loop
 * 16:9 PowerPoint. Auto-advance 8s per slide. Runs looped during breaks.
 *
 * Design matches main Event Deck: navy #0B1F3A, orange #E87722, Calibri.
 * Layout per slide: photo left (or centered typography), text right.
 *
 * Requires: pptxgenjs (installed at /home/user/node_modules)
 */

'use strict';

process.chdir(__dirname);
process.env.NODE_PATH = '/home/user/node_modules:' + (process.env.NODE_PATH || '');
require('module').Module._initPaths();

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// ====== DESIGN TOKENS (match main deck) ======
const NAVY       = '0B1F3A';
const ORANGE     = 'E87722';
const WHITE      = 'FFFFFF';
const CREAM      = 'F4F6F9';
const RULE       = 'C9D2DE';

const FONT_HEAD = 'Calibri';
const FONT_BODY = 'Calibri';

const ADVANCE_SEC = 8;

// ====== ASSETS ======
const ASSETS = path.join(__dirname, 'assets');
const WORDMARK = path.join(ASSETS, 'wordmark.jpg');

// ====== CUSTOMER DATA ======
// EY branding note: we use "EY Entrepreneur Of The Year" in the badge kicker
// (small, all-caps, no ® needed there per EY brand guidelines for kickers)
// and use a rich-run superscript ® in the section-divider title only.
const CUSTOMERS = [
  // --- Spillers clients ---
  {
    name: 'Maverick Power',
    headline: 'Signs $1.75 billion acquisition agreement with nVent',
    detail: 'Announced Aug 24, 2026 with up to $550M more tied to 2027–2028 performance. Also No. 7 on the 2026 Inc. Regionals: Southwest list (627% growth), a 2026 Inc. 5000 honoree, and Tom Currier named a 2026 DFW Titan 100 honoree.',
    readAs: 'Tom Currier, President and CEO',
    photo: null,
    badge: 'HEADLINE WIN',
  },
  {
    name: 'KPost Roofing & Waterproofing',
    headline: 'Best-in-Class, ARMA 2026 Excellence in Asphalt Roofing',
    detail: 'Commercial/Mixed Use category winner for the National Medal of Honor Museum in Arlington. Honored at the International Roofing Expo in Las Vegas, January 2026.',
    readAs: 'Steve Little, Keith Post, and Jayne Williams, Founders',
    photo: null,
    badge: 'SPILLERS CLIENT',
  },
  {
    name: 'Neighborhood Management, Inc.',
    headline: 'EY Entrepreneur Of The Year 2026 Southwest Finalist',
    detail: 'President Beverly Coghlan, PCAM — one of 44 finalists from 41 companies, announced April 21, 2026.',
    readAs: 'Beverly Coghlan, President',
    photo: 'neighborhood_beverly.jpg',
    badge: 'SPILLERS CLIENT',
  },
  {
    name: 'B2 Design Co',
    headline: 'Connect CRE 2025 Women in Real Estate, Texas honoree',
    detail: 'Founder and CEO B. Allison Brooks, AIA (October 2025). Recently completed interiors for HALL Park Hotel and The Ludlow. Offices in Dallas, Chicago, Miami, and Chapel Hill.',
    readAs: 'B. Allison Brooks, Founder and CEO',
    photo: null,
    badge: 'SPILLERS CLIENT',
  },
  {
    name: 'Artstillery',
    headline: '10 years and a 2026 Moody Fund for the Arts grant',
    detail: 'Celebrating 10 years (June 27, 2026). The grant supports "Dichotomy of Compassion," the current immersive multimedia production. Now Dallas and Chicago.',
    readAs: 'Ilknur Nilufer Ozgur, Founder, Executive and Artistic Director',
    photo: null,
    badge: 'SPILLERS CLIENT',
  },

  // --- EY EOY 2026 NTX EOS Community ---
  {
    name: 'Moonshot',
    headline: 'Southwest Winner — advancing to National Awards',
    detail: 'Founder and CEO Ethan Ellenberg. Denton-based. Advances to the EY National Awards in November 2026.',
    readAs: 'Ethan Ellenberg, Founder and CEO   ·   Implementer: Ryan Wall',
    photo: 'moonshot_ethan.jpg',
    badge: 'EY EOY 2026 · SOUTHWEST WINNER',
  },
  {
    name: 'Lime Media Group',
    headline: 'Southwest Winner + 2026 Top Workplaces Culture Excellence',
    detail: 'Founder and CEO Heath Hill. Rockwall-based. Top Workplaces Culture Excellence winner (July 2026).',
    readAs: 'Heath Hill, Founder and CEO   ·   Implementer: Leonard',
    photo: 'lime_heath.jpg',
    badge: 'EY EOY 2026 · SOUTHWEST WINNER',
  },
  {
    name: 'Brain Storm Shelter Restaurants',
    headline: 'Southwest Finalist',
    detail: 'Jason Boso — founder of Truck Yard, Twisted Root Burger Co., and more. Also a finalist in the Oklahoma City ULI Impact Awards.',
    readAs: 'Jason Boso, Founder   ·   Implementer: Amanda',
    photo: 'brainstorm_jason.jpg',
    badge: 'EY EOY 2026 · SOUTHWEST FINALIST',
  },
  {
    name: 'TruLabs',
    headline: 'Southwest Finalists',
    detail: 'Co-founders Brandon Pogue (CEO) and Jennifer Pogue (CMO). McKinney-based.',
    readAs: 'Brandon and Jennifer Pogue   ·   Implementer: Amy',
    photo: 'trulabs_pogues.jpg',
    badge: 'EY EOY 2026 · SOUTHWEST FINALIST',
  },
  {
    name: 'Excel Medical Staffing',
    headline: 'Southwest Finalist',
    detail: 'Founder and CEO Gabriel Griess, U.S. Air Force Academy graduate. Grapevine-based.',
    readAs: 'Gabriel Griess, Founder and CEO   ·   Implementer: Justin Mink',
    photo: 'excel_gabe.jpg',
    badge: 'EY EOY 2026 · SOUTHWEST FINALIST',
  },
  {
    name: 'HorsePower Brands',
    headline: 'Heartland Finalist',
    detail: 'CEO Tony Hulbert. Nine home-service franchise brands, five of them on Entrepreneur magazine\u2019s 2026 Franchise 500. Omaha-based.',
    readAs: 'Tony Hulbert, CEO   ·   Implementer: Justin Mink',
    photo: null,
    badge: 'EY EOY 2026 · HEARTLAND FINALIST',
  },

  // --- More community celebrations ---
  {
    name: 'North Texas Ophthalmology',
    headline: 'Launched LASIK, opened a second location, turned a loss into profit',
    detail: 'Wichita Falls. Launched LASIK as a new service line, opened a second location, and turned a $300K loss in 2025 into roughly $150K profit YTD 2026 while paying down debt.',
    readAs: 'Matt Griffiths, Director of Marketing and Technology',
    photo: 'ntoa_lasik_team.jpg',
    badge: 'COMMUNITY WIN',
  },
  {
    name: 'Austin Street Center',
    headline: 'D CEO 2026 Nonprofit and Corporate Citizenship Finalist',
    detail: 'Dallas. Record 640 housing placements in FY25 (up 25%). Record revenue in FY25, up 17% year-over-year and 36% over two years.',
    readAs: 'Daniel Roby, CEO',
    photo: 'austin_street.jpg',
    badge: 'COMMUNITY WIN',
  },
  {
    name: 'BAT Security',
    headline: 'Up 23% in gross revenue in the first 7 months on EOS',
    detail: 'Waxahachie. Started Focus Day in January 2026 and posted Core Values throughout the office. Momentum has held all year.',
    readAs: 'Kyle Beller, President',
    photo: null,
    badge: 'COMMUNITY WIN',
  },
  {
    name: 'Blue Mint Thai',
    headline: 'Multi-year Best of DFW, ESGR honors, and a House Resolution',
    detail: 'Midlothian. Best Asian Restaurant in South DFW five years running (2021–2026). ESGR Pro Patria, Patriot, and Above and Beyond awards (July 2026). House Resolution from Rep. Brian Harrison (August 2026).',
    readAs: 'Mike Wilson, CEO   ·   Alisa Dodenhoff',
    photo: 'blue_mint_hero.jpg',
    badge: 'COMMUNITY WIN',
  },
  {
    name: 'Rose Marketing Solutions',
    headline: 'EO Dallas Forum Moderator of the Year',
    detail: 'Ruth Ann Rose named Forum Moderator of the Year by EO Dallas. Featured speaker at the Hinge Brokers Shift Early Childhood Conference. On track for the highest revenue year in company history.',
    readAs: 'Ruth Ann Rose, Founder   ·   Implementer: Amanda Matthews',
    photo: null,
    badge: 'COMMUNITY WIN',
  },
];

// ====== BUILD ======
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in (16:9)
pptx.title = 'WRoEOS North Texas 2026 — Customer Celebrations';
pptx.author = 'We Run on EOS North Texas';
pptx.company = 'EOS Worldwide';
pptx.subject = 'Break loop — customer celebrations';

const SW = 13.333, SH = 7.5;

// ---- Helper: navy background with orange bottom rule and wordmark ----
function addChrome(slide) {
  slide.background = { color: NAVY };
  slide.addShape('rect', {
    x: 0, y: SH - 0.08, w: SW, h: 0.08, fill: { color: ORANGE }, line: { color: ORANGE },
  });
  slide.addImage({ path: WORDMARK, x: SW - 2.4, y: SH - 0.72, w: 2.15, h: 0.55 });
}

// Auto-size a name based on character count and target width.
// For photo layout, text panel is ~5.7" wide.
// For typography-only layout, we allow up to ~11" wide.
function nameFontSize(name, layout /* 'photo' | 'type' */) {
  const len = name.length;
  if (layout === 'photo') {
    if (len <= 12) return 40;
    if (len <= 18) return 34;
    if (len <= 24) return 28;
    if (len <= 30) return 24;
    return 22;
  } else {
    if (len <= 14) return 60;
    if (len <= 22) return 52;
    if (len <= 30) return 44;
    return 38;
  }
}

// ---- TITLE SLIDE ----
{
  const s = pptx.addSlide();
  addChrome(s);
  s.addText('Customer', {
    x: 0.9, y: 1.8, w: SW - 1.8, h: 1.2,
    fontFace: FONT_HEAD, fontSize: 68, bold: true, color: WHITE, align: 'center',
  });
  s.addText('CELEBRATIONS', {
    x: 0.9, y: 2.8, w: SW - 1.8, h: 1.4,
    fontFace: FONT_HEAD, fontSize: 100, bold: true, color: ORANGE, align: 'center',
    charSpacing: 6,
  });
  s.addText('We Run on EOS North Texas 2026', {
    x: 0.9, y: 4.4, w: SW - 1.8, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 26, color: WHITE, align: 'center',
  });
  s.addText('Monday, September 14, 2026   ·   The Statler, Dallas', {
    x: 0.9, y: 5.0, w: SW - 1.8, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 18, color: RULE, align: 'center',
  });
}

// ---- SECTION DIVIDERS ----
// titleRuns lets us pass rich runs so ® renders as a superscript at reasonable size.
function addSectionDivider(kicker, titleRuns, blurb) {
  const s = pptx.addSlide();
  addChrome(s);
  s.addText(kicker, {
    x: 0.9, y: 2.6, w: SW - 1.8, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 18, bold: true, color: ORANGE, align: 'center',
    charSpacing: 4,
  });
  s.addText(titleRuns, {
    x: 0.9, y: 3.1, w: SW - 1.8, h: 1.4,
    fontFace: FONT_HEAD, fontSize: 54, bold: true, color: WHITE, align: 'center',
  });
  if (blurb) {
    s.addText(blurb, {
      x: 1.6, y: 4.6, w: SW - 3.2, h: 0.9,
      fontFace: FONT_BODY, fontSize: 18, color: RULE, align: 'center',
    });
  }
}

function addCustomerSlide(c) {
  const s = pptx.addSlide();
  addChrome(s);

  const hasPhoto = !!c.photo;
  const photoPath = hasPhoto ? path.join(ASSETS, c.photo) : null;
  if (hasPhoto && !fs.existsSync(photoPath)) {
    throw new Error(`Missing photo asset: ${photoPath}`);
  }

  if (hasPhoto) {
    // Left half: photo panel (5.7" wide × 6.3" tall — near-portrait so more headshots crop cleanly)
    const PX = 0.5, PY = 0.5, PW = 5.7, PH = 6.3;
    s.addShape('rect', {
      x: PX, y: PY, w: PW, h: PH,
      fill: { color: CREAM }, line: { color: RULE, width: 0.5 },
    });
    s.addImage({
      path: photoPath,
      x: PX, y: PY, w: PW, h: PH,
      sizing: { type: 'cover', w: PW, h: PH },
    });

    // Right half: text panel
    const TX = 6.5, TW = SW - TX - 0.5;
    s.addText(c.badge, {
      x: TX, y: 0.8, w: TW, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 12, bold: true, color: ORANGE, align: 'left',
      charSpacing: 4,
    });
    s.addText(c.name, {
      x: TX, y: 1.25, w: TW, h: 1.7,
      fontFace: FONT_HEAD, fontSize: nameFontSize(c.name, 'photo'), bold: true, color: WHITE, align: 'left',
      valign: 'top',
    });
    // Orange divider between name and headline
    s.addShape('rect', {
      x: TX, y: 3.1, w: 1.0, h: 0.05,
      fill: { color: ORANGE }, line: { color: ORANGE },
    });
    s.addText(c.headline, {
      x: TX, y: 3.3, w: TW, h: 1.2,
      fontFace: FONT_HEAD, fontSize: 18, bold: true, color: ORANGE, align: 'left',
      valign: 'top',
    });
    s.addText(c.detail, {
      x: TX, y: 4.6, w: TW, h: 1.8,
      fontFace: FONT_BODY, fontSize: 14, color: WHITE, align: 'left',
      valign: 'top',
    });
    s.addText(c.readAs, {
      x: TX, y: 6.4, w: TW, h: 0.4,
      fontFace: FONT_BODY, fontSize: 12, italic: true, color: RULE, align: 'left',
    });
  } else {
    // Typography-only slide (centered)
    s.addText(c.badge, {
      x: 1.0, y: 1.4, w: SW - 2.0, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: ORANGE, align: 'center',
      charSpacing: 6,
    });
    s.addText(c.name, {
      x: 0.8, y: 2.0, w: SW - 1.6, h: 1.4,
      fontFace: FONT_HEAD, fontSize: nameFontSize(c.name, 'type'), bold: true, color: WHITE, align: 'center',
      valign: 'top',
    });
    s.addShape('rect', {
      x: SW/2 - 1.0, y: 3.55, w: 2.0, h: 0.05,
      fill: { color: ORANGE }, line: { color: ORANGE },
    });
    s.addText(c.headline, {
      x: 1.5, y: 3.85, w: SW - 3.0, h: 1.0,
      fontFace: FONT_HEAD, fontSize: 24, bold: true, color: ORANGE, align: 'center',
      valign: 'top',
    });
    s.addText(c.detail, {
      x: 2.0, y: 4.85, w: SW - 4.0, h: 1.6,
      fontFace: FONT_BODY, fontSize: 17, color: WHITE, align: 'center',
      valign: 'top',
    });
    s.addText(c.readAs, {
      x: 1.0, y: 6.55, w: SW - 2.0, h: 0.4,
      fontFace: FONT_BODY, fontSize: 14, italic: true, color: RULE, align: 'center',
    });
  }
}

// Section: Spillers Clients
addSectionDivider('SECTION',
  [{ text: 'Spillers Clients', options: {} }],
  'North Texas businesses winning at their craft');
for (let i = 0; i < 5; i++) addCustomerSlide(CUSTOMERS[i]);

// Section: EY EOY 2026 — use rich runs so ® renders at superscript size
addSectionDivider('SECTION',
  [
    { text: 'EY Entrepreneur Of The Year', options: {} },
    { text: '\u00ae', options: { superscript: true, fontSize: 24 } },
    { text: ' 2026', options: {} },
  ],
  'North Texas EOS community winners and finalists');
for (let i = 5; i < 11; i++) addCustomerSlide(CUSTOMERS[i]);

// Section: More Community Celebrations
addSectionDivider('SECTION',
  [{ text: 'More Community Celebrations', options: {} }],
  'Wins from across the North Texas EOS community');
for (let i = 11; i < CUSTOMERS.length; i++) addCustomerSlide(CUSTOMERS[i]);

// ---- CLOSING SLIDE ----
{
  const s = pptx.addSlide();
  addChrome(s);
  s.addText('Congratulations', {
    x: 0.9, y: 1.9, w: SW - 1.8, h: 1.2,
    fontFace: FONT_HEAD, fontSize: 60, italic: true, color: WHITE, align: 'center',
  });
  s.addText('to our North Texas EOS Community', {
    x: 0.9, y: 3.0, w: SW - 1.8, h: 1.0,
    fontFace: FONT_HEAD, fontSize: 40, bold: true, color: ORANGE, align: 'center',
  });
  s.addShape('rect', {
    x: SW/2 - 1.5, y: 4.15, w: 3.0, h: 0.05,
    fill: { color: ORANGE }, line: { color: ORANGE },
  });
  s.addText('We Run on EOS North Texas 2026', {
    x: 0.9, y: 4.5, w: SW - 1.8, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 22, color: WHITE, align: 'center',
  });
  s.addText('The Statler, Dallas   ·   Monday, September 14, 2026', {
    x: 0.9, y: 5.05, w: SW - 1.8, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 16, color: RULE, align: 'center',
  });
}

// ---- WRITE ----
const OUT = path.join(__dirname, 'Celebrations-Loop.pptx');
pptx.writeFile({ fileName: OUT }).then((filename) => {
  console.log(`Wrote ${filename}`);
  console.log(`Slides: ${1 + 3 + CUSTOMERS.length + 1} (title + 3 dividers + ${CUSTOMERS.length} customers + closing)`);
  console.log(`Auto-advance will be added by post-process step (${ADVANCE_SEC}s).`);
});
