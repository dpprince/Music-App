// Static requires so Metro bundles every generated asset.

export const artwork: Record<string, any> = {
  'tidal-motions': require('@/assets/generated/art/tidal-motions.png'),
  'glass-hour': require('@/assets/generated/art/glass-hour.png'),
  'vestige': require('@/assets/generated/art/vestige.png'),
  'pale-blue-night': require('@/assets/generated/art/pale-blue-night.png'),
  'sunday-paper': require('@/assets/generated/art/sunday-paper.png'),
  'slow-canyons': require('@/assets/generated/art/slow-canyons.png'),
  'ferry-light': require('@/assets/generated/art/ferry-light.png'),
  'borderlands': require('@/assets/generated/art/borderlands.png'),
  'kite-season': require('@/assets/generated/art/kite-season.png'),
  'pale-fire': require('@/assets/generated/art/pale-fire.png'),
  'kaleidoscope': require('@/assets/generated/art/kaleidoscope.png'),
  'circuitry': require('@/assets/generated/art/circuitry.png'),
};

export const artistArt: Record<string, any> = {
  'lumen-fields': require('@/assets/generated/art/artist-lumen-fields.png'),
  'mireille': require('@/assets/generated/art/artist-mireille.png'),
  'cosmonaut-echo': require('@/assets/generated/art/artist-cosmonaut-echo.png'),
  'halftone': require('@/assets/generated/art/artist-halftone.png'),
  'odessa-bloom': require('@/assets/generated/art/artist-odessa-bloom.png'),
  'paper-foxes': require('@/assets/generated/art/artist-paper-foxes.png'),
  'shogun-mono': require('@/assets/generated/art/artist-shogun-mono.png'),
  'violet-meridian': require('@/assets/generated/art/artist-violet-meridian.png'),
  'backyard-circuit': require('@/assets/generated/art/artist-backyard-circuit.png'),
};

export const audio: Record<string, any> = {
  'tidal-motions': require('@/assets/generated/audio/tidal-motions.mp3'),
  'glass-hour': require('@/assets/generated/audio/glass-hour.mp3'),
  'vestige': require('@/assets/generated/audio/vestige.mp3'),
  'pale-blue-night': require('@/assets/generated/audio/pale-blue-night.mp3'),
  'sunday-paper': require('@/assets/generated/audio/sunday-paper.mp3'),
  'slow-canyons': require('@/assets/generated/audio/slow-canyons.mp3'),
  'ferry-light': require('@/assets/generated/audio/ferry-light.mp3'),
  'borderlands': require('@/assets/generated/audio/borderlands.mp3'),
  'kite-season': require('@/assets/generated/audio/kite-season.mp3'),
  'pale-fire': require('@/assets/generated/audio/pale-fire.mp3'),
  'kaleidoscope': require('@/assets/generated/audio/kaleidoscope.mp3'),
  'circuitry': require('@/assets/generated/audio/circuitry.mp3'),
};

export const brand = {
  icon: require('@/assets/generated/brand/icon.png'),
  splash: require('@/assets/generated/brand/splash-icon.png'),
};

export function albumArt(id: string) {
  return artwork[id];
}
export function artistArtwork(id: string) {
  return artistArt[id];
}
export function albumAudio(id: string) {
  return audio[id];
}