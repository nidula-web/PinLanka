import { useState, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, X, Loader2 } from 'lucide-react';

export default function MagicSearchBar({
  onSearchChange,
  searchQuery = '',
  matchingListings = [],
  totalCount,
}) {
  const map = useMap();
  const [query, setQuery] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Keep internal query synchronized if parent updates searchQuery
  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  // Prevent Leaflet map from intercepting click, drag, scroll or key events
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearchChange) {
      onSearchChange('');
    }
    // Smoothly fly back out to full Sri Lanka overview
    map.flyTo([7.8731, 80.7718], 8, {
      animate: true,
      duration: 1.2,
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGeocodeSearch = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);

    try {
      // 1. Query Nominatim API restricted to Sri Lanka (countrycodes=LK)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&countrycodes=LK`;

      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const { lat, lon } = data[0];
          map.flyTo([parseFloat(lat), parseFloat(lon)], 14, {
            animate: true,
            duration: 1.5,
          });
          setIsLoading(false);
          return;
        }
      }

      // 2. Smart Fallback: If place not recognized by Nominatim, fly to first matching listing if available
      if (matchingListings && matchingListings.length > 0) {
        const first = matchingListings[0];
        if (first && first.lat && first.lng) {
          map.flyTo([first.lat, first.lng], 14, {
            animate: true,
            duration: 1.5,
          });
        }
      }
    } catch (err) {
      console.error('Nominatim Geocoding error:', err);
      // Fallback on error to matching listings
      if (matchingListings && matchingListings.length > 0) {
        const first = matchingListings[0];
        if (first && first.lat && first.lng) {
          map.flyTo([first.lat, first.lng], 14, {
            animate: true,
            duration: 1.5,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Stop propagation so Leaflet keyboard navigation doesn't catch keys (like space bar)
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleGeocodeSearch(e);
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 w-[92%] sm:w-[400px] z-[400] shadow-lg rounded-md"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <form
        onSubmit={handleGeocodeSearch}
        className="relative flex items-center w-full bg-white/95 backdrop-blur-md rounded-md border border-gray-200/90 px-3.5 py-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 group"
      >
        {/* Magnifying Glass or Loading Spinner */}
        <div className="flex items-center justify-center shrink-0 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-emerald-600" />
          ) : (
            <Search size={18} />
          )}
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search 'House' or 'Colombo'..."
          className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder-gray-400 font-medium px-2.5 min-w-0"
          spellCheck={false}
          autoComplete="off"
        />

        {/* Right Action Icons: Count Badge & Clear Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {query.trim().length > 0 && typeof totalCount === 'number' && (
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-block">
              {totalCount} {totalCount === 1 ? 'pin' : 'pins'}
            </span>
          )}

          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 active:scale-95 transition-all"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
