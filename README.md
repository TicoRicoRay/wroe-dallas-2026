# EOS North Texas — Event Site

Live: **https://eosnorthtexas.com**
Annual event microsite for *We Run on EOS® Dallas* (formerly WROE Dallas). The repo name still says `wroe-dallas-2026`; the public brand is "EOS North Texas."

---

## TL;DR for the next maintainer

- **Static site.** Three files do 95% of the work: `index.html`, `config.js`, `CNAME`.
- **No build step, no framework.** Open `index.html` in a browser locally — that's the dev environment.
- **Edit `config.js` first.** It is the single source of truth for event details, tickets, sponsors, speakers, agenda, and bonuses. `index.html` reads from `SITE_CONFIG` at load time and populates the page.
- **Push to `main` = live in ~60 seconds.** GitHub Pages builds and deploys automatically. No PR review process is wired up.

---

## File structure

```
wroe-dallas-2026/
├── CNAME                # Custom domain for GitHub Pages: "eosnorthtexas.com"
├── config.js            # SITE_CONFIG object — edit this for content changes
├── index.html           # All markup, CSS, and rendering JS in one file
└── images/              # All image assets
    └── books/           # Book cover images for the full-day bonus section
```

That's it. No `node_modules`, no `package.json`, no bundler.

---

## How content updates work

### Common edits (no HTML knowledge required)

Open `config.js` — the file is divided into clearly-labeled sections with comment dividers:

| Section | What's in it |
|---|---|
| `event` | Date, venue, address, master CTA URL |
| `tickets` | Early bird price + cap, standard price, RegFox URLs, `earlyBirdSold` counter |
| `fullDayBonuses` | Books (title/author/cover image), lunch value, happy hour value |
| `sponsors` | Tier definitions + the list of each sponsor (name, logo path, URL) |
| `speakers` | Name, title, headshot, EOS implementer profile URL |
| `agenda` | Time-blocked sessions, speaker tags, free-vs-paid markers |
| `media` | Promo video URL + portrait/landscape toggle |
| `contact` | Sponsor inquiries email |

**Ticket counter**: `earlyBirdSold` is a manual integer — bump it as RegFox sales come in. Once `earlyBirdSold >= earlyBirdCap`, all copy flips to standard pricing automatically.

### Adding a sponsor

1. Drop the logo in `images/` (PNG or SVG preferred, transparent background)
2. Add a `{ name, url, logo }` entry in the correct tier's array in `config.js`
3. Commit and push to `main`

### Adding/editing a speaker

1. Drop headshot in `images/`
2. Add entry to `speakers` array in `config.js` — include `profileUrl` pointing to their `https://implementer.eosworldwide.com/{slug}/` page if applicable
3. Speaker cards will render as clickable links automatically

### Structural changes (layout, sections, styling)

`index.html` is monolithic — markup, `<style>` block, and rendering `<script>` are all in one file (~870 lines). Search by section ID (`#hero`, `#about`, `#agenda`, `#speakers`, `#sponsors`, `#venue`, `#register`, `#compare`). All rendering JS lives at the bottom of the file inside one `<script>` block that reads `window.SITE_CONFIG`.

---

## Source control

- **Origin**: https://github.com/TicoRicoRay/wroe-dallas-2026 (public)
- **Branch**: single `main` branch, direct commits, no PR workflow
- **Owner**: `TicoRicoRay` (Ray Myers, `rmyers@futurebright.com`)

To hand off the repo: add the new maintainer as a collaborator under repo Settings → Collaborators, or transfer ownership entirely under Settings → Danger Zone → Transfer.

---

## Hosting

**GitHub Pages**, served directly from `main` branch / root path. No `.github/workflows/` — Pages' built-in static deploy is sufficient.

- Settings: https://github.com/TicoRicoRay/wroe-dallas-2026/settings/pages
- Default URL: `https://ticoricoray.github.io/wroe-dallas-2026/` (redirects to custom domain)
- Custom domain: `eosnorthtexas.com` (set via the `CNAME` file in repo root)
- HTTPS: **Enforced**. Let's Encrypt cert auto-issued by GitHub for both `eosnorthtexas.com` and `www.eosnorthtexas.com`. Auto-renews every 90 days. No action needed.

