// ─────────────────────────────────────────────────────────────
//  WROE Dallas 2026 — Site Configuration
//  Single source of truth. Edit here, changes propagate everywhere.
// ─────────────────────────────────────────────────────────────

const SITE_CONFIG = {

  // ── EVENT DETAILS ──────────────────────────────────────────
  event: {
    name:       "We Run on EOS\u00AE Dallas 2026",
    edition:    "Fifth Annual",
    date:       "Monday, September 14, 2026",
    dateISO:    "2026-09-14T09:00:00-05:00",   // CDT, 9am start
    timeRange:  "9:00 AM",
    venue:      "The Statler Dallas",
    address:    "1914 Commerce St, Dallas, TX 75201",
    mapsLink:   "https://maps.google.com/?q=1914+Commerce+St+Dallas+TX+75201",
    parking:    "Complimentary parking available on-site",
    ctaUrl:     "https://wroedallas.regfox.com//we-run-on-eos-dfw",  // Master CTA link — used by every Register/Get Ticket button unless a tier-specific URL below overrides it
  },

  // ── TICKETS ────────────────────────────────────────────────
  tickets: {
    earlyBirdPrice:     199,
    standardPrice:      249,
    // Early bird is now COUNT-based, not date-based. Update earlyBirdSold manually as sales happen.
    // When earlyBirdSold >= earlyBirdCap, the site automatically switches to standard pricing copy.
    earlyBirdCap:       40,             // Total early bird tickets available
    earlyBirdSold:      39,              // MANUAL: update this number as early bird tickets sell
    cap:                null,           // (optional) overall venue cap — null hides the counter
    sold:               0,              // (optional) overall tickets sold
    earlyBirdUrl:       "https://wroedallas.regfox.com//we-run-on-eos-dfw#", 
    freeUrl:            "https://wroedallas.regfox.com//we-run-on-eos-dfw",  
  },

  // ── FULL-DAY VALUE STACK ────────────────────────────────
  // Exclusive bonuses for Full Day ticket holders. Drives the value-prop pitch.
  fullDayBonuses: {
    books: [
      {
        title:    "Data",
        subtitle: "Harness Your Numbers to Go from Uncertain to Unstoppable",
        authors:  "Mark O'Donnell, Angela Kalemis, Mark Stanley, et al.",
        speaker:  "Mark Stanley",
        retail:   20.66,
        bookUrl:  "https://www.eosworldwide.com/data-book",
        coverImage: "img/books/data_cover.jpg"
      },
      {
        title:    "Rollout",
        subtitle: "Get Your Entire Team Running on EOS® to Achieve Your Vision",
        authors:  "Marisa Smith & Beth Fahey",
        speaker:  "Beth Fahey",
        retail:   29.99,
        bookUrl:  "https://www.rolloutbook.com",
        coverImage: "img/books/rollout_cover.jpg"
      },
      {
        title:    "Visionary",
        subtitle: "How Driven Entrepreneurs Get What They Want Without Doing It All Themselves",
        authors:  "Mark C. Winters",
        speaker:  "Mark C. Winters",
        retail:   29.99,
        bookUrl:  "https://www.markcwinters.com/visionary-book-dot-com/",
        coverImage: "img/books/visionary_cover.jpg"
      }
    ],
    mealsValue:  45,    // Conservative DFW conference catered lunch value
    happyHourValue: 35  // Hosted happy hour w/ drinks + appetizers
  },

  // ── SPONSORS ───────────────────────────────────────────────
  sponsors: {
    contact:    "kevin.taylor@eosworldwide.com",
    tiers: [
      { name: "Title Sponsor",      price: 10000, available: 0 },
      { name: "Book Sponsor",       price: 9000,  available: 0 },
      { name: "Happy Hour Sponsor", price: 6500,  available: 0 },
      { name: "Swag Bag Sponsor",   price: 3500,  available: 0 },
      { name: "Booth Sponsor",      price: 1500,  available: 0 },
    ],
    sponsors: [
      {
        name: "The Sales Collective",
        tier: "title",
        url:  "https://thesalescollective.com/",
        logo: "images/thesalescollective.png",
        alt:  "The Sales Collective"
      },
      {
        name: "Strety",
        tier: "title",
        url:  "https://strety.com/",
        logo: "images/strety.png",
        alt:  "Strety"
      },
      {
        name: "ProCFO",
        tier: "book",
        url:  "https://procfo.com/",
        logo: "images/procfo.png",
        alt:  "ProCFO"
      },
      {
        name: "Trainual",
        tier: "book",
        url:  "https://trainual.com/",
        logo: "images/trainual.png",
        alt:  "Trainual"
      },
      {
        name: "Titus Talent",
        tier: "book",
        url:  "https://titus-talent.com/",
        logo: "images/titustalent.png",
        alt:  "Titus Talent"
      },
      {
        name: "Ninety.io",
        tier: "happyHour",
        url:  "https://ninety.io/",
        logo: "images/ninety.png",
        alt:  "Ninety.io"
      },
      {
        name: "Success.co",
        tier: "swag",
        url:  "https://www.success.co/",
        logo: "images/successco.png",
        alt:  "Success.co",
        email: "chris@success.co"
      },
      {
        name: "Wolf's Edge Integrators",
        tier: "booth",
        url:  "https://wolfsedgeintegrators.com/",
        logo: "images/wolfsedgeintegrators.png",
        alt:  "Wolf's Edge Integrators"
      },
      ,
      {
        name: "360 Consulting DFW",
        tier: "booth",
        url:  "https://360consultingdfw.com/",
        logo: "images/360consultingdfw.png",
        alt:  "360 Consulting DFW"
      },
    ]
  },

  // ── SPEAKERS ───────────────────────────────────────────────
  speakers: [
    {
      name:     "Shane Spillers",
      title:    "Expert EOS Implementer\u00AE",
      session:  "The Talk",
      bio:      "Opening the day with the foundation of running on EOS",
      time:     "10:00 \u2013 11:30 AM",
      tier:     "free",
      photo:    "https://implementer.eosworldwide.com/wp-content/uploads/2025/11/20170423-Spillers-Shane-Headshot-1-Large-2.png",
      initials: "SS",
      profileUrl: "https://implementer.eosworldwide.com/shane-spillers/",
    },
    {
      name:     "Mark Stanley",
      title:    "Expert EOS Implementer\u00AE",
      session:  "Data Workshop",
      bio:      "Using data to drive decisions and accountability",
      time:     "1:00 \u2013 2:30 PM",
      tier:     "paid",
      photo:    "https://implementer.eosworldwide.com/wp-content/uploads/2025/12/MarkS-4578-Edit-SM.jpg",
      initials: "MS",
      profileUrl: "https://implementer.eosworldwide.com/mark-stanley/",
    },
    {
      name:     "Beth Fahey",
      title:    "Expert EOS Implementer\u00AE",
      session:  "Rollout Workshop",
      bio:      "Getting EOS running deeper in your organization",
      time:     "4:30 \u2013 5:30 PM",
      tier:     "paid",
      photo:    "https://implementer.eosworldwide.com/wp-content/smush-webp/2025/08/Fahey-Headshot-2023-WEB-2.jpeg.webp",
      initials: "BF",
      profileUrl: "https://implementer.eosworldwide.com/beth-fahey/",
    },
    {
      name:     "Mark C. Winters",
      title:    "Expert EOS Implementer\u00AE",
      session:  "Visionary Keynote",
      bio:      "The Visionary/Integrator dynamic that powers great companies",
      time:     "5:45 \u2013 7:15 PM",
      tier:     "paid",
      photo:    "https://implementer.eosworldwide.com/wp-content/smush-webp/2025/08/MCW-Headshot-Small-1-1-1024x767.jpeg.webp",
      initials: "MW",
      profileUrl: "https://implementer.eosworldwide.com/mark-c-winters/",
    },
  ],

  // ── AGENDA ─────────────────────────────────────────────────
  agenda: 
    [
      {
        time: "7:30 \u2013 8:10 AM",
        session: "Coffee, Snacks & Registration",
        location: "Foyer & Junior Ballroom",
        speaker: "",
        tier: "free",
        highlight: false
      },
      {
        time: "8:10 \u2013 9:45 AM",
        session: "Opening / The Talk",
        location: "Grand Ballroom",
        speaker: "Shane Spillers \u00B7 Expert EOS Implementer\u00AE",
        tier: "free",
        highlight: true
      },
       {
        time: "9:45 \u2013 10:05 AM",
        session: "Break",
        location: "Foyer & Junior Ballroom",
        speaker: "",
        tier: "free",
        highlight: false
      },
      
      { 
        time: "10:05 \u2013 10:55 AM", 
        session: "Strety - Title Sponsor Workshop",
        location: "Grand Ballroom", 
        speaker: "Strety \u00B7 Title Sponsor", 
        tier: "free", 
        highlight: true
      },
      { 
        time: "10:55 \u2013 11:15 AM", 
        session: "Break", 
        location: "Foyer & Junior Ballroom",
        speaker: "", 
        tier: "free", 
        highlight: false
      },
      { 
        time: "11:15 AM \u2013 12:15 PM", 
        session: "Sales Collective - Title Sponsor Workshop", 
        location: "Grand Ballroom",
        speaker: "Sales Collective \u00B7 Title Sponsor", 
        tier: "free", 
        highlight: true 
      },
       { 
        time: "12:15 PM \u2013 1:15 PM", 
        session: "Lunch +  Walt Brown 30 Minute Update", 
        location: "Grand Ballroom",
        speaker: "Walt Brown", 
        tier: "paid", 
        highlight: true 
      },
      { 
        time: "1:15 \u2013 2:45 PM", 
        session: "Rollout Workshop", 
        location: "Grand Ballroom",
        speaker: "Beth Fahey \u00B7 Expert EOS Implementer\u00AE", 
        tier: "paid", 
        highlight: true 
      },
       { 
        time: "2:45 \u2013 3:05 PM", 
        session: "Break", 
        location: "Foyer & Junior Ballroom",
        speaker: "", 
        tier: "paid", 
        highlight: false
      },
      { 
        time: "3:05 \u2013 4:35 PM", 
        session: "Data Workshop", 
        location: "Grand Ballroom",
        speaker: "Mark Stanley \u00B7 Expert EOS Implementer\u00AE", 
        tier: "paid", 
        highlight: true 
      },
      { 
        time: "4:35 \u2013 4:55 PM", 
        session: "Break", 
        location: "Foyer & Junior Ballroom",
        speaker: "", 
        tier: "paid", 
        highlight: false
      },
      { 
        time: "4:55 \u2013 6:30 PM", 
        session: "Visionary Keynote", location: "Grand Ballroom",
        speaker: "Mark C. Winters \u00B7 Expert EOS Implementer\u00AE", 
        tier: "paid", 
        highlight: true 
      },
      { 
        time: "6:30 \u2013 8:00 PM", 
        session: "Happy Hour + Networking", 
        location: "Junior Ballroom",
        speaker: "Celebrate wins. Connect. Go home fired up.", 
        tier: "paid", 
        highlight: false 
      },
    ],

  // ── MEDIA ──────────────────────────────────────────────────
  media: {
    promoVideoUrl: "https://www.youtube.com/embed/lfiH_kmKHws",
    promoVideoPortrait: true,  // true = 9:16 phone-frame; false = 16:9 landscape
  },

  // ── CONTACT ────────────────────────────────────────────────
  contact: {
    general:    "kevin.taylor@eosworldwide.com",
    marketing:  "ray.myers@eosworldwide.com",
    eosUrl:     "https://eosworldwide.com",
  },

};
