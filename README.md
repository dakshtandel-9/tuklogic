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

The copied `reference/js/app.1780406240914.js` loads CMS data from the relative `content/` path, and the client router's root comes from `window.SERVICE_ROUTER_ROOT`. Reapply both when copying a newer `divya2` build, together with the header audio hooks below.

The services page also has the common logo, language switch, audio button and menu. `public/service-header.css` keeps the header isolated from the renderer, and `public/service-header.js` connects its audio button to `AppState`'s `Global/audioEnabled` state. The renderer exposes `GlobalAudio3D.activateFromHeader()` so both keyboard and touch activation can unlock Web Audio; its `noMusic` check honors `window.SERVICE_SITE_HEADER` so music remains available on phones. Preserve these two small hooks when updating the renderer. The native song selector sits below the header; language switching retains the current services section.

## Updating the capture

```sh
python3 scripts/capture-reference.py
python3 scripts/capture-pages.py
npm run prepare:replica
npm run build
```

A refresh reads the live public site and may change content. To deliberately download/update the saved content and media, run `npm run assets:download` once with internet access. Normal development and page/media delivery do not download from the original site. Existing routes can be edited by changing the captured HTML or frontend modules and running `npm run prepare:replica`, which reapplies the local paths. The project retains the Sites/Vinext/Cloudflare structure.

## Deploying

The site runs on Vercel; its large media (about 1 GB) lives on Cloudflare R2.

- **Code**: GitHub `dakshtandel-9/tuklogic`. The Vercel project `tuklogic`, on the `zocktech06-7535` Vercel account, builds every push to `main` and publishes it at https://tuklogic.vercel.app. Build logs, domains and cache settings are on that account. `vercel.json` sets the build command to `next build` (`npm run build` uses Vinext for the Cloudflare/Sites setup). No environment variables are required; `HF_CREDENTIALS` is only used by local video generation scripts.
- **Media**: the public R2 bucket `tuklogic-media`, not Git or the deployment. `next.config.ts` proxies `/offline/*` (except the fonts, which are deployed with the site), `/images/*` and the media files under `/service-experience/*` to the bucket. Requests stay on the site's origin, avoiding a redirect for every animation frame and cross-origin canvas, WebGL and Web Audio failures. The bucket's address is in `lib/media-origin.ts`.
- **Uploading**: rclone with a remote named `r2` (an R2 API token with read and write access to the bucket; `rclone config` → Amazon S3 → Cloudflare). The keys stay in rclone's config on your machine; never commit them or paste them anywhere.

### Releasing a change

1. **Code**: commit and push to `main`. Vercel deploys within a minute or two; the commit on GitHub shows a green check when it is live.
2. **Media**: change the file under `public/offline`, `public/images` or `public/service-experience`, then run `npm run media:upload`. It sends only changed files and ends with `rclone check` reporting `0 differences found`. Then redeploy in Vercel (Deployments → latest → Redeploy), because Vercel's edge keeps the copies it already fetched from R2.
3. **Check**: `MEDIA_TEST_ORIGIN=https://tuklogic.vercel.app node scripts/check-deployment-media.mjs` checks every era's frames, the videos, fonts and service media through the live site, including video byte ranges.
4. **Warm**: `node scripts/warm-cache.mjs` requests every frame and image through the live site, so Vercel's edge holds them before visitors arrive (about two minutes). The edge cache is per region, so this warms the region nearest to you; run it again after each deploy or media upload.

### Caching

- Media is cached in browsers for a week (`max-age=604800`). Someone who visited in the last week keeps seeing the old copy of a file changed under the same name; new visitors get the new one. To see your own change, use a private window or Chrome DevTools → Network → Disable cache, then reload. To update returning visitors immediately, give the file a new name or a new version tag: frames use `FRAMES_VERSION` in `public/assets/frame-loader.js`, and the intro film, intro narration and `apple.mp4` carry `?v=` in `IntroScene-*.js`, `ui-components-*.js` and `ScenesDesktop-*.js`. Change the value whenever you replace those files.
- Audio and video are uploaded as `Cache-Control: private`, everything else as `public`. Vercel's edge caches `public` media, but it stores the first byte range it receives for a video or audio file and replays it to every later range request, which breaks seeking and Safari playback. `private` keeps audio and video out of the edge while browsers still cache them. `npm run media:upload` sets both; don't upload audio or video with a plain `rclone copy`.
- The bucket's CORS policy must allow `GET` and `HEAD` from any origin: canvas frames, WebGL textures and Web Audio need it.
- R2's `images/` folder also contains the files that only exist in `offline/images`, matching the old `/images` to `/offline/images` fallback.

### Before heavy traffic

The `r2.dev` address is rate-limited and meant for development. Connect a custom domain to the bucket (Cloudflare → R2 → `tuklogic-media` → Settings → Custom Domains → Connect Domain, for example `media.tuklogic.com`; the domain must use Cloudflare DNS), set `R2_MEDIA_ORIGIN=https://media.tuklogic.com` in the Vercel project's environment variables and redeploy. The site's own domain is added in Vercel → Settings → Domains.

## Local checks

SEO metadata is applied by `lib/seo.ts` to every HTML response, including the
captured pages and services experience. `public/site-seo.js` supplies the English
and Arabic titles/descriptions and the captured frontend's navigation metadata.
These settings do not change the visible page copy. The existing brand images
in `public/social` are served locally for share previews.

Canonical URLs, language alternatives, JSON-LD, `/robots.txt` and `/sitemap.xml`
use `https://tuklogic.vercel.app`. Set `SITE_URL` to the preferred public origin
when attaching a custom domain, then rebuild. The sitemap includes the 38 current
English/Arabic pages, excluding retired URLs and services navigation aliases.
After starting Next.js on port 3100, run `npm run check:seo` to check metadata,
previews, crawler responses and unchanged main content. Set `SEO_TEST_ORIGIN` to
test another server and `SITE_URL` when checking a custom canonical origin.

Build and run Next.js to test the same media rewrites used on Vercel:

```sh
npx next build
npx next start --port 3100
# In another terminal:
node scripts/check-deployment-media.mjs
node --test scripts/check-frame-loader.mjs scripts/check-loading-progress.mjs scripts/check-site-menu.mjs
```

The character player uses `public/assets/frame-loader.js`: one shared queue of twelve downloads, three attempts per frame, fresh retry URLs, cancellation on unmount, and readiness only after every required sequence loads. The loader screen waits only for the intro film; the first scene's frames load while the intro plays, and the eras are cached in story order until the intro ends (`STORY_FRAMES` in `IntroScene-*.js` must match the frame counts in `ScenesDesktop-*.js`). Small screens and slow or data-saving connections get the lighter `sm` frames. Frames are stored in playback order starting at index zero; they are decoded on demand to avoid retaining entire HD sequences as bitmaps.

The phone homepage uses separate portrait clips in `public/offline/mobile-videos`, referenced by `public/assets/ScenesMobile-COIEeUsU.js`. Run `python3 scripts/prepare-mobile-characters.py` to derive its five updated character loops from the installed desktop hold frames. It preserves faces, hands and paired characters with scene-specific crops, and excludes entry glitches and screen reveals. New clips use versioned filenames; update `VERSION` in the script and the five mobile references together for future replacements, then upload the clips to R2. This does not alter desktop frames or the original mobile clips. The deployment media check covers the mobile video URLs too.

`/output` (backups of replaced media and small editing scripts), root-level `.mp4` drafts and other local working files are ignored by Git and are not part of the deployment.
