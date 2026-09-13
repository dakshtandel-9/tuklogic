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
- `public/assets`: locally hosted original frontend modules and styles.
- `public/locales`: English and Arabic translations.
- `public/images`, `public/icons`, `public/media`: downloaded original assets.
- `reference/api/services.json`: local service data.
- `app/[locale]/[[...slug]]/route.ts`: document delivery.
- `app/%5FserverFn/[id]/route.ts`: local service data and allowlisted public-content requests.

The original frontend is distributed as compiled modules to retain its animations and styling exactly. It is not reconstructed authoring source. The route handlers, capture scripts, data, and frontend assets are editable in this project.

## External dependencies and forms

The cinematic frame sequences, audio, and some media continue to load from the original public CDN. Google Fonts, live public articles and careers data, uncaptured public article URLs, and the embedded map also require internet access. Google Maps and reCAPTCHA may require keys registered to a deployed domain.

Contact and course form submissions are intentionally not connected to the original company's inbox. POST endpoints return an explicit 501 response until a delivery service is configured. Analytics and external agent integrations are disabled. No upstream cookies or visitor authentication headers are forwarded by the public-content gateway.

## Updating the capture

```sh
python3 scripts/capture-reference.py
python3 scripts/capture-pages.py
npm run prepare:replica
npm run build
```

A refresh reads the live public site and may change content. Existing routes can be edited by changing the captured HTML or original frontend module and preparing the replica again. The project retains the Sites/Vinext/Cloudflare deployment structure.
