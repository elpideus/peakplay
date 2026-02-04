import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import type { Track } from "../types";
import {getImageByWidth} from "../utils/ImageTools.ts";

/** Props for the track list (full chart or search results). */
interface ListProps {
    tracks: Track[];
    isLoading: boolean;
    error: string | null;
    maxDailyStreams: number;
    showTitle?: boolean;
    cacheUpdatedAt?: string | null;
    timeUntilNextRefresh?: string;
}

/** Sortable column identifiers. */
type SortField = "position" | "title" | "artists" | "days" | "peak" | "daily" | "total";

/** Sort direction. */
type SortDirection = "asc" | "desc";

/** Formats a number with locale-aware grouping (e.g. 1,234,567). */
const formatNumber = (value: number): string =>
    new Intl.NumberFormat().format(value);

/**
 * Renders position change indicator (e.g. ▲2 or ▼1). Returns null for no change or "=".
 */
const PositionChangeIndicator = ({ change, size = "default", center = false }: { change: string; size?: "default" | "sm"; center?: boolean }) => {
    if (!change || change === "=") return null;

    const isPositive = change.startsWith("+");
    const value = change.replace("+", "").replace("-", "");
    const sizeClass = size === "sm" ? "text-[10px]" : "";
    const marginClass = center ? "" : size === "sm" ? "mr-1" : "mr-2";
    const className = `inline-flex items-center ${marginClass} ${isPositive ? "text-green-500" : "text-red-500"} ${sizeClass}`;

    return (
        <span className={className}>
      {isPositive ? `▲${value}` : `▼${value}`}
    </span>
    );
};

/**
 * Returns progress bar width as a percentage of max daily streams.
 */
const getProgressPercentage = (
    dailyStreams: number,
    maxDailyStreams: number
): number => {
    if (maxDailyStreams === 0) return 0;
    return (dailyStreams / maxDailyStreams) * 100;
};

/**
 * Returns Tailwind gradient class for progress bar by chart position (top 10 / 30 / 50 / rest).
 */
const getProgressBarGradientClass = (position: number): string => {
    if (position <= 10) return "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500";
    if (position <= 30) return "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500";
    if (position <= 50) return "bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500";
    return "bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700";
};

/**
 * Extracts comparable value for a track by sort field (for sorting).
 */
const getSortValue = (track: Track, field: SortField): number | string => {
    switch (field) {
        case "position":
            return track.position;
        case "title":
            return track.title.toLowerCase();
        case "artists":
            return track.artists[0]?.name?.toLowerCase() ?? "";
        case "days":
            return track.days;
        case "peak":
            return track.peakPosition;
        case "daily":
            return track.dailyStreams;
        case "total":
            return track.totalStreams;
        default:
            return track.position;
    }
};

/**
 * Sorts tracks by the given field and direction (mutates a copy; strings use localeCompare).
 */
const sortTracksByField = (
    tracks: Track[],
    field: SortField,
    direction: SortDirection
): Track[] => {
    if (!tracks.length) return [];

    return [...tracks].sort((trackA, trackB) => {
        const valueA = getSortValue(trackA, field);
        const valueB = getSortValue(trackB, field);

        if (typeof valueA === "string" && typeof valueB === "string") {
            return direction === "asc"
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        }

        const numA = valueA as number;
        const numB = valueB as number;
        return direction === "asc" ? numA - numB : numB - numA;
    });
};

/**
 * Format a date to a readable string
 */
const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

/**
 * Full chart / search results list: sortable table with progress bars and track links.
 */
