/**
 * Domain types for PeakPlay (artists, tracks, hero podium).
 */

/** Artist as returned by the API (name + link). */
export interface Artist {
    name: string;
    url: string;
}

/** Image descriptor with dimensions (e.g. from Spotify/API). */
export interface TrackImage {
    url: string;
    width: number;
    height: number;
}

/** Full track from the top-songs API. */
export interface Track {
    position: number;
    positionChange: string;
    artists: Artist[];
    title: string;
    url: string;
    images: TrackImage[];
    days: number;
    peakPosition: number;
    dailyStreams: number;
    totalStreams: number;
}

/** Simplified track for hero podium cards (subset + optional image URL). */
export interface HeroTrack {
    title: string;
    artists: Artist[];
    url: string;
    image?: string;
    position?: number;
    positionChange?: string;
}
