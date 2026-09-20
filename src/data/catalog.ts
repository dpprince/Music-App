import catalogData from './catalog.json';

export type Artist = {
  id: string;
  name: string;
  genre: string;
  city: string;
  bio: string;
  albums: string[];
};

export type Track = {
  id: string;
  name: string;
  duration: number;
};

export type Album = {
  id: string;
  artistId: string;
  name: string;
  year: number;
  kind: 'album' | 'single' | 'ep';
  genre: string;
  accent: [string, string, string];
  duration: number;
  tracks: Track[];
};

export type Playlist = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  kind: string;
  accent: [string, string, string];
  trackIds: string[];
};

export const brands = catalogData.brand;
export const artists: Artist[] = catalogData.artists as Artist[];
export const albums: Album[] = catalogData.albums as Album[];
export const playlists: Playlist[] = catalogData.playlists as Playlist[];

export const artistById = new Map(artists.map(a => [a.id, a]));
export const albumById = new Map(albums.map(a => [a.id, a]));
export const playlistById = new Map(playlists.map(p => [p.id, p]));

export type TrackInfo = { track: Track; album: Album; artist: Artist; offset: number };

const trackIndex = new Map<string, TrackInfo>();
for (const album of albums) {
  let offset = 0;
  for (const track of album.tracks) {
    trackIndex.set(track.id, { track, album, artist: artistById.get(album.artistId)!, offset });
    offset += track.duration;
  }
}

export function trackInfo(id: string): TrackInfo {
  return trackIndex.get(id)!;
}

export function allTracks(): TrackInfo[] {
  return albums.flatMap(a => a.tracks.map(t => trackInfo(t.id)));
}

export function albumTracks(albumId: string): TrackInfo[] {
  return albums.find(a => a.id === albumId)!.tracks.map(t => trackInfo(t.id));
}

export function playlistTracks(playlistId: string): TrackInfo[] {
  return playlistById.get(playlistId)!.trackIds.map(id => trackInfo(id));
}

export function artistAlbums(artistId: string): Album[] {
  return artistById.get(artistId)!.albums.map(id => albumById.get(id)!);
}

export function albumArtists(albumId: string): Artist {
  return artistById.get(albumById.get(albumId)!.artistId)!;
}

// The full chronological queue following a track inside its album context.
export function albumQueue(startId: string): TrackInfo[] {
  const ctx = trackInfo(startId);
  return albumTracks(ctx.album.id).slice(ctx.album.tracks.findIndex(t => t.id === startId));
}

export function allAlbumsFlat(): Album[] {
  return albums;
}