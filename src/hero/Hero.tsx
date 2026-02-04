import PodiumCard from "./PodiumCard";
import List from "../list/List";
import { useTracksData } from "../hooks/useTracksData";
import type {Track} from "../types.ts";
import { useEffect } from "react";

/** Props for the hero section (search drives filtered list). */
interface HeroProps {
    searchQuery: string;
    onTracksLoaded?: (tracks: Track[]) => void;
}

/**
 * Hero: title, podium cards (top 3), and full/sorted track list.
 * Hides podium when searching and shows search results header + filtered list.
 */
const Hero = ({ searchQuery, onTracksLoaded }: HeroProps) => {
    const {
        topTracks,
        allTracks,
        isLoading,
        error,
        maxDailyStreams,
        filteredTracks,
        cacheUpdatedAt,
        timeUntilNextRefresh,
        allTracksData, // This contains ALL 100 tracks
    } = useTracksData(searchQuery);

    // Call the callback whenever allTracksData changes
    useEffect(() => {
        if (allTracksData.length > 0 && onTracksLoaded) {
            onTracksLoaded(allTracksData);
        }
    }, [allTracksData, onTracksLoaded]);

    const isSearching = Boolean(searchQuery.trim());
    const heroSectionClassName = `w-full transition-all duration-500 ${
        isSearching ? "opacity-0 max-h-0 overflow-hidden -mt-16 sm:-mt-20 md:-mt-24" : "opacity-100"
    }`;

    const titleBlock = (
        <section className="mb-6 sm:mb-8 md:mb-10 w-full max-w-7xl ultrawide:max-w-none">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl ultrawide:text-7xl font-black tracking-tighter bg-gradient-to-t from-[#666666] to-white bg-clip-text text-transparent">
                Global Top 100
            </h2>
            <h3 className="text-white/40 text-sm sm:text-base md:text-lg mt-2 sm:mt-3 font-medium px-2">
                The world&apos;s most played tracks, updated daily.
            </h3>
            {error && (
                <div className="mt-4 sm:mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl max-w-md ultrawide:max-w-none mx-auto ultrawide:mx-0">
                    <p className="text-red-400 text-sm">⚠️ {error}</p>
                </div>
            )}
        </section>
    );

    const cardsBlock = (
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 sm:gap-6 md:gap-8 mt-0 w-full max-w-7xl px-2 sm:px-4"> {/* Changed mt-6 to mt-0 */}
            <div className="order-2 sm:order-1">
                <PodiumCard track={topTracks[1]} position={2} isLoading={isLoading} error={error} />
            </div>
            <div className="order-1 sm:order-2">
                <PodiumCard track={topTracks[0]} position={1} isLoading={isLoading} error={error} />
            </div>
            <div className="order-3 sm:order-3">
                <PodiumCard track={topTracks[2]} position={3} isLoading={isLoading} error={error} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-900/20 to-black pt-22 sm:pt-24">
            <div className="ultrawide:flex ultrawide:items-stretch ultrawide:w-full ultrawide:min-h-[calc(100vh-6rem)] ultrawide:px-6 ultrawide:gap-8">
                {!isSearching && (
                    <aside
                        className="hidden ultrawide:flex ultrawide:w-1/4 ultrawide:min-w-0 ultrawide:shrink-0 ultrawide:sticky ultrawide:top-24 ultrawide:self-start ultrawide:h-[calc(100vh-6rem)] ultrawide:flex-col ultrawide:justify-center ultrawide:items-center ultrawide:py-6"
                        aria-label="Top 3 tracks"
                    >
                        <div className={heroSectionClassName + " w-full max-w-full flex flex-col justify-center items-center gap-4"}>
                            <div className="w-full flex justify-center">
                                <div className="w-full max-w-[40vh]">
                                    <PodiumCard
                                        track={topTracks[0]}
                                        position={1}
                                        isLoading={isLoading}
                                        error={error}
                                        fillWidth
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full px-4">
                                <div className="w-full flex justify-center">
                                    <div className="w-full max-w-[30vh]">
                                        <PodiumCard
                                            track={topTracks[1]}
                                            position={2}
                                            isLoading={isLoading}
                                            error={error}
                                            fillWidth
                                        />
                                    </div>
                                </div>
                                <div className="w-full flex justify-center">
                                    <div className="w-full max-w-[30vh]">
                                        <PodiumCard
                                            track={topTracks[2]}
                                            position={3}
                                            isLoading={isLoading}
                                            error={error}
                                            fillWidth
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                )}

                <section className="flex flex-col flex-1 min-w-0 w-full ultrawide:min-w-0 ultrawide:w-3/4 ultrawide:max-w-none items-center justify-start sm:justify-center py-10 sm:py-10 md:py-12 text-center px-4 sm:px-6 ultrawide:px-8 ultrawide:items-start ultrawide:text-left">
                    <div className={heroSectionClassName + " flex flex-col justify-start sm:justify-center items-center ultrawide:contents w-full"}>
                        <div className="ultrawide:hidden w-full max-w-7xl">
                            {titleBlock}
                            {cardsBlock}
                        </div>
                        <div className="hidden ultrawide:block w-full mb-6">
                            {titleBlock}
                        </div>
                    </div>

                    {isSearching && (
                        <div className="mb-6 sm:mb-8 w-full px-2 sm:px-4 animate-fadeIn">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-t from-[#666666] to-white bg-clip-text text-transparent text-left">
                                Search Results
                            </h2>
                            <p className="text-white/40 text-sm mt-2 font-medium text-left">
                                Found {filteredTracks.length} tracks matching &quot;{searchQuery}&quot;
                            </p>
                        </div>
                    )}

                    <List
                        tracks={isSearching ? filteredTracks : allTracks}
                        isLoading={isLoading}
                        error={error}
                        maxDailyStreams={maxDailyStreams}
                        showTitle={!isSearching}
                        cacheUpdatedAt={cacheUpdatedAt}
                        timeUntilNextRefresh={timeUntilNextRefresh}
                    />
                </section>
            </div>
        </div>
    );
};

export default Hero;