import { useState, useEffect, useMemo, useCallback } from "react";
import type { HeroTrack, Track } from "../types";
import { getImageByWidth } from "../utils/ImageTools";

const API_TOKEN = import.meta.env.VITE_PEAKPLAY_API_TOKEN;

/** API base URL - use env var in production or relative path (proxied by Vite in dev). */
const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** localStorage key for the top tracks cache. */
const TOP_TRACKS_CACHE_KEY = "peakplay_top_tracks_cache";

/** Age in hours after which we refresh from API in the background while showing cache. */
const CACHE_STALE_REFRESH_HOURS = 12;

// ---------------------------------------------------------------------------
// Cache types & utilities (centralized in this module)
// ---------------------------------------------------------------------------

/**
 * Shape of a single cache entry stored in localStorage.
 * @template T - Type of the cached data
 */
interface CacheEntry<T> {
    data: T;
    cachedAt: string;
}

/**
 * Returns whether a cache timestamp is still within the validity window.
 * Cache is valid if it was created after yesterday's 11 PM UTC.
 * @param cachedAt - ISO date string when the entry was cached
 * @returns true if cache is valid (created after yesterday's 11 PM UTC)
 */
const isCacheValid = (cachedAt: string): boolean => {
    const cacheDate = new Date(cachedAt);
    const now = new Date();

    // Get today's 11 PM UTC
    const today11PM = new Date(now);
    today11PM.setUTCHours(23, 0, 0, 0);

    // Get yesterday's 11 PM UTC
    const yesterday11PM = new Date(today11PM);
    yesterday11PM.setUTCDate(yesterday11PM.getUTCDate() - 1);

    // Cache is valid if it was created after yesterday's 11 PM UTC
    return cacheDate.getTime() > yesterday11PM.getTime();
};

/**
 * Returns whether a cache timestamp is stale (should trigger refresh).
 * Cache is stale if it's from before today's 11 PM UTC and now is after 11 PM UTC.
 * @param cachedAt - ISO date string when the entry was cached
 * @returns true if cache is stale (should be refreshed)
 */
const isCacheStale = (cachedAt: string): boolean => {
    const cacheDate = new Date(cachedAt);
    const now = new Date();

    // Get today's 11 PM UTC
    const today11PM = new Date(now);
    today11PM.setUTCHours(23, 0, 0, 0);

    // Cache is stale if it's from before today's 11 PM and now is after 11 PM
    if (cacheDate.getTime() < today11PM.getTime() && now.getTime() > today11PM.getTime()) {
        return true;
    }

    // Fallback: Also consider 12-hour stale window for background refresh
    const diffInHours = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60);
    return diffInHours > CACHE_STALE_REFRESH_HOURS;
};

/**
 * Saves data to localStorage with a timestamp. Fails silently if storage is unavailable.
 * @param key - localStorage key
 * @param data - Data to serialize and store
 */
const saveToCache = <T>(key: string, data: T): void => {
    try {
        const cacheEntry: CacheEntry<T> = {
            data,
            cachedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch {
        // Silently fail if localStorage is not available
    }
};

/**
 * Loads and parses a cache entry if present and still valid.
 * @param key - localStorage key
 * @returns The cached data and timestamp, or null if missing/expired/invalid
 */
const loadFromCache = <T>(key: string): { data: T; cachedAt: string } | null => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const cacheEntry = JSON.parse(raw) as CacheEntry<T>;

        if (!isCacheValid(cacheEntry.cachedAt)) {
            localStorage.removeItem(key);
            return null;
        }

        return {
            data: cacheEntry.data,
            cachedAt: cacheEntry.cachedAt,
        };
    } catch {
        return null;
    }
};

// ---------------------------------------------------------------------------
// Data fetching (no cache)
// ---------------------------------------------------------------------------

/**
 * Fetches the top tracks from the API. Does not read or write cache.
 * @returns Parsed array of tracks
 * @throws Error if token is missing, auth fails, or request fails
 */
