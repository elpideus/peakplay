import {useState, useRef, useEffect, useCallback} from "react";
import type {HeroTrack} from "../types";
import ColorThief from "colorthief";

/** RGB triplet from ColorThief. */
type RgbTuple = [number, number, number];

/** Props for a single podium card (position 1–3). */
interface PodiumCardProps {
    track?: HeroTrack;
    position: number;
    isLoading: boolean;
    error: string | null;
    /** When true, card fills container width (e.g. ultra-wide sidebar layout). */
    fillWidth?: boolean;
}

/** Parallax intensity for hover (first place gets stronger effect). */
const PARALLAX_INTENSITY_FIRST = 15;
const PARALLAX_INTENSITY_OTHER = 10;

/** Fallback dominant colors by position when color extraction fails. */
const FALLBACK_COLORS: Record<number, RgbTuple> = {
    1: [244, 63, 94],
    2: [59, 130, 246],
    3: [168, 85, 247],
};

const getFallbackColor = (position: number): RgbTuple =>
    FALLBACK_COLORS[position] ?? [168, 85, 247];

/** Returns Tailwind classes for card size and z-index by position (responsive). */
const getCardSizeClasses = (position: number, fillWidth?: boolean): string => {
    if (fillWidth) {
        const base = "w-full h-auto max-h-full z-10";
        if (position === 1) return `${base} z-20`;
        return `${base} opacity-90 hover:opacity-100`;
    }
    if (position === 1) return "w-[80vw] sm:w-56 md:w-64 lg:w-72 xl:w-80 z-20 scale-105 sm:scale-[1.08] md:scale-110";
    return "w-[80vw] sm:w-44 md:w-52 lg:w-64 z-10 opacity-90 hover:opacity-100";
};

/** Returns badge style classes by position (gold / silver / bronze). */
const getBadgeClasses = (position: number): string => {
    const base = "text-xs sm:text-sm font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border transition-all duration-300";
    if (position === 1) return `${base} bg-yellow-500/20 border-yellow-500/50 text-yellow-500`;
    if (position === 2) return `${base} bg-gray-400/80 border-gray-300 text-gray-100`;
    return `${base} bg-orange-900/80 border-orange-600 text-orange-400`;
};

/**
 * Renders position change indicator (e.g. ▲2 or ▼1). Returns null for no change or "=".
 */
const PositionChangeIndicator = ({change}: { change: string }) => {
    if (!change || change === "=") return null;

    const isPositive = change.startsWith("+");
    const value = change.replace("+", "").replace("-", "");
    const className = `inline-flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`;

    return (
        <span className={`${className} text-base sm:text-xl font-semibold`}>
      {isPositive ? `▲${value}` : `▼${value}`}
    </span>
    );
};

/**
 * Builds CSS gradient string from dominant color (and optional palette). Uses fallback if no color.
 */
const buildGradientCss = (
    dominantColor: RgbTuple | null,
    palette: RgbTuple[],
    position: number,
    isHovered: boolean
): string => {
    if (!dominantColor) {
        const [r, g, b] = getFallbackColor(position);
        return `linear-gradient(135deg, rgba(${r},${g},${b},0.3), rgba(0,0,0,0.8))`;
    }

    const [r, g, b] = dominantColor;
    const intensity = isHovered ? 0.4 : 0.2;

    if (palette.length >= 3) {
        const [r2, g2, b2] = palette[1] ?? dominantColor;
        return `linear-gradient(135deg, rgba(${r},${g},${b},${intensity}), rgba(${r2},${g2},${b2},${intensity * 0.7}), rgba(0,0,0,0.8))`;
    }

    return `linear-gradient(135deg, rgba(${r},${g},${b},${intensity}), rgba(${r},${g},${b},${intensity * 0.7}), rgba(0,0,0,0.8))`;
};

/**
 * Builds box-shadow string for neon glow (optionally offset by mouse).
 */
const buildNeonGlowCss = (
    dominantColor: RgbTuple | null,
    isHovered: boolean,
    mouseX: number,
    mouseY: number
): string => {
    if (!dominantColor) return "";

    const [r, g, b] = dominantColor;
    const intensity = isHovered ? 0.4 : 0.2;
    const blur = isHovered ? "25px" : "15px";
    const spread = isHovered ? "12px" : "8px";
    const offsetX = mouseX * 5;
    const offsetY = mouseY * 5;

    return `${offsetX}px ${offsetY}px ${blur} ${spread} rgba(${r},${g},${b},${intensity})`;
};

/**
 * Builds text-shadow string for neon text effect.
 */
const buildTextShadowCss = (
    dominantColor: RgbTuple | null,
    isHovered: boolean
): string => {
    if (!dominantColor) return "";

    const [r, g, b] = dominantColor;
    const intensity = isHovered ? 0.4 : 0.2;

    return `0 0 8px rgba(${r},${g},${b},${intensity}), 0 0 12px rgba(${r},${g},${b},${intensity * 0.7})`;
};

/**
 * Podium card for top-3 track: artwork, color extraction, parallax hover, position badge.
 */
