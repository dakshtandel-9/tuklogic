// Keep the captured scene IDs stable while hiding the two unused chapters.
// The original artwork and media remain available for restoring them later.
export const sceneIds = [0, 1, 2, 3, 4, 7, 8, 9];
export const mobileScenes = ['intro', 'egypt', 'china', 'greek', 'islamic', 'steve', 'uxbert'];
export const sceneKeys = ['earlyHumans', 'ancientEgypt', 'ancientChina', 'ancientGreece', 'islamicGoldenAge', null, null, 'steveJobs', 'uxbertLabs'];

export function nextSceneId(current, direction) {
  const index = sceneIds.indexOf(current);
  return sceneIds[Math.max(0, Math.min(sceneIds.length - 1, index + Math.sign(direction)))];
}

export function sceneProgress(current) {
  return Math.max(0, sceneIds.indexOf(current)) / (sceneIds.length - 1);
}

export function sceneDuration(current, translate) {
  const key = sceneKeys[current];
  const words = key ? translate(`scenes.${key}.text`).trim().split(/\s+/).length : 0;
  return Math.max(30000, words * 550 + 7000);
}
