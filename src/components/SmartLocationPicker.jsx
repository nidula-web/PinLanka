import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  LocateFixed,
  Loader2,
  MapPin,
  Check,
  Compass,
} from 'lucide-react';

// Custom sleek draggable pin icon
const DRAGGABLE_PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    width: 38px;
    height: 38px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg) translate(8px, -8px);
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    transition: transform 0.15s ease;
  ">
    <div style="
      transform: rotate(45deg);
      width: 14px;
      height: 14px;
      background: #10b981;
      border-radius: 50%;
      border: 2px solid #ffffff;
    "></div>
  </div>`,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Helper component to smoothly animate mini-map center
function MapFlyController({ center, zoom = 15 }) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { animate: true, duration: 1.2 });
    }
  }, [center, zoom, map]);

  return null;
}

// Ensure Leaflet recalculates dimensions when rendered inside a modal
function InvalidateSizeEffect() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Allow tapping/clicking anywhere on the mini-map to position the pin
function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function SmartLocationPicker({
  lat,
  lng,
  onLocationChange,
  locationName = '',
  onLocationNameChange,
}) {
  // Default to Colombo center if coordinates are empty
  const initialLat = lat ? parseFloat(lat) : 6.9271;
  const initialLng = lng ? parseFloat(lng) : 79.8612;

  const [position, setPosition] = useState({ lat: initialLat, lng: initialLng });
  const [flyTarget, setFlyTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');
  const markerRef = useRef(null);

  // Sync position if incoming lat/lng props change from outside
  useEffect(() => {
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setPosition({ lat: parsedLat, lng: parsedLng });
      }
    }
  }, [lat, lng]);

  const updateCoordinates = useCallback(
    (newLat, newLng, newLocationName = null) => {
      const roundedLat = parseFloat(Number(newLat).toFixed(6));
      const roundedLng = parseFloat(Number(newLng).toFixed(6));
      setPosition({ lat: roundedLat, lng: roundedLng });
      onLocationChange(roundedLat, roundedLng);

      if (newLocationName && onLocationNameChange) {
        onLocationNameChange(newLocationName);
      }
    },
    [onLocationChange, onLocationNameChange]
  );

  // Marker drag end handler
  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          updateCoordinates(newLatLng.lat, newLatLng.lng);
        }
      },
    }),
    [updateCoordinates]
  );

  // 1. "📍 Use My Current Location" Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setSearchFeedback('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        updateCoordinates(userLat, userLng);
        setFlyTarget([userLat, userLng]);

        // Reverse geocode to suggest a friendly location name if field is empty
        try {
          const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`;
          const res = await fetch(revUrl, {
            headers: { 'Accept-Language': 'en' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name && (!locationName || locationName === 'Sri Lanka')) {
              const parts = data.display_name.split(',').map((s) => s.trim());
              const cleanName = parts.slice(0, 3).join(', ');
              if (onLocationNameChange) onLocationNameChange(cleanName);
            }
          }
        } catch {
          // Ignore reverse geocode failures
        }

        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not determine current location: ' + err.message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // 2. Search / Geocoding with Nominatim restricted to Sri Lanka (countrycodes=LK)
  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchFeedback('');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&countrycodes=LK`;

      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          const newLat = parseFloat(first.lat);
          const newLng = parseFloat(first.lon);

          // Clean display name for auto-fill
          const parts = first.display_name.split(',').map((s) => s.trim());
          const cleanName = parts.slice(0, 3).join(', ');

          updateCoordinates(newLat, newLng, cleanName);
          setFlyTarget([newLat, newLng]);
          setSearchFeedback(`Found: ${parts[0]}`);
          setTimeout(() => setSearchFeedback(''), 3000);
          setIsSearching(false);
          return;
        }
      }

      setSearchFeedback('Location not found in Sri Lanka. Try another keyword.');
    } catch (err) {
      console.error('Nominatim search error:', err);
      setSearchFeedback('Search failed. Please try again or drag the pin.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Top Controls: Search Bar & Current Location Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search input with Nominatim */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchLocation(e);
              }
            }}
            placeholder="Search city or street in Sri Lanka..."
            className="w-full pl-8 pr-18 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <button
            type="button"
            onClick={handleSearchLocation}
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            {isSearching ? <Loader2 size={12} className="animate-spin" /> : <span>Search</span>}
          </button>
        </div>

        {/* Use My Current Location Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="shrink-0 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          title="Detect your current GPS location"
        >
          {isLocating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <LocateFixed size={14} />
              <span>📍 Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Search Feedback Message */}
      {searchFeedback && (
        <p className="text-[11px] font-semibold text-blue-600 animate-fade-in flex items-center gap-1">
          <Compass size={12} />
          <span>{searchFeedback}</span>
        </p>
      )}

      {/* Mini-Map Container (height ~250px, rounded corners) */}
      <div className="relative w-full h-[250px] rounded-2xl overflow-hidden border border-gray-200/90 shadow-inner z-0 group">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={14}
          scrollWheelZoom={true}
          className="w-full h-full z-0 cursor-crosshair"
          attributionControl={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="🛰️ Satellite View">
              <TileLayer
                attribution="&copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="🗺️ Street View">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Draggable Marker */}
          <Marker
            draggable={true}
            eventHandlers={markerEventHandlers}
            position={[position.lat, position.lng]}
            ref={markerRef}
            icon={DRAGGABLE_PIN_ICON}
          />

          <MapClickHandler onLocationChange={updateCoordinates} />
          {flyTarget && <MapFlyController center={flyTarget} zoom={15} />}
          <InvalidateSizeEffect />
        </MapContainer>

        {/* Floating guidance overlay */}
        <div className="absolute top-2 left-2 z-[1000] bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-1 rounded-full pointer-events-none shadow-sm flex items-center gap-1">
          <span>🖐️ Drag pin or tap map to position</span>
        </div>

        {/* Coordinates badge pill at bottom */}
        <div className="absolute bottom-2 right-2 z-[1000] bg-white/95 backdrop-blur-xs text-gray-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-sm border border-gray-200/80 pointer-events-none flex items-center gap-1">
          <MapPin size={11} className="text-emerald-600" />
          <span>
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
