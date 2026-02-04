// server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const { SpotifyApi } = require("@spotify/web-api-ts-sdk");
const { Redis } = require('@upstash/redis');

const app = express();

app.use(cors());

// ✅ Add a health check endpoint at the root
app.get('/', (req, res) => {
    res.json({
        service: 'Top Songs API',
        status: 'running',
        endpoints: [
            '/api/top-songs (GET) - Get top 100 songs (requires auth)',
            '/api/cache-schedule (GET) - Check cache schedule (requires auth)',
            '/api/cache-status (GET) - Check cache status (requires auth)'
        ],
        authentication: 'Use Authorization: Bearer <token> header'
    });
});

// ✅ Add public health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Top Songs API'
    });
});

const API_TOKEN = process.env.API_TOKEN;

// Validate required environment variables
if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error("Missing Spotify credentials in environment variables");
}

if (!API_TOKEN) {
    throw new Error("Missing API_TOKEN in environment variables");
}

const redis = Redis.fromEnv();
const spotifySDK = SpotifyApi.withClientCredentials(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET, []);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({
            error: 'No authorization header provided',
            message: 'Include Authorization: Bearer <token> header'
        });
    }

    const token = authHeader.split(' ')[1]; // Get token after "Bearer "

    if (!token) {
        return res.status(401).json({
            error: 'Invalid authorization header format',
            message: 'Use format: Bearer <token>'
        });
    }

    if (token !== API_TOKEN) {
        return res.status(403).json({
            error: 'Invalid or expired token',
            message: 'The provided token is not valid'
        });
    }

    next();
};

/**
 * Calculate the next 11 PM UTC time
 */
const getNext11PMUTC = () => {
    const now = new Date();
    const next11PM = new Date(now);

    // Set to 23:00 (11 PM) UTC
    next11PM.setUTCHours(23, 0, 0, 0);

    // If current time is past 11 PM UTC, schedule for tomorrow
    if (now.getTime() > next11PM.getTime()) {
        next11PM.setUTCDate(next11PM.getUTCDate() + 1);
    }

    return next11PM;
};

/**
 * Check if cache should be refreshed due to 11 PM UTC schedule
 */
const shouldRefreshCache = (cacheData) => {
    if (!cacheData || !cacheData.cachedAt) return true;

    const cacheDate = new Date(cacheData.cachedAt);
    const now = new Date();

    // Get today's 11 PM UTC
    const today11PM = new Date(now);
    today11PM.setUTCHours(23, 0, 0, 0);

    // If cache is from before today's 11 PM and now is after 11 PM, refresh
    if (cacheDate.getTime() < today11PM.getTime() && now.getTime() > today11PM.getTime()) {
        return true;
    }

    return false;
};

/**
 * Check if cache is still valid (created after yesterday's 11 PM UTC)
 */
const isCacheValid = (cacheData) => {
    if (!cacheData || !cacheData.cachedAt) return false;

    const cacheDate = new Date(cacheData.cachedAt);
    const now = new Date();

    // Get today's 11 PM UTC
    const today11PM = new Date(now);
    today11PM.setUTCHours(23, 0, 0, 0);

    // Get yesterday's 11 PM UTC
    const yesterday11PM = new Date(today11PM);
    yesterday11PM.setUTCDate(yesterday11PM.getUTCDate() - 1);

    // Cache is valid if it was created after yesterday's 11 PM UTC
    const isValid = cacheDate.getTime() > yesterday11PM.getTime();

    return isValid;
};

// Function to save data to cache
const saveToCache = async (tracks) => {
    const cacheData = {
        cachedAt: new Date().toISOString(),
        tracks: tracks
    };

    try {
        const jsonString = JSON.stringify(cacheData);
        console.log(`Saving to cache, tracks: ${tracks.length}, JSON size: ${jsonString.length} bytes`);

        // Use the exact same method as Upstash recommends
        const result = await redis.set('top_songs_cache', jsonString, { ex: 172800 });
        console.log(`Cache save result:`, result);
        console.log(`Cache updated at ${cacheData.cachedAt}`);

    } catch (error) {
        console.error('Error saving to cache:', error);
    }
};

// Function to load data from cache
const loadFromCache = async () => {
    try {
        const data = await redis.get('top_songs_cache');

        console.log('Cache load - data type:', typeof data);
        console.log('Cache load - data constructor:', data?.constructor?.name);

        if (!data) {
            console.log('No cache data found');
            return null;
        }

        // Handle different data types
        let parsedData;
        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
                console.log('Successfully parsed string cache');
            } catch (error) {
                console.error('Failed to parse cache string:', error.message);
                return null;
            }
        } else if (typeof data === 'object' && data !== null) {
            // Data might already be parsed by the Redis client
            parsedData = data;
            console.log('Cache data is already an object');
        } else {
            console.error('Unexpected cache data type:', typeof data);
            return null;
        }

        // Ensure parsedData has the expected structure
        if (parsedData && parsedData.cachedAt && parsedData.tracks) {
            console.log(`Cache loaded: ${parsedData.tracks.length} tracks, cached at ${parsedData.cachedAt}`);
            return parsedData;
        } else {
            console.error('Cache data has unexpected structure:', parsedData);
            return null;
        }

    } catch (error) {
        console.error('Error loading cache:', error);
        return null;
    }
};