const List = ({
                  tracks,
                  isLoading,
                  error,
                  maxDailyStreams,
                  showTitle = true,
                  cacheUpdatedAt,
                  timeUntilNextRefresh = "in 0h 0m",
              }: ListProps) => {
    const [sortField, setSortField] = useState<SortField>("position");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const sortScrollRef = useRef<HTMLDivElement>(null);
    const [showScrollHint, setShowScrollHint] = useState(true);

    const updateScrollHint = useCallback(() => {
        const el = sortScrollRef.current;
        if (!el) return;
        const hasOverflow = el.scrollWidth > el.clientWidth;
        const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
        setShowScrollHint(hasOverflow && !isAtEnd);
    }, []);

    useEffect(() => {
        const el = sortScrollRef.current;
        if (!el) return;
        const raf = requestAnimationFrame(() => updateScrollHint());
        el.addEventListener("scroll", updateScrollHint);
        const ro = new ResizeObserver(updateScrollHint);
        ro.observe(el);
        return () => {
            cancelAnimationFrame(raf);
            el.removeEventListener("scroll", updateScrollHint);
            ro.disconnect();
        };
    }, [updateScrollHint]);

    const handleSortClick = useCallback(
        (field: SortField) => {
            if (sortField === field) {
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            } else {
                setSortField(field);
                setSortDirection("asc");
            }
        },
        [sortField]
    );

    const sortedTracks = useMemo(
        () => sortTracksByField(tracks, sortField, sortDirection),
        [tracks, sortField, sortDirection]
    );

    const getHeaderClassName = useCallback(
        (field: SortField): string => {
            const base = "cursor-pointer hover:text-white transition-colors duration-200 select-none";
            const active =
                sortField === field ? "text-white font-semibold" : "text-white/60 hover:text-white";
            return `${base} ${active}`;
        },
        [sortField]
    );

    if (error) {
        return (
            <div className="mt-12 p-4 sm:p-6 bg-red-900/20 border border-red-500/30 rounded-2xl max-w-2xl mx-auto ultrawide:max-w-none ultrawide:mx-0">
                <p className="text-red-400 text-center text-sm sm:text-base">⚠️ {error}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="mt-12 w-full max-w-6xl mx-auto ultrawide:max-w-none ultrawide:mx-0 px-3 sm:px-4">
                {showTitle && (
                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-t from-[#666666] to-white bg-clip-text text-transparent">
                            Full Chart
                        </h2>
                        <p className="text-white/40 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                            Tracks 4-100 from the Global Top 100
                        </p>
                    </div>
                )}
                <div className="space-y-2 sm:space-y-3">
                    {[...Array(10)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="h-14 sm:h-16 bg-white/5 rounded-xl border border-white/10" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <section className={`w-full max-w-6xl mx-auto ultrawide:max-w-none ultrawide:mx-0 px-3 sm:px-4 ${showTitle ? "mt-12 sm:mt-16 md:mt-20" : ""}`}>
            {showTitle && (
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-t from-[#666666] to-white bg-clip-text text-transparent">
                        Full Chart
                    </h2>
                    <p className="text-white/40 text-xs sm:text-sm mt-1 sm:mt-2 font-medium">
                        Tracks 4-100 from the Global Top 100 • Best daily streams:{" "}
                        {formatNumber(maxDailyStreams)}
                    </p>
                </div>
            )}

            <div className="lg:hidden mb-4 relative">
                <div
                    ref={sortScrollRef}
                    className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-y-hidden flex gap-2 flex-nowrap pb-1 -mx-1 px-1 pr-20"
                >
                    {(["position", "title", "daily", "total", "days", "peak"] as const).map((field) => (
                        <button
                            key={field}
                            type="button"
                            onClick={() => handleSortClick(field)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                sortField === field
                                    ? "bg-white/20 text-white"
                                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            {field === "position" ? "#" : field === "title" ? "Track" : field === "daily" ? "Daily" : field === "total" ? "Total" : field === "days" ? "Days" : "Peak"}
                            {sortField === field && (sortDirection === "asc" ? " ↑" : " ↓")}
                        </button>
                    ))}
                </div>
                <div className="absolute right-[-4px] top-0 bottom-1 w-16 bg-gradient-to-l from-black via-black to-transparent pointer-events-none" aria-hidden />
                <span
                    className={`flex absolute right-2 top-1/2 -translate-y-4 text-white/60 text-lg pointer-events-none transition-opacity duration-200 ${
                        showScrollHint ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden
                >
                    »
                </span>
            </div>

            {tracks.length === 0 ? (
                <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
                    <div className="text-white/40 mb-4 text-4xl sm:text-6xl">🎵</div>
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">No tracks found</h3>
                    <p className="text-white/60 text-sm sm:text-base">
                        Try searching with different terms or browse the full chart
                    </p>
                </div>
            ) : (
                <>
                <div className="lg:hidden space-y-3">
                    {sortedTracks.map((track) => {
                        const imageObj = getImageByWidth(track.images, 80);
                        const displayArtists =
                            track.artists
                                .slice(0, 2)
                                .map((artist) => artist.name)
                                .join(", ") + (track.artists.length > 2 ? "..." : "");
                        const progressPercentage = getProgressPercentage(
                            track.dailyStreams,
                            maxDailyStreams
                        );
                        const isTopStreamer = track.dailyStreams === maxDailyStreams;

                        return (
                            <div
                                key={track.position}
                                className={`rounded-xl border border-white/10 p-4 bg-black/40 backdrop-blur-sm cursor-pointer transition-all active:scale-[0.99] ${
                                    isTopStreamer ? "bg-gradient-to-r from-white/5 to-transparent border-yellow-500/20" : "hover:bg-white/5"
                                }`}
                                onClick={() => window.open(track.url, "_blank")}
                            >
                                <div className="flex gap-3">
                                    <div className="flex flex-col items-center shrink-0 min-w-[2ch]">
                                        <span className={`text-xl font-bold tabular-nums leading-none ${
                                            isTopStreamer ? "text-yellow-400" : "text-white/80"
                                        }`}>
                                            {track.position}
                                        </span>
                                        <div className="flex justify-center w-full">
                                            <PositionChangeIndicator change={track.positionChange} size="sm" center />
                                        </div>
                                    </div>
                                    <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden">
                                        <img src={imageObj?.url} alt={track.title} className="w-full h-full object-cover" />
                                        {isTopStreamer && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col justify-center text-left">
                                        <h4 className={`font-semibold text-base leading-tight line-clamp-2 text-left ${
                                            isTopStreamer ? "text-white" : "text-white/90"
                                        }`}>{track.title}</h4>
                                        <p className="text-white/60 text-sm mt-0.5 line-clamp-2 text-left">{displayArtists}</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-white/50">Daily streams</p>
                                        <p className="text-sm font-semibold text-white">{formatNumber(track.dailyStreams)}</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                                        <div>
                                            <p className="text-xs text-white/50">Total</p>
                                            <p className="text-white/90">{(track.totalStreams / 1_000_000).toFixed(1)}M</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">Days</p>
                                            <p className="text-white/90">{track.days}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">Peak</p>
                                            <p className="text-white/90">{track.peakPosition}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">% of top</p>
                                            <p className="text-white/90">{progressPercentage.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-1">
                                            <div
                                                className={`h-full rounded-full transition-all ${getProgressBarGradientClass(track.position)}`}
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="hidden lg:block bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-sm font-medium">
                        <div
                            className="col-span-1 flex items-center"
                            onClick={() => handleSortClick("position")}
                            onKeyDown={(e) => e.key === "Enter" && handleSortClick("position")}
                            role="button"
                            tabIndex={0}
                        >
              <span className={getHeaderClassName("position")}>
                #{sortField === "position" ? (sortDirection === "asc" ? "↑" : "↓") : null}
              </span>
                        </div>
                        <div
                            className="col-span-6 flex items-center"
                            onClick={() => handleSortClick("title")}
                            onKeyDown={(e) => e.key === "Enter" && handleSortClick("title")}
                            role="button"
                            tabIndex={0}
                        >
              <span className={getHeaderClassName("title")}>
                Track{sortField === "title" ? (sortDirection === "asc" ? "↑" : "↓") : null}
              </span>
                        </div>
                        <div
                            className="col-span-1 flex items-center justify-center"
                            onClick={() => handleSortClick("days")}
                            onKeyDown={(e) => e.key === "Enter" && handleSortClick("days")}
                            role="button"
                            tabIndex={0}
                        >
              <span className={getHeaderClassName("days")}>
                Days{sortField === "days" ? (sortDirection === "asc" ? "↑" : "↓") : null}
              </span>
                        </div>
                        <div
                            className="col-span-1 flex items-center justify-center"
                            onClick={() => handleSortClick("peak")}
                            onKeyDown={(e) => e.key === "Enter" && handleSortClick("peak")}
                            role="button"
                            tabIndex={0}
                        >
              <span className={getHeaderClassName("peak")}>
                Peak{sortField === "peak" ? (sortDirection === "asc" ? "↑" : "↓") : null}
              </span>
                        </div>
                        <div
                            className="col-span-2 flex items-center justify-center"
                            onClick={() => handleSortClick("daily")}
                            onKeyDown={(e) => e.key === "Enter" && handleSortClick("daily")}
                            role="button"
                            tabIndex={0}
                        >
              <span className={getHeaderClassName("daily")}>
                Daily Streams
                  {sortField === "daily" ? (sortDirection === "asc" ? "↑" : "↓") : null}
              </span>
                        </div>
                        <div
                            className="col-span-1 flex items-center justify-center"
                            onClick={() => handleSortClick("total")}
                            onKeyDown={(e) => e.key === "Enter" && handleSortClick("total")}
                            role="button"
                            tabIndex={0}
                        >
              <span className={getHeaderClassName("total")}>
                Total{sortField === "total" ? (sortDirection === "asc" ? "↑" : "↓") : null}
              </span>
                        </div>
                    </div>

                    <div className="divide-y divide-white/5">
                        {sortedTracks.map((track) => {
                            const imageObj = getImageByWidth(track.images, 60);
                            const displayArtists =
                                track.artists
                                    .slice(0, 2)
                                    .map((artist) => artist.name)
                                    .join(", ") + (track.artists.length > 2 ? "..." : "");
                            const progressPercentage = getProgressPercentage(
                                track.dailyStreams,
                                maxDailyStreams
                            );
                            const isTopStreamer = track.dailyStreams === maxDailyStreams;

                            return (
                                <div
                                    key={track.position}
                                    className={`group grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-all duration-300 cursor-pointer ${
                                        isTopStreamer ? "bg-gradient-to-r from-white/5 to-transparent" : ""
                                    }`}
                                    onClick={() => window.open(track.url, "_blank")}
                                >
                                    <div className="col-span-1 flex items-center">
                                        <div className="flex items-center">
                      <span
                          className={`text-lg font-bold ${
                              isTopStreamer
                                  ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]"
                                  : "text-white/80"
                          }`}
                      >
                        {track.position}
                      </span>
                                            <div className="ml-3">
                                                <PositionChangeIndicator change={track.positionChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-6 flex items-center gap-4">
                                        <div className="relative w-12 h-12 flex-shrink-0">
                                            <img
                                                src={imageObj?.url}
                                                alt={track.title}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg" />
                                            {isTopStreamer && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                                    <span className="text-xs text-black font-bold">🔥</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <h4
                                                className={`font-semibold truncate text-left ${
                                                    isTopStreamer
                                                        ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                                                        : "text-white group-hover:text-white/90"
                                                }`}
                                            >
                                                {track.title}
                                            </h4>
                                            <p className="text-white/60 text-sm truncate text-left">
                                                {displayArtists}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-1 flex items-center justify-center">
                    <span
                        className={`font-medium ${
                            track.days > 90 ? "text-green-400" : "text-white/70"
                        }`}
                    >
                      {track.days}
                    </span>
                                    </div>

                                    <div className="col-span-1 flex items-center justify-center">
                    <span
                        className={`font-medium ${
                            track.peakPosition === 1 ? "text-yellow-400" : "text-white/70"
                        }`}
                    >
                      {track.peakPosition}
                    </span>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-center">
                                        <div className="flex flex-col items-center w-full max-w-xs">
                                            <div className="flex items-center justify-between w-full mb-1">
                        <span
                            className={`text-sm font-semibold ${
                                isTopStreamer ? "text-yellow-400" : "text-white"
                            }`}
                        >
                          {formatNumber(track.dailyStreams)}
                        </span>
                                                <span className="text-white/40 text-xs">
                          {progressPercentage.toFixed(1)}%
                        </span>
                                            </div>
                                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden group-hover:bg-white/15 transition-all">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressBarGradientClass(track.position)}`}
                                                    style={{
                                                        width: `${progressPercentage}%`,
                                                        boxShadow: isTopStreamer
                                                            ? "0 0 10px rgba(255,215,0,0.5)"
                                                            : "none",
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between w-full mt-1">
                                                <span className="text-white/30 text-xs">0</span>
                                                <span className="text-white/30 text-xs">
                          {formatNumber(maxDailyStreams)}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-1 flex items-center justify-center">
                    <span className="text-white/70 font-medium">
                      {(track.totalStreams / 1_000_000).toFixed(1)}M
                    </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-4 sm:px-6 py-4 border-t border-white/10 text-center">
                        <p className="text-white/40 text-xs sm:text-sm">
                            Showing {tracks.length + 3} tracks • Updated daily • Developed by elpideus
                        </p>
                        {showTitle && (
                            <>
                                <p className="text-white/40 text-xs sm:text-sm mt-1">
                                    Local data updated as of {formatDate(cacheUpdatedAt)} • Next update {timeUntilNextRefresh} • Updates daily at 11 PM UTC
                                </p>
                                <p className="text-white/30 text-xs mt-1">
                                    Progress bars show daily streams relative to the highest (
                                    {formatNumber(maxDailyStreams)})
                                </p>
                            </>
                        )}
                        <p className="text-white/40 text-xs mt-2">
                            Sorted by: {sortField} ({sortDirection === "asc" ? "ascending" : "descending"})
                        </p>
                    </div>
                </div>

                <div className="lg:hidden mt-6 pt-6 border-t border-white/10 px-2 text-center space-y-3">
                    <p className="text-white/40 text-xs sm:text-sm">
                        Showing {tracks.length + 3} tracks • Updated daily • Developed by elpideus
                    </p>
                    {showTitle && (
                        <>
                            <p className="text-white/40 text-xs sm:text-sm">
                                Local data updated as of {formatDate(cacheUpdatedAt)} • Next update {timeUntilNextRefresh} • Updates daily at 11 PM UTC
                            </p>
                            <p className="text-white/30 text-xs">
                                Progress bars show daily streams relative to the highest (
                                {formatNumber(maxDailyStreams)})
                            </p>
                        </>
                    )}
                    <p className="text-white/40 text-xs">
                        Sorted by: {sortField} ({sortDirection === "asc" ? "ascending" : "descending"})
                    </p>
                </div>
                </>
            )}
        </section>
    );
};

export default List;