const PodiumCard = ({track, position, isLoading, error, fillWidth = false}: PodiumCardProps) => {
    const isFirst = position === 1;
    const [dominantColor, setDominantColor] = useState<RgbTuple | null>(null);
    const [palette, setPalette] = useState<RgbTuple[]>([]);
    const [isHovered, setIsHovered] = useState(false);
    const [mousePosition, setMousePosition] = useState({x: 0, y: 0});
    const [parallaxTransform, setParallaxTransform] = useState({x: 0, y: 0});

    const cardRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const colorThiefRef = useRef<ColorThief | null>(null);

    useEffect(() => {
        if (!colorThiefRef.current) {
            colorThiefRef.current = new ColorThief();
        }
    }, []);

    const extractColors = useCallback(() => {
        if (!imgRef.current || !colorThiefRef.current) return;

        try {
            const dominant = colorThiefRef.current.getColor(imgRef.current) as RgbTuple;
            const paletteColors = colorThiefRef.current.getPalette(imgRef.current, 3) as RgbTuple[];

            setDominantColor(dominant);
            setPalette(paletteColors);
        } catch (err) {
            console.error("Error extracting colors:", err);
            setDominantColor(getFallbackColor(position));
            setPalette([]);
        }
    }, [position]);

    const handleImageLoad = useCallback(() => {
        if (imgRef.current) extractColors();
    }, [extractColors]);

    useEffect(() => {
        if (track?.image && imgRef.current?.complete && colorThiefRef.current) {
            extractColors();
        }
    }, [track?.image, extractColors]);

    const handleMouseMove = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!cardRef.current || !isHovered) return;

            const card = cardRef.current;
            const rect = card.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;

            setMousePosition({x, y});

            const intensity = isFirst ? PARALLAX_INTENSITY_FIRST : PARALLAX_INTENSITY_OTHER;
            setParallaxTransform({
                x: x * intensity,
                y: y * intensity,
            });
        },
        [isHovered, isFirst]
    );

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setParallaxTransform({x: 0, y: 0});
        setMousePosition({x: 0, y: 0});
    }, []);

    const sizeClasses = getCardSizeClasses(position, fillWidth);
    const badgeClasses = getBadgeClasses(position);

    // Error state: show auth error placeholder
    if (error) {
        return (
            <div className={`flex flex-col items-center ${sizeClasses}`}>
                <div className="mb-2 sm:mb-4 flex flex-col items-center">
                    <span className={badgeClasses}>#{position}</span>
                </div>
                <div
                    className="aspect-square w-full bg-red-900/20 rounded-xl sm:rounded-[2rem] border border-red-500/20 flex items-center justify-center">
          <span className="text-red-400 text-xs uppercase tracking-widest text-center px-4">
            Auth Error
          </span>
                </div>
            </div>
        );
    }

    // Loading or no image: show skeleton
    if (isLoading || !track?.image) {
        return (
            <div
                className={`flex flex-col items-center transition-all duration-500 hover:-translate-y-2 ${sizeClasses}`}>
                <div className="mb-2 sm:mb-4 flex flex-col items-center">
                    <span className={badgeClasses}>#{position}</span>
                </div>
                <div
                    className="aspect-square w-full bg-white/5 animate-pulse rounded-xl sm:rounded-[2rem] border border-white/10 flex items-center justify-center">
                    <span className="text-white/20 text-xs uppercase tracking-widest">Loading...</span>
                </div>
            </div>
        );
    }

    const displayArtists =
        track.artists
            .slice(0, 2)
            .map((artist) => artist.name)
            .join(", ") + (track.artists.length > 2 ? "..." : "");

    const gradientCss = buildGradientCss(dominantColor, palette, position, isHovered);
    const neonGlowCss = buildNeonGlowCss(
        dominantColor,
        isHovered,
        mousePosition.x,
        mousePosition.y
    );
    const textShadowCss = buildTextShadowCss(dominantColor, isHovered);

    const openTrackUrl = () => window.open(track.url, "_blank");
    const borderColor = dominantColor
        ? `rgba(${dominantColor[0]},${dominantColor[1]},${dominantColor[2]},0.7)`
        : "transparent";
    const insetGlow = dominantColor
        ? `rgba(${dominantColor[0]},${dominantColor[1]},${dominantColor[2]},0.3)`
        : "transparent";

    return (
        <div
            className={`flex flex-col items-center transition-all duration-500 hover:-translate-y-2 ${sizeClasses}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            ref={cardRef}
        >
            <div className={`flex flex-col items-center ${fillWidth ? "mb-3 md:mb-4" : "mb-2 sm:mb-4"}`}>
        <span
            className={badgeClasses + (fillWidth ? " text-sm md:text-base px-3 py-1 md:px-4 md:py-1.5" : "")}
            style={{
                textShadow: textShadowCss,
                boxShadow: neonGlowCss,
                transform: isHovered
                    ? `translate(${mousePosition.x * 3}px, ${mousePosition.y * 3}px)`
                    : "translate(0, 0)",
            }}
        >
          #{position}
        </span>
            </div>

            <div
                className={`relative group w-full aspect-square rounded-xl sm:rounded-[2rem] overflow-hidden bg-neutral-900 cursor-pointer transition-all duration-500 ${fillWidth ? "min-w-0" : ""}`}
                style={{
                    boxShadow: neonGlowCss,
                    transform: isHovered
                        ? `perspective(1000px) rotateX(${mousePosition.y * 2}deg) rotateY(${-mousePosition.x * 2}deg) translateZ(0)`
                        : "perspective(1000px) rotateX(0) rotateY(0) translateZ(0)",
                }}
                onMouseMove={handleMouseMove}
            >
                <img
                    ref={imgRef}
                    src={track.image}
                    alt={track.title}
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out"
                    style={{
                        transform: isHovered
                            ? `translate3d(${parallaxTransform.x}px, ${parallaxTransform.y}px, 0) scale(1.1)`
                            : "translate3d(0, 0, 0) scale(1)",
                        transition: "transform 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
                    }}
                />

                <div
                    className="absolute inset-0 opacity-60 transition-all duration-500 group-hover:opacity-40"
                    style={{
                        background: gradientCss,
                        transform: isHovered
                            ? `translate(${parallaxTransform.x * 0.3}px, ${parallaxTransform.y * 0.3}px)`
                            : "translate(0, 0)",
                    }}
                />

                <div
                    className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 opacity-70 transition-all duration-500 group-hover:opacity-100"
                    style={{
                        borderColor,
                        boxShadow: `inset 0 0 20px ${insetGlow}`,
                        transform: isHovered
                            ? `translate(${parallaxTransform.x * 0.1}px, ${parallaxTransform.y * 0.1}px)`
                            : "translate(0, 0)",
                    }}
                />

                <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end z-10 ${fillWidth ? "p-4 md:p-6" : "p-3 sm:p-4 md:p-6"}`}
                    onClick={openTrackUrl}
                    onKeyDown={(e) => e.key === "Enter" && openTrackUrl()}
                    role="button"
                    tabIndex={0}
                >
                    <div className="flex flex-col items-center mb-1">
                        {/* Position change indicator moved above the title */}
                        {track.positionChange && (
                            <div className="transition-all duration-300"
                                 style={{
                                     textShadow: textShadowCss
                                 }}>
                                <PositionChangeIndicator change={track.positionChange}/>
                            </div>
                        )}

                        <h3
                            className={`text-white font-bold leading-tight truncate text-center w-full transition-all duration-300 ${fillWidth ? "text-base md:text-xl lg:text-2xl" : "text-sm sm:text-base md:text-xl"}`}
                            style={{
                                textShadow: textShadowCss,
                                transform: isHovered
                                    ? `translate(${mousePosition.x * 1.5}px, ${mousePosition.y * 1.5}px)`
                                    : "translate(0, 0)",
                            }}
                        >
                            {track.title}
                        </h3>
                    </div>

                    <p
                        className={`text-white/70 font-medium truncate text-center transition-all duration-300 ${fillWidth ? "mb-3 text-sm md:text-base" : "mb-2 sm:mb-4 text-xs sm:text-sm"}`}
                        title={track.artists.map((artist) => artist.name).join(", ")}
                        style={{
                            textShadow: isHovered ? "0 0 10px rgba(255,255,255,0.7)" : "none",
                            transform: isHovered
                                ? `translate(${mousePosition.x * 1.2}px, ${mousePosition.y * 1.2}px)`
                                : "translate(0, 0)",
                        }}
                    >
                        {displayArtists}
                    </p>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openTrackUrl();
                        }}
                        className={`w-full bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 cursor-pointer group-hover:scale-105 group-hover:shadow-lg relative z-20 ${fillWidth ? "py-2 sm:py-3 text-sm md:text-base" : "py-1.5 sm:py-2 text-xs sm:text-sm"}`}
                        style={{
                            boxShadow: isHovered ? "0 0 20px rgba(255,255,255,0.3)" : "none",
                            transform: isHovered
                                ? `translate(${mousePosition.x * 0.8}px, ${mousePosition.y * 0.8}px)`
                                : "translate(0, 0)",
                        }}
                    >
            <span
                className="transition-all duration-300"
                style={{textShadow: isHovered ? textShadowCss : "none"}}
            >
              Listen
            </span>
                    </button>
                </div>
            </div>

            <div
                className="w-[80%] h-2 sm:h-4 mt-2 sm:mt-4 rounded-full blur-2xl transition-all duration-500"
                style={{
                    opacity: isHovered ? 0.8 : 0.4,
                    background: dominantColor
                        ? `radial-gradient(circle, rgba(${dominantColor[0]},${dominantColor[1]},${dominantColor[2]},0.8), transparent 70%)`
                        : "radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)",
                    transform: isHovered
                        ? `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px)`
                        : "translate(0, 0)",
                }}
            />
        </div>
    );
};

export default PodiumCard;