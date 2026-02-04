import { useState, useEffect } from "react";

import { MagnifyingGlassLeftRoundedIcon } from "../assets/icons/MagnifyingGlassLeftRoundedIcon";

/** Props for the search input (controlled from parent, debounced locally). */
interface SearchBarProps {
  className?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/** Debounce delay in ms before syncing local input to parent. */
const SEARCH_DEBOUNCE_MS = 200;

/**
 * Search input with debounced sync to parent. Clears on button click.
 */
const SearchBar = ({
  className = "",
  searchQuery,
  setSearchQuery,
}: SearchBarProps) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  const handleClear = () => {
    setLocalQuery("");
    setSearchQuery("");
  };

  return (
    <div
      className={`flex items-center bg-white/5 rounded-full px-3 sm:px-4 py-2 border border-white/5 focus-within:bg-white/10 focus-within:border-white/10 focus-within:ring-1 focus-within:ring-white/20 transition-all w-full max-w-md shadow-inner min-w-0 ${className}`}
    >
      <MagnifyingGlassLeftRoundedIcon className="text-white/40 mr-2 sm:mr-3 shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
      <input
        type="text"
        value={localQuery}
        onChange={(event) => setLocalQuery(event.target.value)}
        placeholder="Search global charts..."
        className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 w-full font-sans tracking-tight min-w-0"
      />
      {localQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="text-white/40 hover:text-white/70 ml-2 transition-colors"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;