const fetchTopTracksFromApi = async (): Promise<Track[]> => {
    if (!API_TOKEN) throw new Error("API token is not configured");

    const response = await fetch(`${API_BASE}/api/top-songs`, {
        headers: {
            Authorization: `Bearer ${API_TOKEN}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error("Authentication failed. Check your API token.");
        }
        throw new Error(`Failed to fetch from API: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as Track[];
};

// ---------------------------------------------------------------------------
// Transformation (tracks → hero + list state)
// ---------------------------------------------------------------------------

/**
 * Converts the first three tracks into HeroTrack format (with optional image by width).
 * @param tracks - Full list of tracks (uses first 3)
 * @returns Array of up to 3 HeroTrack items
 */
const tracksToHeroTracks = (tracks: Track[]): HeroTrack[] => {
    const topThree = tracks.slice(0, 3);
    return topThree.map((track) => {
        const imageObj = getImageByWidth(track.images, 300);
        return {
            title: track.title,
            artists: track.artists,
            url: track.url,
            image: imageObj?.url,
            position: track.position,
            positionChange: track.positionChange,
        };
    });
};

/**
 * Calculate time until next refresh and format it
 */
const getTimeUntilNextRefresh = (): string => {
    const now = new Date();
    const nextRefresh = new Date(now);

    // Set to today's 23:00 UTC
    nextRefresh.setUTCHours(23, 0, 0, 0);

    // If we're already past 23:00 UTC today, set to tomorrow
    if (now.getTime() > nextRefresh.getTime()) {
        nextRefresh.setUTCDate(nextRefresh.getUTCDate() + 1);
    }

    const diffMs = nextRefresh.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
        return `in ${diffHours}h ${diffMinutes}m`;
    }
    return `in ${diffMinutes}m`;
};

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

/**
 * Return type of {@link useTracksData}.
 */
export interface UseTracksDataReturn {
    /** Top 3 tracks formatted for the hero podium. */
    topTracks: HeroTrack[];
    /** Tracks after the top 3 (for the list when not searching). */
    allTracks: Track[];
    /** Full track list used for search and max streams calculation. */
    allTracksData: Track[];
    /** True while initial load or refresh is in progress. */
    isLoading: boolean;
    /** User-facing error message, or null. */
    error: string | null;
    /** Maximum daily streams in allTracksData (for bar scaling). */
    maxDailyStreams: number;
    /** allTracksData filtered by searchQuery (title/artist). */
    filteredTracks: Track[];
    /** When the current data was cached/updated */
    cacheUpdatedAt: string | null;
    /** Time until next scheduled refresh */
    timeUntilNextRefresh: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Loads top tracks with cache-first strategy: use cache if fresh,
 * otherwise fetch new data before showing anything, with cache as fallback only.
 * Exposes top tracks for hero, remaining tracks for list, and filtered list for search.
 *
 * @param searchQuery - Current search string; used to filter tracks (title/artist)
 * @returns {@link UseTracksDataReturn}
 */
export const useTracksData = (searchQuery: string): UseTracksDataReturn => {
    const [topTracks, setTopTracks] = useState<HeroTrack[]>([]);
    const [allTracks, setAllTracks] = useState<Track[]>([]);
    const [allTracksData, setAllTracksData] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | null>(null);
    const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState<string>("");

    const maxDailyStreams = useMemo(() => {
        if (!allTracksData.length) return 1;
        return Math.max(...allTracksData.map((track) => track.dailyStreams));
    }, [allTracksData]);

    const filteredTracks = useMemo(() => {
        if (!searchQuery.trim()) return allTracks;

        const query = searchQuery.toLowerCase().trim();
        return allTracksData.filter((track) => {
            const titleMatch = track.title.toLowerCase().includes(query);
            const artistMatch = track.artists.some((artist) =>
                artist.name.toLowerCase().includes(query)
            );
            return titleMatch || artistMatch;
        });
    }, [allTracksData, allTracks, searchQuery]);

    /**
     * Applies a full track list to state: top 3 → hero, rest → allTracks, full → allTracksData.
     */
    const applyTracksToState = useCallback((tracks: Track[], cachedAt: string | null) => {
        setTopTracks(tracksToHeroTracks(tracks));
        setAllTracks(tracks.slice(3));
        setAllTracksData(tracks);
        setCacheUpdatedAt(cachedAt || new Date().toISOString());
    }, []);

    useEffect(() => {
        const loadTracks = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const cached = loadFromCache<Track[]>(TOP_TRACKS_CACHE_KEY);

                // Check if cache should be refreshed due to 11 PM UTC schedule
                const shouldForceRefresh = cached ? isCacheStale(cached.cachedAt) : true;

                if (cached && !shouldForceRefresh) {
                    applyTracksToState(cached.data, cached.cachedAt);
                    setIsLoading(false);
                    return;
                }

                // Otherwise, try to fetch fresh data
                try {
                    const freshTracks = await fetchTopTracksFromApi();
                    saveToCache(TOP_TRACKS_CACHE_KEY, freshTracks);
                    applyTracksToState(freshTracks, new Date().toISOString());
                } catch (fetchError) {
                    console.error("Error fetching fresh tracks:", fetchError);

                    // If fetch fails but we have cached data, use it as fallback
                    if (cached) {
                        applyTracksToState(cached.data, cached.cachedAt);
                        console.warn("Using cached data because API fetch failed");
                    } else {
                        throw fetchError;
                    }
                }
            } catch (err) {
                console.error("Error loading tracks:", err);
                const errorMessage =
                    err instanceof Error ? err.message : "Unknown error occurred";
                setError(errorMessage);
                setTopTracks([]);
                setAllTracks([]);
                setAllTracksData([]);
                setCacheUpdatedAt(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadTracks();

        // Set up interval to update the time until next refresh every minute
        const updateRefreshTime = () => {
            setTimeUntilNextRefresh(getTimeUntilNextRefresh());
        };

        // Initial update
        updateRefreshTime();

        // Update every minute
        const refreshTimeInterval = setInterval(updateRefreshTime, 60000);

        // Set up interval to check for scheduled refresh (check every hour)
        const checkRefreshInterval = setInterval(() => {
            const cached = loadFromCache<Track[]>(TOP_TRACKS_CACHE_KEY);
            if (cached && isCacheStale(cached.cachedAt)) {
                console.log("Scheduled refresh time reached, refreshing data...");
                loadTracks();
            }
        }, 60 * 60 * 1000); // Check every hour

        return () => {
            clearInterval(refreshTimeInterval);
            clearInterval(checkRefreshInterval);
        };
    }, [applyTracksToState]);

    return {
        topTracks,
        allTracks,
        allTracksData,
        isLoading,
        error,
        maxDailyStreams,
        filteredTracks,
        cacheUpdatedAt,
        timeUntilNextRefresh,
    };
};

/**
 * Utility function to get information about the next scheduled refresh
 */
export const getNextRefreshInfo = () => {
    const cached = loadFromCache<Track[]>(TOP_TRACKS_CACHE_KEY);
    const now = new Date();
    const next11PM = new Date(now);

    next11PM.setUTCHours(23, 0, 0, 0);

    if (now.getTime() > next11PM.getTime()) {
        next11PM.setUTCDate(next11PM.getUTCDate() + 1);
    }

    const timeUntilRefresh = next11PM.getTime() - now.getTime();
    const hoursUntilRefresh = timeUntilRefresh / (1000 * 60 * 60);

    return {
        nextRefreshTime: next11PM.toISOString(),
        hoursUntilRefresh: hoursUntilRefresh.toFixed(1),
        cacheAge: cached ? (now.getTime() - new Date(cached.cachedAt).getTime()) / (1000 * 60 * 60) : null,
        isCacheFresh: cached ? !isCacheStale(cached.cachedAt) : false
    };
};