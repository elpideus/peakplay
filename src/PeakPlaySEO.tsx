// src/components/PeakPlaySEO.tsx
import React from 'react';

// Define the TypeScript interfaces based on your data structure
interface Artist {
    name: string;
    url: string;
}

interface Image {
    url: string;
    width: number;
    height: number;
}

interface Song {
    position: number;
    positionChange: string;
    title: string;
    url: string;
    days: number;
    peakPosition: number;
    dailyStreams: number;
    totalStreams: number;
    artists: Artist[];
    images: Image[];
}

interface PeakPlaySEOProps {
    topSongs: Song[];
}

const PeakPlaySEO: React.FC<PeakPlaySEOProps> = ({ topSongs }) => {
    const firstThreeSongs = topSongs.slice(0, 3);
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const pageTitle = `Top 100 Global Songs Daily | PeakPlay | ${lastUpdated}`;

    const pageDescription = `Discover today's hottest tracks: ${firstThreeSongs.map(song =>
        `"${song.title}" by ${song.artists.map(a => a.name).join(' & ')}`
    ).join(', ')} and more. Daily updated global music chart based on millions of streams.`;

    const primaryArtist = topSongs[0]?.artists[0]?.name || 'Various Artists';
    const primaryImage = topSongs[0]?.images[0]?.url || 'https://peakplay.vercel.app/og-image.png';

    // 2. STRUCTURED DATA (JSON-LD) - Critical for Rich Results
    const chartStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'MusicPlaylist',
        'name': 'Top 100 Global Songs Daily',
        'description': 'Daily updated chart of the top 100 most-streamed songs worldwide.',
        'dateModified': new Date().toISOString(),
        'numTracks': 100,
        'track': topSongs.map((song, index) => ({
            '@type': 'MusicRecording',
            'name': song.title,
            'url': song.url,
            'position': index + 1,
            'byArtist': {
                '@type': 'MusicGroup',
                'name': song.artists.map(artist => artist.name).join(', '),
                'url': song.artists[0]?.url,
            },
            'image': song.images[0]?.url,
            // Additional properties some rich result types may use:
            'duration': `PT${Math.floor(song.days / (24*60))}M`, // Example - adapt if you have real duration
            'interactionStatistic': {
                '@type': 'InteractionCounter',
                'interactionType': 'https://schema.org/ListenAction',
                'userInteractionCount': song.dailyStreams,
            },
        })),
    };

    const formatNumber = (num: number): string => {
        if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toString();
    };

    const totalDailyStreams = topSongs.reduce((sum, song) => sum + song.dailyStreams, 0);

    return (
        <>
            {/* BASIC META TAGS - Essential for SEO */}
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <meta name="keywords" content={`top songs, music chart, global hits, daily music, trending songs, ${primaryArtist}, ${topSongs.slice(0, 5).map(s => s.title).join(', ')}`} />
            <meta name="author" content="PeakPlay" />
            <link rel="canonical" href="https://peakplay.vercel.app/" />

            {/* OPEN GRAPH - Essential for Social Sharing (Facebook, LinkedIn, etc.) */}
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:image" content={primaryImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:url" content="https://peakplay.vercel.app/" />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="PeakPlay" />
            <meta property="music:release_date" content={new Date().toISOString().split('T')[0]} />

            {/* TWITTER CARDS - Optimized for Twitter sharing */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@PeakPlay" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            <meta name="twitter:image" content={primaryImage} />
            <meta name="twitter:label1" content="Daily Streams" />
            <meta name="twitter:data1" content={formatNumber(totalDailyStreams)} />
            <meta name="twitter:label2" content="Tracks" />
            <meta name="twitter:data2" content="100" />

            {/* ADDITIONAL SEO TAGS */}
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta property="article:published_time" content={new Date().toISOString()} />
            <meta property="article:modified_time" content={new Date().toISOString()} />

            {/* STRUCTURED DATA - Renders as JSON-LD script tag */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(chartStructuredData) }}
            />

            {/* ADDITIONAL HIDDEN STRUCTURED DATA FOR EACH SONG (Optional but thorough) */}
            {topSongs.slice(0, 10).map((song) => (
                <div key={`hidden-data-${song.position}`} style={{ display: 'none' }} aria-hidden="true">
                    {/* Microdata hidden in the DOM as a fallback */}
                    <div itemScope itemType="https://schema.org/MusicRecording">
                        <meta itemProp="name" content={song.title} />
                        <link itemProp="url" href={song.url} />
                        <meta itemProp="position" content={song.position.toString()} />
                        <div itemProp="byArtist" itemScope itemType="https://schema.org/MusicGroup">
                            <meta itemProp="name" content={song.artists.map(a => a.name).join(', ')} />
                        </div>
                        <meta itemProp="image" content={song.images[0]?.url} />
                    </div>
                </div>
            ))}
        </>
    );
};

export default PeakPlaySEO;