// App.tsx
import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Header from "./header/Header";
import Hero from "./hero/Hero";
import PeakPlaySEO from "./PeakPlaySEO";
import type { Track } from "./types"; // Assuming this matches your API

/**
 * Root app: holds global search state and composes header + hero (with track list).
 */
const App = () => {
    const [searchQuery, setSearchQuery] = useState("");
    // State to hold tracks for SEO
    const [seoTracks, setSeoTracks] = useState<Track[]>([]);

    // Callback function that Hero will use to send data up
    const handleTracksLoaded = (tracks: Track[]) => {
        setSeoTracks(tracks);
    };

    return (
        <>
            {/* SEO Component receives the track data */}
            <PeakPlaySEO topSongs={seoTracks} />

            <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            {/* Hero passes data back via callback */}
            <Hero
                searchQuery={searchQuery}
                onTracksLoaded={handleTracksLoaded}
            />

            <Analytics />
            <SpeedInsights />
        </>
    );
};

export default App;