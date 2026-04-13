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
    timeRange:  "9:00 AM \u2013 9:00 PM",
    venue:      "The Statler Dallas",
    address:    "1914 Commerce St, Dallas, TX 75201",
    mapsLink:   "https://maps.google.com/?q=1914+Commerce+St+Dallas+TX+75201",
    parking:    "Complimentary parking available on-site",
  },

  // ── TICKETS ────────────────────────────────────────────────
  tickets: {
    earlyBirdPrice:     95,
    standardPrice:      145,
    earlyBirdEndDate:   "TBD",          // PLACEHOLDER: update when confirmed
    cap:                null,           // PLACEHOLDER: hard ticket cap (null = hide counter)
    sold:               0,              // PLACEHOLDER: update to show tickets remaining
    earlyBirdUrl:       "#",            // PLACEHOLDER: Eventbrite URL from Kevin
    freeUrl:            "#",            // PLACEHOLDER: Eventbrite URL from Kevin (free tier)
  },

  // ── SPONSORS ───────────────────────────────────────────────
  sponsors: {
    contact:    "kevin.taylor@eosworldwide.com",
    tiers: [
      { name: "Title Sponsor",      price: 10000, available: 2 },
      { name: "Book Sponsor",       price: 9000,  available: 1 },
      { name: "Happy Hour Sponsor", price: 6500,  available: 1 },
      { name: "Swag Bag Sponsor",   price: 3500,  available: 2 },
      { name: "Booth Sponsor",      price: 1500,  available: 5 },
      { name: "Connector Sponsor",  price: 750,   available: 10 },
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
    },
    {
      name:     "Mark C. Winters",
      title:    "Co-author, Rocket Fuel",
      session:  "Visionary Keynote",
      bio:      "The Visionary/Integrator dynamic that powers great companies",
      time:     "5:45 \u2013 7:15 PM",
      tier:     "paid",
      photo:    "https://implementer.eosworldwide.com/wp-content/smush-webp/2025/08/MCW-Headshot-Small-1-1-1024x767.jpeg.webp",
      initials: "MCW",
    },
  ],

  // ── AGENDA ─────────────────────────────────────────────────
  agenda: [
    { time: "9:00 \u2013 10:00 AM",    session: "Coffee & Registration",          speaker: "The Statler Dallas \u00B7 Lobby",                                   tier: "free",   highlight: false },
    { time: "10:00 \u2013 11:30 AM",   session: "The Talk",                       speaker: "Shane Spillers \u00B7 Expert EOS Implementer\u00AE",                 tier: "free",   highlight: true  },
    { time: "11:45 AM \u2013 12:45 PM",session: "Lunch + Title Sponsor Workshop", speaker: "Included with free registration",                                    tier: "free",   highlight: false },
    { time: "1:00 \u2013 2:30 PM",     session: "Data Workshop",                  speaker: "Mark Stanley \u00B7 EOS Implementer\u00AE",                          tier: "paid",   highlight: true  },
    { time: "2:45 \u2013 4:15 PM",     session: "Title Sponsor Workshop",         speaker: "Sponsor TBD",                                                        tier: "paid",   highlight: false, isSponsor: true },
    { time: "4:30 \u2013 5:30 PM",     session: "Rollout Workshop",               speaker: "Beth Fahey \u00B7 EOS Implementer\u00AE",                            tier: "paid",   highlight: true  },
    { time: "5:45 \u2013 7:15 PM",     session: "Visionary Keynote",              speaker: "Mark C. Winters \u00B7 Co-author, Rocket Fuel",                      tier: "paid",   highlight: true  },
    { time: "7:30 \u2013 9:00 PM",     session: "EOS Awards + Happy Hour + Networking", speaker: "Celebrate wins. Connect. Go home fired up.",                  tier: "paid",   highlight: false },
  ],

  // ── MEDIA ──────────────────────────────────────────────────
  media: {
    promoVideoUrl: "https://www.youtube.com/embed/WtagBi514bA",
  },

  // ── CONTACT ────────────────────────────────────────────────
  contact: {
    general:    "kevin.taylor@eosworldwide.com",
    marketing:  "ray.myers@eosworldwide.com",
    eosUrl:     "https://www.eosworldwide.com",
  },

};
