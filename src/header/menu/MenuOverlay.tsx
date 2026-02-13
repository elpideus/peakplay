import { useState } from "react";
import { OpenInNewIcon } from "../../assets/icons/OpenInNewIcon.tsx";
import { GithubIcon } from "../../assets/icons/GithubIcon.tsx";
import { FavoriteRoundedIcon } from "../../assets/icons/FavoriteRoundedIcon.tsx";
import { FolderIcon } from "../../assets/icons/FolderIcon.tsx";

/**
 * wlogout-style full-screen overlay.
 * Renders when open; use onClose to dismiss (backdrop or close button).
 */
interface MenuOverlayProps {
  open: boolean;
  onClose: () => void;
}

const MenuOverlay = ({ open, onClose }: MenuOverlayProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!open) return null;

  return (
      <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
      >
        <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 -z-10 cursor-pointer"
            onClick={onClose}
        />

        <div
            className="relative w-[92vw] sm:w-[85vw] md:w-[80vw] max-w-[90vw] max-h-[85vh] sm:max-h-[90vh] rounded-xl sm:rounded-2xl bg-black/60 border border-white/20 shadow-2xl p-4 sm:p-6 md:p-8 overflow-auto flex flex-col mb-4 sm:mb-5"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 flex items-center justify-center p-2">
            <div className="w-full h-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 auto-rows-fr font-satoshi">
              <div
                  className="group aspect-square relative rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 flex flex-col items-center justify-center text-white/70 text-sm p-4 box-border transition-all duration-500 cursor-pointer overflow-hidden"
                  onMouseEnter={() => setHoveredIndex(0)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => window.open("https://revolut.me/elpideus", "_blank", "noopener,noreferrer") }
                  style={{
                    boxShadow: hoveredIndex === 0
                        ? "0 0 30px 10px rgba(244, 63, 94, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)"
                        : "0 0 10px rgba(255, 255, 255, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.05)",
                    transform: hoveredIndex === 0 ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
              >
                <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle at center, rgba(244, 63, 94, 0.2), transparent 70%)",
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <FavoriteRoundedIcon
                      className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 group-hover:scale-110 transition-all duration-500"
                      style={{
                        filter: hoveredIndex === 0 ? "drop-shadow(0 0 15px rgba(244, 63, 94, 0.5))" : "none",
                        transition: "all 0.3s ease",
                      }}
                  />
                  <span
                      className="text-base md:text-lg lg:text-xl xl:text-2xl mt-2 md:mt-4 group-hover:scale-110 transition-all duration-500"
                      style={{
                        textShadow: hoveredIndex === 0
                            ? "0 0 10px rgba(244, 63, 94, 0.5), 0 0 20px rgba(244, 63, 94, 0.3)"
                            : "none",
                      }}
                  >
                  Donate
                </span>
                </div>
              </div>
              <div
                  className="group aspect-square relative rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 flex flex-col items-center justify-center text-white/70 text-sm p-4 box-border transition-all duration-500 cursor-pointer overflow-hidden"
                  onMouseEnter={() => setHoveredIndex(1)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => window.open("https://elpideus.space", "_blank", "noopener,noreferrer") }
                  style={{
                    boxShadow: hoveredIndex === 1
                        ? "0 0 30px 10px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)"
                        : "0 0 10px rgba(255, 255, 255, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.05)",
                    transform: hoveredIndex === 1 ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
              >
                <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle at center, rgba(34, 197, 94, 0.2), transparent 70%)",
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <OpenInNewIcon
                      className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 group-hover:scale-110 transition-all duration-500"
                      style={{
                        filter: hoveredIndex === 1 ? "drop-shadow(0 0 15px rgba(34, 197, 94, 0.5))" : "none",
                        transition: "all 0.3s ease",
                      }}
                  />
                  <span
                      className="text-base md:text-lg lg:text-xl xl:text-2xl mt-2 md:mt-4 group-hover:scale-110 transition-all duration-500"
                      style={{
                        textShadow: hoveredIndex === 1
                            ? "0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3)"
                            : "none",
                      }}
                  >
                  Personal Website
                </span>
                </div>
              </div>
              <div
                  className="group aspect-square relative rounded-xl bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 flex flex-col items-center justify-center text-white/70 text-sm p-4 box-border transition-all duration-500 cursor-pointer overflow-hidden"
                  onMouseEnter={() => setHoveredIndex(2)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => window.open("https://github.com/elpideus/peakplay", "_blank", "noopener,noreferrer") }
                  style={{
                    boxShadow: hoveredIndex === 2
                        ? "0 0 30px 10px rgba(234, 179, 8, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)"
                        : "0 0 10px rgba(255, 255, 255, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.05)",
                    transform: hoveredIndex === 2 ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
              >
                <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle at center, rgba(234, 179, 8, 0.2), transparent 70%)",
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <GithubIcon
                      className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 group-hover:scale-110 transition-all duration-500"
                      style={{
                        filter: hoveredIndex === 2 ? "drop-shadow(0 0 15px rgba(234, 179, 8, 0.5))" : "none",
                        transition: "all 0.3s ease",
                      }}
                  />
                  <span
                      className="text-base md:text-lg lg:text-xl xl:text-2xl mt-2 md:mt-4 group-hover:scale-110 transition-all duration-500"
                      style={{
                        textShadow: hoveredIndex === 2
                            ? "0 0 10px rgba(234, 179, 8, 0.5), 0 0 20px rgba(234, 179, 8, 0.3)"
                            : "none",
                      }}
                  >
                  Github Repo
                </span>
                </div>
              </div>
              <div
                  className="group aspect-square relative rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 flex flex-col items-center justify-center text-white/70 text-sm p-4 box-border transition-all duration-500 cursor-pointer overflow-hidden"
                  onMouseEnter={() => setHoveredIndex(3)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => window.open("https://github.com/elpideus", "_blank", "noopener,noreferrer") }
                  style={{
                    boxShadow: hoveredIndex === 3
                        ? "0 0 30px 10px rgba(217, 70, 239, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)"
                        : "0 0 10px rgba(255, 255, 255, 0.05), inset 0 0 10px rgba(255, 255, 255, 0.05)",
                    transform: hoveredIndex === 3 ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
              >
                <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "radial-gradient(circle at center, rgba(217, 70, 239, 0.2), transparent 70%)",
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <FolderIcon
                      className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 group-hover:scale-110 transition-all duration-500"
                      style={{
                        filter: hoveredIndex === 3 ? "drop-shadow(0 0 15px rgba(217, 70, 239, 0.5))" : "none",
                        transition: "all 0.3s ease",
                      }}
                  />
                  <span
                      className="text-base md:text-lg lg:text-xl xl:text-2xl mt-2 md:mt-4 group-hover:scale-110 transition-all duration-500"
                      style={{
                        textShadow: hoveredIndex === 3
                            ? "0 0 10px rgba(217, 70, 239, 0.5), 0 0 20px rgba(217, 70, 239, 0.3)"
                            : "none",
                      }}
                  >
                  Other Projects
                </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-white/50 cursor-pointer text-xs sm:text-sm px-4 text-center" onClick={onClose}>Tap anywhere to close</div>
      </div>
  );
};

export default MenuOverlay;