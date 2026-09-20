# UXBERT website recreation

A faithful copy of the public UXBERT frontend captured on September 13, 2026. The opening portal, cinematic history journey, English and Arabic navigation, Present page, services, case studies, courses, and other agency pages retain the original HTML, styling, and browser interactions.

## Development

Requires Node 22.13 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. The root opens the English experience at `/en`; Arabic is at `/ar`.

## Structure

- `reference/pages`: original captured HTML documents.
- `lib/pages.json`: prepared route snapshots, including hydration data.
- `lib/offline-pages`, `lib/page-loaders.ts`: independently loaded page snapshots, avoiding a full-site import on each cold start.
- `public/assets`: locally hosted original frontend modules and styles.
- `public/locales`: English and Arabic translations.
- `public/offline`: downloaded videos, audio, desktop/mobile animation frames, images, logos, and fonts (about 575 MB).
- `public/images`, `public/icons`, `public/media`: original saved assets retained for legacy paths.
- `reference/local-assets.json`: the download inventory.
- `reference/api/offline-content.json`: saved English/Arabic articles, categories, tags, and career listings.
- `reference/api/services.json`: local service data.
- `app/[locale]/[[...slug]]/route.ts`: document delivery.
- `app/%5FserverFn/[id]/route.ts`: local service data, article search and pagination, and saved career listings.

The original frontend is distributed as compiled modules to retain its animations and styling exactly. It is not reconstructed authoring source. The route handlers, capture scripts, data, and frontend assets are editable in this project.

## External dependencies and forms

The captured experience runs using local files, including cinematic frame sequences, desktop/mobile videos, English/Arabic audio, and fonts. Page responses enforce a same-origin content policy so copied scripts cannot fetch external subresources. The map uses a saved image instead of the Google Maps SDK. Article search and pagination use the saved dataset; new uncaptured URLs return a local 404 rather than contacting the original site.

Public content is a snapshot, not a live feed. Explicit links to third-party sites, template documents, and social profiles still lead outside the site when clicked. Contact/course submissions remain disconnected, and the remote CAPTCHA is disabled.

Contact and course form submissions are intentionally not connected to the original company's inbox. POST endpoints return an explicit 501 response until a delivery service is configured. Analytics and external agent integrations are disabled. No upstream cookies or visitor authentication headers are forwarded by the public-content gateway.

## Updating the capture

```sh
python3 scripts/capture-reference.py
python3 scripts/capture-pages.py
npm run prepare:replica
npm run build
```

A refresh reads the live public site and may change content. To deliberately download/update the saved content and media, run `npm run assets:download` once with internet access. Normal development and page/media delivery do not download from the original site. Existing routes can be edited by changing the captured HTML or frontend modules and running `npm run prepare:replica`, which reapplies the local paths. The project retains the Sites/Vinext/Cloudflare structure.
