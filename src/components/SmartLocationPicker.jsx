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
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  Search,
  LocateFixed,
  Loader2,
  MapPin,
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

/**
 * Leaflet helper component to auto-center the map (FlyTo)
 */
export function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && center[0] !== undefined) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
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
  // Default to Sri Lanka center if coordinates are empty
  const initialLat = lat ? parseFloat(lat) : 7.8731;
  const initialLng = lng ? parseFloat(lng) : 80.7718;

  const [markerPosition, setMarkerPosition] = useState([initialLat, initialLng]);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [placesService, setPlacesService] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const markerRef = useRef(null);

  // Initialize Google PlacesService via @googlemaps/js-api-loader functional API
  useEffect(() => {
    let isMounted = true;

    const initGooglePlaces = async () => {
      try {
        const apiKey =
          import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD9WsGnRKKtbehjrehRer-LKy7R1LcynxY'; // The key is confirmed working

        // 1. Set global options
        setOptions({
          apiKey: apiKey,
          version: 'weekly',
        });

        // 2. Import the library directly
        const { PlacesService } = await importLibrary('places');

        if (isMounted) {
          const dummyElement = document.createElement('div');
          const service = new PlacesService(dummyElement);
          setPlacesService(service);
        }
      } catch (error) {
        console.error('Google Places init failed:', error);
      }
    };

    initGooglePlaces();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync position if incoming lat/lng props change from outside
  useEffect(() => {
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setMarkerPosition([parsedLat, parsedLng]);
      }
    }
  }, [lat, lng]);

  const updateCoordinates = useCallback(
    (newLat, newLng, newLocationName = null) => {
      const roundedLat = parseFloat(Number(newLat).toFixed(6));
      const roundedLng = parseFloat(Number(newLng).toFixed(6));
      setMarkerPosition([roundedLat, roundedLng]);
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

  // 1. Search location handler via Google PlacesService textSearch
  const handleSearchLocation = () => {
    if (!searchText.trim() || !placesService) return;
    setIsSearching(true);
    setFeedback('');

    const request = {
      query: searchText.trim() + ' Sri Lanka',
    };

    placesService.textSearch(request, async (results, status) => {
      if (
        (status === window.google?.maps?.places?.PlacesServiceStatus?.OK || status === 'OK') &&
        results &&
        results.length > 0
      ) {
        setIsSearching(false);
        const place = results[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const parsedLat = parseFloat(Number(lat).toFixed(6));
        const parsedLng = parseFloat(Number(lng).toFixed(6));

        const formattedAddress = place.formatted_address || place.name || searchText.trim();
        updateCoordinates(parsedLat, parsedLng, formattedAddress);
        setFeedback(`📍 Set: ${place.name || formattedAddress.split(',')[0]}`);
        setTimeout(() => setFeedback(''), 4000);
      } else {
        try {
          const osmRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              searchText.trim()
            )}&countrycodes=LK`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (osmRes.ok) {
            const osmData = await osmRes.json();
            if (Array.isArray(osmData) && osmData.length > 0) {
              const { lat: oLat, lon: oLng, display_name } = osmData[0];
              const parsedLat = parseFloat(Number(oLat).toFixed(6));
              const parsedLng = parseFloat(Number(oLng).toFixed(6));
              const formattedAddress = display_name || searchText.trim();

              updateCoordinates(parsedLat, parsedLng, formattedAddress);
              setFeedback(`📍 Set: ${formattedAddress.split(',')[0]}`);
              setTimeout(() => setFeedback(''), 4000);
              setIsSearching(false);
              return;
            }
          }
        } catch (osmErr) {
          console.warn('OSM Nominatim error:', osmErr);
        }

        setIsSearching(false);
        alert('Location not found. Please try a different search term.');
      }
    });
  };

  // 2. "📍 Use My Current Location" Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setFeedback('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        updateCoordinates(userLat, userLng);

        // Reverse geocode fallback to suggest a friendly location name
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

  return (
    <div className="space-y-2.5">
      {/* Top Controls: Custom Geocoding Search Bar & Current Location Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Type a city or landmark (e.g., Nugegoda) and click Search..."
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchLocation();
                }
              }}
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={handleSearchLocation}
            disabled={isSearching || !placesService}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {isSearching ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : !placesService ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Search</span>
            )}
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

      {/* Feedback Message */}
      {feedback && (
        <p className="text-[11px] font-semibold text-blue-600 animate-fade-in flex items-center gap-1">
          <Compass size={12} />
          <span>{feedback}</span>
        </p>
      )}

      {/* Mini-Map Container (height ~250px, rounded corners) */}
      <div className="relative w-full h-[250px] rounded-2xl overflow-hidden border border-gray-200/90 shadow-inner z-0 group">
        <MapContainer
          center={markerPosition}
          zoom={14}
          maxZoom={22}
          scrollWheelZoom={true}
          zoomControl={false}
          className="w-full h-full z-0 cursor-crosshair"
          attributionControl={false}
        >
          <LayersControl position="bottomleft">
            <LayersControl.BaseLayer checked name="🛰️ Satellite View">
              <TileLayer
                attribution="&copy; Google Maps"
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                maxZoom={21}
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="🗺️ Street View">
              <TileLayer
                attribution="&copy; Google Maps"
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                maxZoom={21}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Draggable Marker */}
          <Marker
            draggable={true}
            eventHandlers={markerEventHandlers}
            position={markerPosition}
            ref={markerRef}
            icon={DRAGGABLE_PIN_ICON}
          />

          <MapClickHandler onLocationChange={updateCoordinates} />
          {/* Leaflet helper component to auto-center the map (FlyTo) */}
          <MapUpdater center={markerPosition} />
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
            {markerPosition[0].toFixed(4)}, {markerPosition[1].toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
