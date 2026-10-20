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
- `public/offline`: downloaded videos, audio, desktop/mobile animation frames, images, logos, and fonts (about 640 MB). Served from Cloudflare R2 and not committed, except `public/offline/fonts`.
- `public/images`: original saved assets retained for legacy paths. Served from Cloudflare R2; not committed.
- `public/icons`, `public/media`: small original assets, committed.
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

## Case study portfolio

The case study collection and its nine project pages are authored locally, using the approved content from `content.pdf`:

- `public/case-studies/catalog.js` is the shared source for project copy, artwork, categories and homepage links.
- `lib/case-studies.ts` renders the collection, filters, individual pages and missing-project response.
- `lib/case-studies-ar.ts` provides the Arabic project copy.
- `public/case-studies/styles.css` and `interactions.js` provide responsive styling and progressive enhancement.
- `/en/case-studies` and `/ar/case-studies` list all nine projects. The retired agency project URLs redirect to their locale's collection.

The old case study snapshots have been removed from the active route inventory. `prepare-offline.py` excludes them from future snapshot refreshes. The original files in `reference/pages` remain historical captures and are not served.

Run `npm run check:case-studies` against the local development server to verify every project, supplied content section, image and retired URL.

## Services experience

`/en/digital-services` and `/ar/digital-services` serve the TUKLOGIC services experience from the `divya2` project: the WebGL scenes, monogram, service content and videos.

- `public/service-experience`: the copied `reference` renderer and scene assets, `content` data and videos, `og.jpg` and `unsupported.html`. Its scripts, worker, shaders and fonts are committed; its media (images, video, audio, geometry and JSON data) is served from Cloudflare R2.
- `lib/service-experience-document.ts`: the page document. Its `<base href="/service-experience/">` resolves the experience's relative asset paths.
- `lib/services-page.ts`: resolves the page, its client-routed sections (`about`, `work`, `work/<project>`, …) and redirects retired per-service URLs to the services page.
- `public/services-link.js`: added to every captured page; Services links and router navigation load the services document instead of the captured site's client-side services route.

The copied `reference/js/app.1780406240914.js` has two changes from `divya2`: CMS data loads from the relative `content/` path, and the client router's root comes from `window.SERVICE_ROUTER_ROOT`. Reapply both when copying a newer `divya2` build.

## Updating the capture

```sh
python3 scripts/capture-reference.py
python3 scripts/capture-pages.py
npm run prepare:replica
npm run build
```

A refresh reads the live public site and may change content. To deliberately download/update the saved content and media, run `npm run assets:download` once with internet access. Normal development and page/media delivery do not download from the original site. Existing routes can be edited by changing the captured HTML or frontend modules and running `npm run prepare:replica`, which reapplies the local paths. The project retains the Sites/Vinext/Cloudflare structure.

## Deploying to Vercel

The site deploys to Vercel as a standard Next.js app. `vercel.json` sets the build command to `next build`; `npm run build` still uses Vinext for the Cloudflare/Sites setup.

1. Push this repository to GitHub, GitLab or Bitbucket.
2. In Vercel, import the repository. The framework preset, build command and Node version (from `engines`) are picked up automatically.
3. No environment variables are required. `HF_CREDENTIALS` is only used by local video generation scripts.

### Media on Cloudflare R2

The large media (about 1 GB) is stored in the public R2 bucket `tuklogic-media`, not in Git or the deployment. `next.config.ts` redirects `/offline/*` (except the fonts, which stay in the deployment), `/images/*` and the media files under `/service-experience/*` to the bucket, keeping the same paths, so the captured pages and frontend modules need no changes. Page responses allow the bucket's origin in their content security policy.

- The bucket's address is set in `lib/media-origin.ts`. To move to a custom domain, set `R2_MEDIA_ORIGIN` (for example `https://media.example.com`) in Vercel and redeploy.
- The bucket's CORS policy must allow `GET` and `HEAD` from any origin: canvas frames, WebGL textures and Web Audio need it.
- The `r2.dev` address is rate-limited and not cached at Cloudflare's edge. For production traffic, connect a custom domain to the bucket and set `R2_MEDIA_ORIGIN`.
- R2's `images/` folder also contains the files that only exist in `offline/images`, matching the old `/images` to `/offline/images` fallback.

To add or change media, update the local file and upload it with rclone (configured with a remote named `r2`), keeping the same path:

```sh
rclone copy public/offline r2:tuklogic-media/offline --progress --header-upload "Cache-Control: public, max-age=604800"
```

Browsers may keep an old copy for up to a week; give a changed file a new name to update it immediately.

`/output`, root-level `.mp4` drafts and other local working files are ignored by Git and are not part of the deployment.
# tuklogic
