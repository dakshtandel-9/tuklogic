#!/bin/sh
# Upload new or changed media to the R2 bucket, then check that R2 matches the local files.
# Needs rclone with a remote named `r2` (see README). Only changed files are sent.
#
# Audio and video are uploaded as `private`: browsers cache them, but Vercel's edge must not,
# because it replays the first byte range it cached to every later range request and breaks
# playback and seeking. Images, frames and data stay `public` so the edge serves them.
set -eu
cd "$(dirname "$0")/.."

BUCKET=r2:tuklogic-media
AV='*.{mp4,webm,mp3,wav,m4a,mov,ogg}'
PUBLIC='Cache-Control: public, max-age=604800'
PRIVATE='Cache-Control: private, max-age=604800'
SERVICE_DATA='*.{jpg,jpeg,png,json,bin,ktx2}'

# Fonts are deployed with the site, so they are never uploaded.
rclone copy public/offline "$BUCKET/offline" --filter '- fonts/**' --filter "- $AV" --filter '+ *' --header-upload "$PUBLIC" --progress
rclone copy public/offline "$BUCKET/offline" --filter '- fonts/**' --filter "+ $AV" --filter '- *' --header-upload "$PRIVATE" --progress
rclone copy public/images "$BUCKET/images" --filter "- $AV" --filter '+ *' --header-upload "$PUBLIC" --progress
rclone copy public/images "$BUCKET/images" --filter "+ $AV" --filter '- *' --header-upload "$PRIVATE" --progress
# The services experience's scripts, worker and shaders are deployed with the site; only its media lives on R2.
rclone copy public/service-experience "$BUCKET/service-experience" --filter "+ $SERVICE_DATA" --filter '- *' --header-upload "$PUBLIC" --progress
rclone copy public/service-experience "$BUCKET/service-experience" --filter "+ $AV" --filter '- *' --header-upload "$PRIVATE" --progress

rclone check public/offline "$BUCKET/offline" --one-way --size-only --filter '- fonts/**'
rclone check public/images "$BUCKET/images" --one-way --size-only
rclone check public/service-experience "$BUCKET/service-experience" --one-way --size-only --filter "+ $SERVICE_DATA" --filter "+ $AV" --filter '- *'
echo 'R2 matches the local media. Redeploy on Vercel so its edge stops serving older copies.'