**Deploys are automatic.** Push to `main` → Pages rebuilds in 30–90s.

To take the site offline: Settings → Pages → unpublish, or delete the `CNAME` file.

---

## DNS / CDN

**Cloudflare** holds the DNS zone for `eosnorthtexas.com`. The domain registration stays at **GoDaddy** (account separate from Cloudflare).

### Cloudflare zone records

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | @ | 185.199.108.153 | DNS only ⚪ |
| A | @ | 185.199.109.153 | DNS only ⚪ |
| A | @ | 185.199.110.153 | DNS only ⚪ |
| A | @ | 185.199.111.153 | DNS only ⚪ |
| CNAME | www | ticoricoray.github.io | DNS only ⚪ |

The four A records are [GitHub Pages' apex IPs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain). Don't change them unless GitHub publishes new ones.

**Why DNS-only (grey cloud)**: GitHub's edge handles caching well enough for an event site, and proxying through Cloudflare can complicate cert renewals. If high traffic ever becomes a concern, flip to proxied (orange) — but first set Cloudflare SSL/TLS mode to **Full (strict)** to avoid a redirect loop.

### GoDaddy

The only thing GoDaddy controls is the registrar record and the nameserver pointers. Nameservers are set to Cloudflare's two assigned values (visible in Cloudflare dashboard → Overview).

---

## Credentials to hand off

| System | What's needed | Where it lives now |
|---|---|---|
| **GitHub** | Repo write access for `TicoRicoRay/wroe-dallas-2026` | Add new maintainer as collaborator |
| **GoDaddy** | Login to manage domain renewal & nameservers | Ray Myers personal account — transfer the domain or share login |
| **Cloudflare** | Login to manage DNS zone | Ray Myers personal account — invite new maintainer to account as Member, or move zone to a new account |
| **RegFox** | Ticket sales platform (`wroedallas.regfox.com`) | Managed separately by EOS Worldwide / event team |
| **Domain renewal** | `eosnorthtexas.com` renews at GoDaddy — confirm auto-renew is on | GoDaddy billing |

No API keys or secrets live in the repo. The site is fully static — no backend, no database, no env vars.

---

## Local development

```bash
git clone https://github.com/TicoRicoRay/wroe-dallas-2026.git
cd wroe-dallas-2026

# Either open index.html directly in a browser, or run any static server:
python3 -m http.server 8765
# → http://localhost:8765
```

Edit, refresh, repeat. No watchers, no compile.

---

## Annual roll-over (e.g., for 2027)

1. **Don't rename the repo** unless you want to break direct deep-links. Update content in place.
2. Bump `config.js` → `event.date`, `event.dateISO`, `event.edition` ("Sixth Annual"), venue if changing.
3. Update `tickets.earlyBirdPrice`, `tickets.standardPrice`, reset `earlyBirdSold: 0`.
4. Swap RegFox URLs in `tickets.earlyBirdUrl` / `tickets.freeUrl` / `event.ctaUrl` once the new RegFox event is created.
5. Update `speakers`, `agenda`, `sponsors` arrays.
6. Refresh `media.promoVideoUrl` once new promo footage is cut.
7. Commit, push — live in a minute.

The domain, hosting, cert, and CDN all continue with zero changes year-to-year.

---

## Known quirks

- Some sponsor logo files exist in `images/` but aren't currently referenced in `config.js` (e.g., legacy `thesalescollective.png`). Safe to ignore or delete. The brand was renamed to "System of Selling" — the active logo is `systemofselling.svg`.
- `mealsValue` and `happyHourValue` in `fullDayBonuses` are leftover from a value-stack calculator that was removed from the page. They're harmless but currently unused.
- `.xcf` files in `images/` are GIMP source files — keep them if you want to edit those logos, otherwise removable.
- Book covers in `images/books/` are processed product images sourced from publisher/retailer pages, not licensed assets. If anyone gets twitchy about it, replace with publisher-provided art.
