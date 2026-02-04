import { useState } from "react";

import { PeakPlayIcon } from "../assets/icons/PeakPlayIcon";
import { HamburgerMenuRoundedIcon } from "../assets/icons/HamburgerMenuRoundedIcon";
import SearchBar from "./SearchBar";
import MenuOverlay from "./menu/MenuOverlay.tsx";

/** Props for the main app header (logo, search, menu). */
interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * Fixed top nav: logo, centered search bar, hamburger menu.
 * Hamburger opens a wlogout-style full-screen overlay.
 */
const Header = ({ searchQuery, setSearchQuery }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="w-screen bg-black text-white px-4 py-3 sm:px-6 sm:py-4 md:px-8 lg:px-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 border-b border-[#ffffff20] fixed z-50 safe-area-inset-top">
        <div className="flex items-center justify-between sm:justify-start flex-1 min-w-0">
          <div className="logo flex gap-1.5 sm:gap-2 text-lg sm:text-xl md:text-2xl items-center font-satoshi font-bold transition-all duration-300 shrink-0 cursor-pointer group">
            <PeakPlayIcon className="text-2xl sm:text-3xl md:text-4xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110 sm:scale-120 shrink-0" />
            <h1 className="drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] truncate">PeakPlay</h1>
          </div>

          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="main-menu cursor-pointer group p-0 border-0 bg-transparent text-inherit"
            >
              <HamburgerMenuRoundedIcon className="text-3xl transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
            </button>
          </div>
        </div>

        <SearchBar
          className="w-full sm:flex-1 sm:min-w-0 sm:max-w-md sm:mx-4 order-last sm:order-none"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="hidden sm:flex flex-1 justify-end shrink-0">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="main-menu cursor-pointer group p-0 border-0 bg-transparent text-inherit"
          >
            <HamburgerMenuRoundedIcon className="text-3xl md:text-4xl transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
          </button>
        </div>
      </nav>

      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Header;