// Main function to fetch songs data
const fetchSongsData = async () => {
    console.log('Fetching fresh data from kworb.net and Spotify...');

    try {
        const { data: html } = await axios.get('https://kworb.net/spotify/country/global_daily.html');
        const $ = cheerio.load(html);
        const tracks = [];

        // First, collect all track IDs
        const trackIds = [];
        const trackMap = new Map();

        $('#spotifydaily tbody tr').slice(0, 100).each((_index, element) => {
            const cols = $(element).find('td');
            const artistTitleCol = $(cols[2]);
            const artist = artistTitleCol.find('a').first().text().trim();
            const titleLink = artistTitleCol.find('a').eq(1);
            const title = titleLink.text().trim();
            const trackHref = titleLink.attr('href') || '';
            const trackIdMatch = trackHref.match(/track\/([^\/]+)\.html/);
            const trackId = trackIdMatch ? trackIdMatch[1] : '';

            const parseNumber = (text) => parseInt(text.replace(/,/g, '')) || 0;

            tracks.push({
                position: parseInt($(cols[0]).text().trim()) || 0,
                positionChange: $(cols[1]).text().trim(),
                title,
                url: trackId ? `https://open.spotify.com/track/${trackId}` : '',
                days: parseInt($(cols[3]).text().trim()) || 0,
                peakPosition: parseInt($(cols[4]).text().trim()) || 0,
                dailyStreams: parseNumber($(cols[6]).text().trim()),
                totalStreams: parseNumber($(cols[10]).text().trim()),
            });

            // Store artist name temporarily
            tracks[_index].artist = artist;

            if (trackId) {
                trackIds.push(trackId);
                trackMap.set(trackId, _index);
            }
        });

        // Fetch additional data from Spotify API in batches of 50
        const spotifyData = new Map();

        // Split track IDs into batches of 50
        for (let i = 0; i < trackIds.length; i += 50) {
            const batch = trackIds.slice(i, i + 50);

            try {
                const response = await spotifySDK.tracks.get(batch);

                // Handle both single track and multiple tracks response
                const tracksData = Array.isArray(response) ? response : [response];

                tracksData.forEach(track => {
                    if (track && track.id) {
                        spotifyData.set(track.id, track);
                    }
                });

                // Add a small delay between batches to avoid rate limiting
                if (i + 50 < trackIds.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.error('Spotify API batch error:', error.message);
                // Continue with other batches even if one fails
            }
        }

        // Enrich tracks with Spotify data
        tracks.forEach((track, index) => {
            // Extract track ID from URL
            const trackId = track.url.split('/track/')[1];

            if (trackId && spotifyData.has(trackId)) {
                const spotifyTrack = spotifyData.get(trackId);

                // Get artists from Spotify API (more accurate)
                const artists = spotifyTrack.artists.map(artist => ({
                    name: artist.name,
                    url: artist.external_urls?.spotify || `https://open.spotify.com/artist/${artist.id}`
                }));

                // Get images from album
                const images = spotifyTrack.album?.images?.map(img => ({
                    url: img.url,
                    width: img.width || 0,
                    height: img.height || 0
                })) || [];

                // Update track with Spotify data
                tracks[index] = {
                    ...track,
                    artists: artists,
                    images: images,
                };

                // Remove the temporary artist field
                delete tracks[index].artist;
            } else {
                // If no Spotify data, create basic structure with scraped data
                tracks[index] = {
                    ...track,
                    artists: [{
                        name: track.artist,
                        url: ''
                    }],
                    images: [],
                };

                // Remove the old single artist field
                delete tracks[index].artist;
            }
        });

        return tracks;
    } catch (error) {
        console.error('Error fetching songs data:', error);
        throw error;
    }
};

app.get('/api/top-songs', authenticateToken, async (req, res) => {
    try {
        // Check cache first - ADD AWAIT
        const cacheData = await loadFromCache();

        // Check if we should refresh due to 11 PM UTC schedule
        const needsRefresh = shouldRefreshCache(cacheData);

        if (cacheData && isCacheValid(cacheData) && !needsRefresh) {
            console.log('Serving from cache');
            return res.json(cacheData.tracks);
        }

        // Cache is invalid, expired, or needs scheduled refresh - fetch fresh data
        console.log('Cache invalid or scheduled refresh time reached, fetching fresh data...');
        const tracks = await fetchSongsData();

        // Save to cache
        await saveToCache(tracks);

        // Return fresh data
        res.json(tracks);
    } catch (error) {
        console.error('Error:', error);

        // If there's an error but we have stale cache, serve it anyway - ADD AWAIT
        const cacheData = await loadFromCache();
        if (cacheData && cacheData.tracks) {
            console.log('Error fetching fresh data, serving stale cache');
            return res.json(cacheData.tracks);
        }

        res.status(500).json({ error: 'Failed to fetch song data' });
    }
});

// ✅ CommonJS export for Vercel
module.exports = app;