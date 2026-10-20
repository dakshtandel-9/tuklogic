/** Public R2 bucket serving the large media that is not part of the deployment. */
const DEFAULT_MEDIA_ORIGIN = 'https://pub-124464f162174e66af5ef9253e61de72.r2.dev';

/** Origin of the R2 media. Set R2_MEDIA_ORIGIN to switch hosts, e.g. to a custom domain. */
export function getMediaOrigin(): string {
  const value = process.env.R2_MEDIA_ORIGIN?.trim() || DEFAULT_MEDIA_ORIGIN;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('R2_MEDIA_ORIGIN must be an HTTPS origin without a path or credentials.');
  }
  return url.origin;
}
